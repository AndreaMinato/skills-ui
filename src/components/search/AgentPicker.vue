<script setup lang="ts">
import { computed, ref } from 'vue'
import { AGENT_IDS, POPULAR_AGENTS } from '../../lib/agents'

const props = defineProps<{
  /** Agents used by installed skills, offered as a one-click preset. */
  suggested: string[]
}>()

const model = defineModel<string[]>({ required: true })

const filter = ref('')
const showAll = ref(false)

const selectedSet = computed(() => new Set(model.value))

const options = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (q)
    return AGENT_IDS.filter(id => id.includes(q))
  if (showAll.value)
    return [...POPULAR_AGENTS, ...AGENT_IDS.filter(id => !POPULAR_AGENTS.includes(id))]
  return POPULAR_AGENTS
})

/** Lets users type an id the bundled list doesn't know yet. */
const customId = computed(() => {
  const q = filter.value.trim().toLowerCase()
  return q && /^[a-z0-9-]+$/.test(q) && !(AGENT_IDS as readonly string[]).includes(q) ? q : null
})

const canUseSuggested = computed(() =>
  props.suggested.length > 0 && props.suggested.join() !== [...model.value].sort().join())

function toggle(id: string) {
  model.value = selectedSet.value.has(id)
    ? model.value.filter(a => a !== id)
    : [...model.value, id]
}

function addCustom() {
  if (customId.value && !selectedSet.value.has(customId.value))
    model.value = [...model.value, customId.value]
  filter.value = ''
}
</script>

<template>
  <details class="picker">
    <summary>
      <span class="label">Install to</span>
      <span v-if="!model.length" class="muted">auto-detected agents</span>
      <span v-for="id in model" :key="id" class="chip selected">{{ id }}</span>
    </summary>

    <div class="body">
      <div class="controls">
        <input
          v-model="filter"
          class="input"
          type="search"
          placeholder="Filter agents, or type a custom id + Enter"
          @keydown.enter.prevent="addCustom"
        >
        <button v-if="canUseSuggested" class="btn small" type="button" @click="model = [...suggested]">
          Use installed ({{ suggested.length }})
        </button>
        <button class="btn small" type="button" :disabled="!model.length" @click="model = []">
          Auto-detect
        </button>
      </div>

      <div class="options">
        <label v-for="id in options" :key="id" class="option" :class="{ on: selectedSet.has(id) }">
          <input type="checkbox" :checked="selectedSet.has(id)" @change="toggle(id)">
          {{ id }}
        </label>
        <button v-if="customId" class="option custom" type="button" @click="addCustom">
          + {{ customId }}
        </button>
      </div>

      <button v-if="!filter" class="btn ghost small" type="button" @click="showAll = !showAll">
        {{ showAll ? 'Show popular only' : `Show all ${AGENT_IDS.length} agents` }}
      </button>
    </div>
  </details>
</template>

<style scoped>
.picker {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  margin-bottom: 12px;
}
summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
}
.label {
  font-weight: 600;
  margin-right: 4px;
}
.chip.selected {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--fg);
}
.body {
  border-top: 1px solid var(--border);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.controls {
  display: flex;
  gap: 6px;
  align-items: center;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 180px;
  overflow: auto;
}
.option {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-size: 12px;
  padding: 3px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: var(--fg);
}
.option.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.option input {
  margin: 0;
}
.option.custom {
  border-style: dashed;
}
.body > .btn {
  align-self: flex-start;
}
</style>
