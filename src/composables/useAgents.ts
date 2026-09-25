import { computed, ref, watch } from 'vue'
import { AGENT_IDS, agentKey } from '../lib/agents'
import { useInstalled } from './useInstalled'

const STORAGE_KEY = 'skills-ui:agents'

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return JSON.parse(raw)
  }
  catch {}
  return []
}

/** Agents to install into; empty means "let the CLI auto-detect". */
const selected = ref<string[]>(load())

watch(selected, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }
  catch {}
})

export function useAgents() {
  const { skills } = useInstalled()

  /** Agent ids already used by installed skills in the current scope. */
  const inUse = computed(() => {
    const known = new Set<string>(AGENT_IDS)
    const ids = new Set(skills.value.flatMap(s => s.agents.map(agentKey)))
    return [...ids].filter(id => known.has(id)).sort()
  })

  return { selected, inUse }
}
