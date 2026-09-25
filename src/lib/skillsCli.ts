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
