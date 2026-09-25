<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'
import { useScope } from '../../composables/useScope'

const { scope } = useScope()

async function pickProject() {
  const dir = await open({ directory: true, multiple: false, title: 'Select project folder' })
  if (typeof dir === 'string') {
    scope.projectDir = dir
    scope.global = false
  }
}
</script>

<template>
  <div class="scope-bar">
    <div class="segmented" role="radiogroup" aria-label="Scope">
      <button
        role="radio"
        :aria-checked="scope.global"
        :class="{ active: scope.global }"
        @click="scope.global = true"
      >
        Global
      </button>
      <button
        role="radio"
        :aria-checked="!scope.global"
        :class="{ active: !scope.global }"
        @click="scope.global = false"
      >
        Project
      </button>
    </div>
    <template v-if="!scope.global">
      <code class="path" :title="scope.projectDir ?? ''">{{ scope.projectDir ?? 'No folder selected' }}</code>
      <button class="btn" @click="pickProject">
        {{ scope.projectDir ? 'Change…' : 'Choose folder…' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.scope-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.segmented {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.segmented button {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 6px 12px;
  font: inherit;
  cursor: pointer;
}
.segmented button.active {
  background: var(--accent);
  color: var(--accent-fg);
}
.path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted);
  min-width: 0;
  direction: rtl;
  text-align: left;
}
</style>
