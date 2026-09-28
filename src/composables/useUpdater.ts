import type { Update } from '@tauri-apps/plugin-updater'
import { getVersion } from '@tauri-apps/api/app'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { computed, ref, shallowRef } from 'vue'

export type UpdaterStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'error'

const status = ref<UpdaterStatus>('idle')
const update = shallowRef<Update | null>(null)
const currentVersion = ref<string | null>(null)
const downloaded = ref(0)
const total = ref<number | null>(null)
const error = ref<string | null>(null)
const dismissed = ref(false)

export function useUpdater() {
  const progress = computed(() => (total.value ? Math.min(1, downloaded.value / total.value) : null))

  /** `silent` (startup check) only surfaces an available update, not "up to date" or failures. */
  async function checkForUpdate({ silent = false } = {}) {
    if (status.value === 'checking' || status.value === 'downloading')
      return
    status.value = 'checking'
    error.value = null
    dismissed.value = false
    try {
      currentVersion.value ??= await getVersion()
      update.value = await check()
      status.value = update.value ? 'available' : silent ? 'idle' : 'up-to-date'
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      status.value = silent ? 'idle' : 'error'
    }
  }

  async function installAndRestart() {
    if (!update.value)
      return
    status.value = 'downloading'
    downloaded.value = 0
    total.value = null
    try {
      await update.value.downloadAndInstall((event) => {
        if (event.event === 'Started')
          total.value = event.data.contentLength ?? null
        else if (event.event === 'Progress')
          downloaded.value += event.data.chunkLength
      })
      await relaunch()
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      status.value = 'error'
    }
  }

  function dismiss() {
    dismissed.value = true
  }

  return { status, update, currentVersion, progress, error, dismissed, checkForUpdate, installAndRestart, dismiss }
}
