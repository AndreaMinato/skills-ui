<script setup lang="ts">
import type { SearchResult } from '../../lib/skillsApi'
import { computed, reactive, ref, watch } from 'vue'
import { useAgents } from '../../composables/useAgents'
import { useInstalled } from '../../composables/useInstalled'
import { useScope } from '../../composables/useScope'
import { useSearch } from '../../composables/useSearch'
import { confirmedQueryPackage, packageKey } from '../../lib/searchResults'
import { MIN_QUERY_LENGTH } from '../../lib/skillsApi'
import { ignoreCliError } from '../../lib/skillsCli'
import AddPackageForm from './AddPackageForm.vue'
import AgentPicker from './AgentPicker.vue'
import SearchResults from './SearchResults.vue'

const { results, searching, searched, error, search, add } = useSearch()
const { skills } = useInstalled()
const { ready, label } = useScope()
const { selected: agents, inUse } = useAgents()

const query = ref('')
const working = reactive(new Set<string>())

const queryLength = computed(() => query.value.trim().length)
const pinnedPackage = computed(() => confirmedQueryPackage(query.value, results.value))

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
  working.add(key)
  try {
    await add(pkg, { skills: skillNames, agents: agents.value })
  }
  catch (e) {
    // A failed mutating command is reported by the result bar
    ignoreCliError(e)
  }
  finally {
    working.delete(key)
  }
}

function addResult(r: SearchResult) {
  install(r.id, r.source, [r.skillId])
}

/** No skill names means every skill in the package. */
function addPackage(pkg: string) {
  install(packageKey(pkg), pkg, [])
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
    <p v-if="error" class="error">
      {{ error }}
    </p>

    <p v-if="queryLength > 0 && queryLength < MIN_QUERY_LENGTH" class="empty">
      Type at least {{ MIN_QUERY_LENGTH }} characters.
    </p>
    <p v-else-if="searched && !searching && !results.length && !error" class="empty">
      No skills found.
    </p>
    <SearchResults
      v-else-if="results.length"
      :results
      :pinned-package="pinnedPackage"
      :installed="skills"
      :working
      :disabled="!ready"
      @add-skill="addResult"
      @add-package="addPackage"
    />

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
</style>
