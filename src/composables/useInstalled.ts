import type { InstalledSkill } from '../lib/skillsCli'
import { ref, watch } from 'vue'
import { globalFlag, parseInstalled, scopeCwd } from '../lib/skillsCli'
import { useCli } from './useCli'
import { useScope } from './useScope'

const skills = ref<InstalledSkill[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let initialized = false

/** Singleton so the search view can refresh the installed list after adding. */
export function useInstalled() {
  const { exec } = useCli()
  const { scope, ready } = useScope()

  async function refresh() {
    if (!ready.value) {
      skills.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const out = await exec(['ls', '--json', ...globalFlag(scope)], scopeCwd(scope))
      skills.value = parseInstalled(out.stdout).sort((a, b) => a.name.localeCompare(b.name))
    }
    catch (e) {
      error.value = (e as Error).message
      skills.value = []
    }
    finally {
      loading.value = false
    }
  }

  /** Updates the given skills, or all skills in scope when none are passed. */
  async function update(names: string[] = []) {
    await exec(['update', ...names, scope.global ? '-g' : '-p', '-y'], scopeCwd(scope))
    await refresh()
  }

  async function remove(names: string[]) {
    await exec(['remove', ...names, ...globalFlag(scope), '-y'], scopeCwd(scope))
    await refresh()
  }

  if (!initialized) {
    initialized = true
    watch(() => [scope.global, scope.projectDir], refresh, { immediate: true })
  }

  return { skills, loading, error, refresh, update, remove }
}
