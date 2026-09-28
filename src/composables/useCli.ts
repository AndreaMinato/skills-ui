import type { CliOutput } from '../lib/skillsCli'
import { computed, ref } from 'vue'
import { cleanOutput, runSkills, summarizeError } from '../lib/skillsCli'

export interface LogEntry {
  id: number
  command: string
  output: string
  success: boolean
  at: Date
}

const pending = ref(0)
const log = ref<LogEntry[]>([])
let nextId = 0

/** Shared runner: every CLI call goes through here so busy state and log stay global. */
export function useCli() {
  const busy = computed(() => pending.value > 0)

  async function exec(args: string[], cwd?: string | null): Promise<CliOutput> {
    const command = `npx skills ${args.join(' ')}`
    pending.value++
    try {
      const out = await runSkills(args, cwd)
      const output = [out.stdout, out.stderr].filter(Boolean).join('\n')
      log.value.unshift({
        id: nextId++,
        command,
        output: cleanOutput(output),
        success: out.success,
        at: new Date(),
      })
      if (!out.success)
        throw new Error(summarizeError(output) || `Exit code ${out.code}`)
      return out
    }
    catch (e) {
      // invoke() itself rejected (spawn failure) — still surface it in the log
      if (!(e instanceof Error))
        log.value.unshift({ id: nextId++, command, output: String(e), success: false, at: new Date() })
      throw e instanceof Error ? e : new Error(String(e))
    }
    finally {
      pending.value--
    }
  }

  function clearLog() {
    log.value = []
  }

  return { busy, log, exec, clearLog }
}
