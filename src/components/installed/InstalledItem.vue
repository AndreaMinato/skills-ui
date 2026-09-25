<script setup lang="ts">
import type { InstalledSkill } from '../../lib/skillsCli'
import { ref } from 'vue'

defineProps<{
  skill: InstalledSkill
  working: boolean
}>()

const emit = defineEmits<{
  update: []
  remove: []
}>()

const confirming = ref(false)

function onRemove() {
  if (!confirming.value) {
    confirming.value = true
    setTimeout(() => (confirming.value = false), 3000)
    return
  }
  confirming.value = false
  emit('remove')
}
</script>

<template>
  <li class="item">
    <div class="info">
      <div class="title">
        <strong>{{ skill.name }}</strong>
        <span v-if="skill.source" class="tag">{{ skill.source }}</span>
      </div>
      <div class="meta">
        <span v-for="agent in skill.agents" :key="agent" class="chip">{{ agent }}</span>
      </div>
      <code class="path" :title="skill.path">{{ skill.path }}</code>
    </div>
    <div class="actions">
      <span v-if="working" class="spinner" aria-label="Working" />
      <button class="btn small" :disabled="working" @click="emit('update')">
        Update
      </button>
      <button class="btn small danger" :disabled="working" @click="onRemove">
        {{ confirming ? 'Confirm?' : 'Remove' }}
      </button>
    </div>
  </li>
</template>

<style scoped>
.item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
}
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title {
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}
.tag {
  color: var(--muted);
  font-size: 12px;
}
.meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.path {
  font-size: 11px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}
</style>
