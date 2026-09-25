<script setup lang="ts">
import type { SearchResult } from '../../lib/skillsApi'
import { computed, reactive, ref, watch } from 'vue'
import { useAgents } from '../../composables/useAgents'
import { useInstalled } from '../../composables/useInstalled'
import { useScope } from '../../composables/useScope'
import { useSearch } from '../../composables/useSearch'
import { MIN_QUERY_LENGTH } from '../../lib/skillsApi'
import AddPackageForm from './AddPackageForm.vue'
import AgentPicker from './AgentPicker.vue'
import SearchResultItem from './SearchResultItem.vue'

const { results, searching, searched, error, search, add } = useSearch()
const { skills } = useInstalled()
const { ready, label } = useScope()
const { selected: agents, inUse } = useAgents()

const query = ref('')
const working = reactive(new Set<string>())
const addError = ref<string | null>(null)
const lastAdded = ref<string | null>(null)

const installedNames = computed(() => new Set(skills.value.map(s => s.name)))

let debounce: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => search(q), 300)
})

function searchNow() {
  clearTimeout(debounce)
  search(query.value)
}

async function install(key: string, pkg: string, skillNames: string[]) {
  addError.value = null
  lastAdded.value = null
  working.add(key)
  try {
    await add(pkg, { skills: skillNames, agents: agents.value })
    lastAdded.value = skillNames.length ? `${pkg} (${skillNames.join(', ')})` : pkg
  }
  catch (e) {
    addError.value = (e as Error).message
  }
  finally {
    working.delete(key)
  }
}

function addResult(r: SearchResult) {
  install(r.id, r.source, [r.skillId])
}
</script>

<template>
  <section class="view">
    <form class="toolbar" @submit.prevent="searchNow">
      <input v-model="query" class="input" type="search" placeholder="Search skills.sh (e.g. react, testing, pdf)…" autofocus>
      <span v-if="searching" class="spinner" aria-label="Searching" />
    </form>

    <AgentPicker v-model="agents" :suggested="inUse" />

    <p v-if="!ready" class="error">
      Choose a project folder (or switch to Global) before adding skills.
    </p>
    <p v-else class="muted hint">
      Scope: <code>{{ label }}</code>
    </p>
    <p v-if="error || addError" class="error">
      {{ error || addError }}
    </p>
    <p v-if="lastAdded" class="success">
      Added {{ lastAdded }}.
    </p>

    <p v-if="query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH" class="empty">
      Type at least {{ MIN_QUERY_LENGTH }} characters.
    </p>
    <p v-else-if="searched && !searching && !results.length && !error" class="empty">
      No skills found.
    </p>
    <ul v-else-if="results.length" class="list">
      <SearchResultItem
        v-for="r in results"
        :key="r.id"
        :result="r"
        :installed="installedNames.has(r.skillId)"
        :working="working.has(r.id)"
        :disabled="!ready"
        @add="addResult(r)"
      />
    </ul>

    <AddPackageForm :working="working.has('manual')" :disabled="!ready" @submit="(pkg, names) => install('manual', pkg, names)" />
  </section>
</template>

<style scoped>
.toolbar {
  align-items: center;
}
.hint {
  font-size: 12px;
  margin: 0 0 10px;
}
.list {
  margin-bottom: 16px;
}
</style>
