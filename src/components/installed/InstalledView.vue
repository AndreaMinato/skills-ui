<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useInstalled } from '../../composables/useInstalled'
import { useScope } from '../../composables/useScope'
import InstalledItem from './InstalledItem.vue'

const { skills, loading, error, refresh, update, remove } = useInstalled()
const { ready } = useScope()

const filter = ref('')
const working = reactive(new Set<string>())
const updatingAll = ref(false)
const actionError = ref<string | null>(null)

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q)
    return skills.value
  return skills.value.filter(s =>
    s.name.toLowerCase().includes(q) || s.source?.toLowerCase().includes(q))
})

async function track(names: string[], fn: () => Promise<void>) {
  actionError.value = null
  names.forEach(n => working.add(n))
  try {
    await fn()
  }
  catch (e) {
    actionError.value = (e as Error).message
  }
  finally {
    names.forEach(n => working.delete(n))
  }
}

async function updateAll() {
  updatingAll.value = true
  await track(skills.value.map(s => s.name), () => update())
  updatingAll.value = false
}
</script>

<template>
  <section class="view">
    <div class="toolbar">
      <input v-model="filter" class="input" type="search" placeholder="Filter installed skills…">
      <button class="btn" :disabled="loading || !ready" @click="refresh">
        Refresh
      </button>
      <button class="btn primary" :disabled="loading || !skills.length || updatingAll" @click="updateAll">
        {{ updatingAll ? 'Updating…' : 'Update all' }}
      </button>
    </div>

    <p v-if="actionError || error" class="error">
      {{ actionError || error }}
    </p>

    <p v-if="!ready" class="empty">
      Choose a project folder to see its skills.
    </p>
    <p v-else-if="loading && !skills.length" class="empty">
      <span class="spinner" /> Loading installed skills…
    </p>
    <p v-else-if="!filtered.length" class="empty">
      {{ skills.length ? 'No skills match the filter.' : 'No skills installed in this scope.' }}
    </p>
    <template v-else>
      <p class="count">
        {{ filtered.length }} of {{ skills.length }} skills
      </p>
      <ul class="list">
        <InstalledItem
          v-for="skill in filtered"
          :key="skill.path"
          :skill="skill"
          :working="working.has(skill.name)"
          @update="track([skill.name], () => update([skill.name]))"
          @remove="track([skill.name], () => remove([skill.name]))"
        />
      </ul>
    </template>
  </section>
</template>

<style scoped>
.count {
  color: var(--muted);
  font-size: 12px;
  margin: 0 0 8px;
}
</style>
