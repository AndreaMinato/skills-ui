import type { Scope } from '../lib/skillsCli'
import { computed, reactive, watch } from 'vue'

const STORAGE_KEY = 'skills-ui:scope'

function load(): Scope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return { global: true, projectDir: null, ...JSON.parse(raw) }
  }
  catch {}
  return { global: true, projectDir: null }
}

const scope = reactive<Scope>(load())

watch(scope, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }
  catch {}
})

export function useScope() {
  /** Project scope requires a folder to run in. */
  const ready = computed(() => scope.global || !!scope.projectDir)
  const label = computed(() => (scope.global ? 'Global' : scope.projectDir ?? 'No project selected'))
  return { scope, ready, label }
}
