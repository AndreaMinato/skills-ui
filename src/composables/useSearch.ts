import type { SearchResult } from '../lib/skillsApi'
import { ref } from 'vue'
import { MIN_QUERY_LENGTH, searchSkills } from '../lib/skillsApi'
import { globalFlag, scopeCwd } from '../lib/skillsCli'
import { useCli } from './useCli'
import { useInstalled } from './useInstalled'
import { useScope } from './useScope'

export interface AddOptions {
  /** Specific skill names; empty installs every skill in the package. */
  skills?: string[]
  /** Agent ids (e.g. `claude-code`); empty lets the CLI pick detected agents. */
  agents?: string[]
}

export function useSearch() {
  const { exec } = useCli()
  const { scope } = useScope()
  const { refresh } = useInstalled()

  const results = ref<SearchResult[]>([])
  const searching = ref(false)
  const searched = ref(false)
  const error = ref<string | null>(null)
  // Drops responses from older queries that resolve after newer ones
  let requestId = 0

  async function search(query: string) {
    const q = query.trim()
    const id = ++requestId
    if (q.length < MIN_QUERY_LENGTH) {
      results.value = []
      searched.value = false
      error.value = null
      return
    }
    searching.value = true
    error.value = null
    try {
      const found = await searchSkills(q)
      if (id === requestId)
        results.value = found
    }
    catch (e) {
      if (id === requestId) {
        error.value = e instanceof Error ? e.message : String(e)
        results.value = []
      }
    }
    finally {
      if (id === requestId) {
        searching.value = false
        searched.value = true
      }
    }
  }

  async function add(pkg: string, { skills = [], agents = [] }: AddOptions = {}) {
    const args = ['add', pkg, ...globalFlag(scope), '-y']
    if (skills.length)
      args.push('--skill', ...skills)
    if (agents.length)
      args.push('--agent', ...agents)
    await exec(args, scopeCwd(scope))
    await refresh()
  }

  return { results, searching, searched, error, search, add }
}
