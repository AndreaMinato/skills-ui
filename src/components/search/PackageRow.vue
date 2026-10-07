<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener'
import { packageUrl } from '../../lib/skillsApi'

defineProps<{
  pkg: string
  /** How many of the package's skills the search matched */
  matches: number
  working: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  add: []
}>()
</script>

<template>
  <li class="package">
    <div class="info">
      <strong>{{ pkg }}</strong>
      <span class="muted">{{ matches }} matching {{ matches === 1 ? 'skill' : 'skills' }}</span>
    </div>
    <div class="actions">
      <button class="btn small ghost" @click="openUrl(packageUrl(pkg))">
        View
      </button>
      <span v-if="working" class="spinner" aria-label="Installing" />
      <button class="btn small" :disabled="working || disabled" :title="`Add every skill from ${pkg}`" @click="emit('add')">
        Add package
      </button>
    </div>
  </li>
</template>

<style scoped>
.package {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 14px;
  background: var(--surface-2);
  border-radius: 10px 10px 0 0;
}
.package:last-child {
  border-radius: 10px;
}
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.info .muted {
  font-size: 12px;
}
.actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>
