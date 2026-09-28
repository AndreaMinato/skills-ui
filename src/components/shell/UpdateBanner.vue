<script setup lang="ts">
import { computed } from 'vue'
import { useUpdater } from '../../composables/useUpdater'

const { status, update, currentVersion, progress, error, dismissed, installAndRestart, dismiss } = useUpdater()

const visible = computed(() =>
  !dismissed.value && ['available', 'downloading', 'error', 'up-to-date'].includes(status.value))
</script>

<template>
  <div v-if="visible" class="banner" :class="status" role="status">
    <template v-if="status === 'available' && update">
      <span>
        <strong>Skills UI {{ update.version }}</strong> is available
        <span class="muted">(you have {{ currentVersion }})</span>
      </span>
      <button class="btn small primary" @click="installAndRestart">
        Update &amp; restart
      </button>
      <button class="btn small ghost" @click="dismiss">
        Later
      </button>
    </template>

    <template v-else-if="status === 'downloading'">
      <span>Downloading {{ update?.version }}…</span>
      <progress :value="progress ?? undefined" max="1" />
    </template>

    <template v-else-if="status === 'error'">
      <span>Update failed: {{ error }}</span>
      <button class="btn small ghost" @click="dismiss">
        Dismiss
      </button>
    </template>

    <template v-else>
      <span>You're on the latest version ({{ currentVersion }}).</span>
      <button class="btn small ghost" @click="dismiss">
        OK
      </button>
    </template>
  </div>
</template>

<style scoped>
.banner {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}
.banner > span:first-child {
  flex: 1;
}
.banner.error {
  background: color-mix(in srgb, var(--danger) 12%, var(--surface));
  color: var(--danger);
}
progress {
  width: 200px;
  accent-color: var(--accent);
}
</style>
