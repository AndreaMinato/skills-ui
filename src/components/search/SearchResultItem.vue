<script setup lang="ts">
import type { SearchResult } from '../../lib/skillsApi'
import { openUrl } from '@tauri-apps/plugin-opener'
import { formatInstalls } from '../../lib/skillsApi'

defineProps<{
  result: SearchResult
  installed: boolean
  working: boolean
  disabled?: boolean
  /** Listed under its package's row, which already names the package and adds it whole */
  grouped?: boolean
  /** The package, or one of its skills, is already being added */
  packageBusy?: boolean
}>()

const emit = defineEmits<{
  add: []
  addPackage: []
}>()
</script>

<template>
  <li class="item">
    <div class="info">
      <strong>{{ result.name }}</strong>
      <span v-if="!grouped" class="muted">{{ result.source }}</span>
    </div>
    <span class="installs">{{ formatInstalls(result.installs) }} installs</span>
    <div class="actions">
      <button class="btn small ghost" @click="openUrl(result.url)">
        View
      </button>
      <span v-if="working" class="spinner" aria-label="Installing" />
      <button v-if="!grouped" class="btn small" :disabled="packageBusy || disabled" :title="`Add every skill from ${result.source}`" @click="emit('addPackage')">
        Add package
      </button>
      <button class="btn small primary" :disabled="working || disabled || installed" @click="emit('add')">
        {{ installed ? 'Installed' : 'Add' }}
      </button>
    </div>
  </li>
</template>

<style scoped>
.item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
}
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info .muted {
  font-size: 12px;
}
.installs {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>
