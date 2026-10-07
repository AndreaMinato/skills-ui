import { invoke } from '@tauri-apps/api/core'

export interface CliOutput {
  success: boolean
  code: number | null
  stdout: string
  stderr: string
}

export interface InstalledSkill {
  name: string
  path: string
  scope: 'global' | 'project'
  agents: string[]
  source: string | null
  sourceUrl: string | null
  sourceType: string | null
}

export interface Scope {
  global: boolean
  /** Project dir used as cwd for project-scoped commands */
  projectDir: string | null
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*\x07|[@-Z\\-_])/g

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '')
}

const SPINNER_RE = /[◒◐◓◑]/

/** Makes CLI output readable: drops ANSI, spinner frames and empty box-drawing lines. */
export function cleanOutput(text: string): string {
  return stripAnsi(text)
    .split(/\r?\n|\r/)
    .map((line) => {
      // Spinner frames are written on one line; keep only the final frame
      const frames = line.split(SPINNER_RE)
      return (frames.length > 1 ? frames[frames.length - 1] : line).replace(/│\s*$/, '').trimEnd()
    })
    .filter(line => line.replace(/[│\s]/g, ''))
    .join('\n')
}

/** Box-drawing gutter and indentation the CLI puts in front of a line */
const LINE_PREFIX_RE = /^[│\s]+/
/** Only at the start of the line: "Finished with no warning" is not one */
const WARNING_RE = /^warning/i
/** Anywhere in the line, as whole words so a skill named `unskippedthing` does not match */
const SKIP_RE = /\bskipping\b|\bskipped\b|\bdeleted upstream\b/i
const BULLET_RE = /^[•\-*]\s/

export interface NotableLine {
  /** The line without its box-drawing prefix and indentation */
  text: string
  /** A bullet listed under another notable line, not a warning of its own */
  bullet: boolean
}

/**
 * Lines of cleaned output the user should see even when the command exits 0:
 * warnings, skips, and the indented bullets listed directly under any of them.
 */
export function notableLines(cleaned: string): NotableLine[] {
  const notable: NotableLine[] = []
  let underNotable = false
  for (const line of cleaned.split('\n')) {
    const text = line.replace(LINE_PREFIX_RE, '').trimEnd()
    const own = WARNING_RE.test(text) || SKIP_RE.test(text)
    // A bullet is indented (or inside the box); one at column 0 starts something new
    const bullet = text !== line.trimEnd() && BULLET_RE.test(text)
    underNotable = own || (underNotable && bullet)
    if (underNotable)
      notable.push({ text, bullet: !own })
  }
  return notable
}

/** How many warnings/skips there are; the bullets listed under them do not count. */
export function countNotable(notable: readonly NotableLine[]): number {
  return notable.filter(line => !line.bullet).length
}

/** Result of one finished command. */
export type Outcome = 'ok' | 'needs-attention' | 'failed'

/** `success` is exit 0; `notable` comes from `notableLines` on the command's cleaned output. */
export function classifyOutcome(success: boolean, notable: readonly NotableLine[]): Outcome {
  if (!success)
    return 'failed'
  return notable.length ? 'needs-attention' : 'ok'
}

export const MUTATING_VERBS = ['add', 'update', 'remove'] as const
export type MutatingVerb = typeof MUTATING_VERBS[number]
export type CommandKind = 'mutating' | 'read'

function isMutatingVerb(word: string | undefined): word is MutatingVerb {
  return (MUTATING_VERBS as readonly (string | undefined)[]).includes(word)
}

/** The verb of a mutating command, or null for a read command. */
export function mutatingVerb(args: string[]): MutatingVerb | null {
  return isMutatingVerb(args[0]) ? args[0] : null
}

/** Mutating commands change which skills are installed; everything else only reports state. */
export function commandKind(args: string[]): CommandKind {
  return mutatingVerb(args) ? 'mutating' : 'read'
}

/** Thrown for a command that failed or could not be spawned; the result bar and Activity already show it. */
export class CliError extends Error {
  override name = 'CliError'
}

/** For a `catch` around a CLI call: swallows a `CliError`, rethrows anything else (a bug). */
export function ignoreCliError(e: unknown): void {
  if (!(e instanceof CliError))
    throw e
}

/** Readable text of a rejected spawn, cleaned like normal command output. */
export function spawnFailureMessage(e: unknown): string {
  const text = cleanOutput(e instanceof Error ? e.message : String(e))
  return text.replace(/^Error:\s*/, '') || 'Could not run the command'
}

/** Short error for the UI: from the first `■` marker on, else the last lines. */
export function summarizeError(output: string): string {
  const lines = cleanOutput(output).split('\n')
  const marker = lines.findIndex(l => l.includes('■'))
  const tail = marker >= 0 ? lines.slice(marker) : lines.slice(-6)
  return tail.map(l => l.replace(/^[│■└\s]+/, '')).filter(Boolean).slice(0, 8).join('\n')
}

export function runSkills(args: string[], cwd?: string | null): Promise<CliOutput> {
  return invoke<CliOutput>('run_skills', { args, cwd: cwd ?? null })
}

/** Interactive shells may print noise before the JSON, so slice to the array. */
export function parseInstalled(stdout: string): InstalledSkill[] {
  const start = stdout.indexOf('[')
  const end = stdout.lastIndexOf(']')
  if (start === -1 || end < start)
    throw new Error('Unexpected `skills ls --json` output')
  return JSON.parse(stdout.slice(start, end + 1))
}

/** Skill names typed into a free-text field; empty, `all` or `*` mean every skill in the package (an empty list). */
export function parseSkillNames(input: string): string[] {
  const names = input.split(/[\s,]+/).filter(Boolean)
  const everySkill = names.length === 1 && ['all', '*'].includes(names[0].toLowerCase())
  return everySkill ? [] : names
}

/** `-g` when targeting the global (user-level) install. */
export function globalFlag(scope: Scope): string[] {
  return scope.global ? ['-g'] : []
}

export function scopeCwd(scope: Scope): string | null {
  return scope.global ? null : scope.projectDir
}
