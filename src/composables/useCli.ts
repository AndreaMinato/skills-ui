import type { CliOutput, CommandKind, MutatingVerb, Outcome } from '../lib/skillsCli'
import { computed, ref } from 'vue'
import { classifyOutcome, cleanOutput, commandKind, notableLines, runSkills, summarizeError } from '../lib/skillsCli'

export interface LogEntry {
  id: number
  command: string
  /** Cleaned output (stdout + stderr), or the spawn error text */
  output: string
  kind: CommandKind
  outcome: Outcome
  /** Warning/skip lines, trimmed; may be non-empty on a failed command too */
  notable: string[]
  /** Short error text when the outcome is `failed`, else null */
  error: string | null
  /** Same as `outcome !== 'failed'` */
  success: boolean
  at: Date
}

/**
 * The most recent mutating command, for the result bar: `running` from the moment
 * it starts, then `finished` with its Activity entry. Read commands never appear here.
 */
export type LatestMutating
  = | { status: 'running', id: number, verb: MutatingVerb, command: string }
    | { status: 'finished', id: number, verb: MutatingVerb, command: string, entry: LogEntry }

const pending = ref(0)
const log = ref<LogEntry[]>([])
const latestMutating = ref<LatestMutating | null>(null)
let nextId = 0

/** Shared runner: every CLI call goes through here so busy state and log stay global. */
export function useCli() {
  const busy = computed(() => pending.value > 0)

  async function exec(args: string[], cwd?: string | null): Promise<CliOutput> {
    const command = `npx skills ${args.join(' ')}`
    const kind = commandKind(args)
    const id = nextId++
    if (kind === 'mutating')
      latestMutating.value = { status: 'running', id, verb: args[0] as MutatingVerb, command }

    function finish(success: boolean, output: string, error: string | null) {
      const entry: LogEntry = {
        id,
        command,
        output,
        kind,
        outcome: classifyOutcome(success, output),
        notable: notableLines(output),
        error,
        success,
        at: new Date(),
      }
      log.value.unshift(entry)
      // A newer mutating command may have started meanwhile; it keeps the result bar
      const latest = latestMutating.value
      if (latest?.id === id)
        latestMutating.value = { status: 'finished', id, verb: latest.verb, command, entry }
    }

    pending.value++
    try {
      const out = await runSkills(args, cwd).catch((e) => {
        // invoke() itself rejected (spawn failure) — still surface it in the log
        finish(false, String(e), String(e))
        throw e instanceof Error ? e : new Error(String(e))
      })
      const output = [out.stdout, out.stderr].filter(Boolean).join('\n')
      const error = out.success ? null : summarizeError(output) || `Exit code ${out.code}`
      finish(out.success, cleanOutput(output), error)
      if (error !== null)
        throw new Error(error)
      return out
    }
    finally {
      pending.value--
    }
  }

  function clearLog() {
    log.value = []
  }

  /** Hides the result bar; only a finished command can be dismissed. */
  function dismissLatestMutating() {
    if (latestMutating.value?.status === 'finished')
      latestMutating.value = null
  }

  return { busy, log, latestMutating, exec, clearLog, dismissLatestMutating }
}
