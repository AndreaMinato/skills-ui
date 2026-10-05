import type { CliOutput, CommandKind, MutatingVerb, NotableLine, Outcome } from '../lib/skillsCli'
import { computed, ref } from 'vue'
import { classifyOutcome, cleanOutput, CliError, commandKind, mutatingVerb, notableLines, runSkills, spawnFailureMessage, summarizeError } from '../lib/skillsCli'

export interface LogEntry {
  id: number
  command: string
  /** Cleaned output (stdout + stderr), or the spawn error text */
  output: string
  kind: CommandKind
  outcome: Outcome
  /** Warning/skip lines and the bullets under them; may be non-empty on a failed command too */
  notable: NotableLine[]
  /** Short error text when the outcome is `failed`, else null */
  error: string | null
  at: Date
}

/**
 * The most recent mutating command, for the result bar: `running` from the moment
 * it starts, then `finished` with its Activity entry. Read commands never appear here.
 */
export type LatestMutating
  = | { phase: 'running', id: number, verb: MutatingVerb, command: string }
    | { phase: 'finished', id: number, verb: MutatingVerb, command: string, entry: LogEntry }

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
    const verb = mutatingVerb(args)
    const id = nextId++
    if (verb)
      latestMutating.value = { phase: 'running', id, verb, command }

    /** `error` is the short error text of a failed command, null when it exited 0 */
    function finish(output: string, error: string | null) {
      const notable = notableLines(output)
      const entry: LogEntry = {
        id,
        command,
        output,
        kind,
        outcome: classifyOutcome(error === null, notable),
        notable,
        error,
        at: new Date(),
      }
      log.value.unshift(entry)
      // A newer mutating command may have started meanwhile; it keeps the result bar
      const latest = latestMutating.value
      if (latest?.id === id)
        latestMutating.value = { phase: 'finished', id, verb: latest.verb, command, entry }
    }

    pending.value++
    try {
      const out = await runSkills(args, cwd).catch((e) => {
        // invoke() itself rejected (spawn failure) — still surface it in the log
        const message = spawnFailureMessage(e)
        finish(message, message)
        throw new CliError(message)
      })
      const output = [out.stdout, out.stderr].filter(Boolean).join('\n')
      const error = out.success ? null : summarizeError(output) || `Exit code ${out.code}`
      finish(cleanOutput(output), error)
      if (error !== null)
        throw new CliError(error)
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
    if (latestMutating.value?.phase === 'finished')
      latestMutating.value = null
  }

  return { busy, log, latestMutating, exec, clearLog, dismissLatestMutating }
}
