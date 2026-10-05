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

const NOTABLE_RE = /^warning|skipping|skipped|deleted upstream/i
const BULLET_RE = /^\s+[•\-*]\s/

/**
 * Lines of cleaned output the user should see even when the command exits 0:
 * warnings, skips, and the indented bullets listed directly under them. Returned trimmed.
 */
export function notableLines(cleaned: string): string[] {
  const notable: string[] = []
  let underNotable = false
  for (const line of cleaned.split('\n')) {
    const text = line.trim()
    underNotable = NOTABLE_RE.test(text) || (underNotable && BULLET_RE.test(line))
    if (underNotable)
      notable.push(text)
  }
  return notable
}

/** Result of one finished command. */
export type Outcome = 'ok' | 'needs-attention' | 'failed'

/** `success` is exit 0; `cleaned` is the command's output after `cleanOutput`. */
export function classifyOutcome(success: boolean, cleaned: string): Outcome {
  if (!success)
    return 'failed'
  return notableLines(cleaned).length ? 'needs-attention' : 'ok'
}

export const MUTATING_VERBS = ['add', 'update', 'remove'] as const
export type MutatingVerb = typeof MUTATING_VERBS[number]
export type CommandKind = 'mutating' | 'read'

/** Mutating commands change which skills are installed; everything else only reports state. */
export function commandKind(args: string[]): CommandKind {
  return (MUTATING_VERBS as readonly string[]).includes(args[0]) ? 'mutating' : 'read'
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

/** `-g` when targeting the global (user-level) install. */
export function globalFlag(scope: Scope): string[] {
  return scope.global ? ['-g'] : []
}

export function scopeCwd(scope: Scope): string | null {
  return scope.global ? null : scope.projectDir
}
