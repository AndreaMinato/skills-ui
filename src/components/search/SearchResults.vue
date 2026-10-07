<script setup lang="ts">
import type { SearchResult } from '../../lib/skillsApi'
import type { InstalledSkill } from '../../lib/skillsCli'
import { computed } from 'vue'
import { useSearchLayout } from '../../composables/useSearchLayout'
import { groupByPackage, isInstalled, packageKey } from '../../lib/searchResults'
import PackageRow from './PackageRow.vue'
import SearchResultItem from './SearchResultItem.vue'

const props = defineProps<{
  results: SearchResult[]
  /** Package the query names and the search confirmed; listed first */
  pinnedPackage: string | null
  installed: InstalledSkill[]
  /** Keys of running installs: a result id, or `packageKey(pkg)` */
  working: Set<string>
  disabled?: boolean
}>()

const emit = defineEmits<{
  addSkill: [result: SearchResult]
  addPackage: [pkg: string]
}>()

const { layout } = useSearchLayout()

const groups = computed(() => groupByPackage(props.results, props.pinnedPackage))
const pinnedGroup = computed(() => groups.value.find(g => g.pkg === props.pinnedPackage))

function addingPackage(pkg: string): boolean {
  return props.working.has(packageKey(pkg))
}

function addingSkillOf(pkg: string): boolean {
  return props.results.some(r => r.source === pkg && props.working.has(r.id))
}
</script>

<template>
  <div class="results">
    <div class="layout">
      <div class="segmented" role="radiogroup" aria-label="Result layout">
        <button role="radio" :aria-checked="layout === 'grouped'" :class="{ active: layout === 'grouped' }" @click="layout = 'grouped'">
          By package
        </button>
        <button role="radio" :aria-checked="layout === 'flat'" :class="{ active: layout === 'flat' }" @click="layout = 'flat'">
          Flat
        </button>
      </div>
    </div>

    <template v-if="layout === 'grouped'">
      <ul v-for="group in groups" :key="group.pkg" class="list">
        <PackageRow
          :pkg="group.pkg"
          :matches="group.results.length"
          :working="addingPackage(group.pkg)"
          :disabled="disabled || addingSkillOf(group.pkg)"
          @add="emit('addPackage', group.pkg)"
        />
        <SearchResultItem
          v-for="r in group.results"
          :key="r.id"
          :result="r"
          grouped
          :installed="isInstalled(r, installed)"
          :working="working.has(r.id)"
          :disabled="disabled || addingPackage(r.source)"
          @add="emit('addSkill', r)"
        />
      </ul>
    </template>
    <template v-else>
      <ul v-if="pinnedGroup" class="list">
        <PackageRow
          :pkg="pinnedGroup.pkg"
          :matches="pinnedGroup.results.length"
          :working="addingPackage(pinnedGroup.pkg)"
          :disabled="disabled || addingSkillOf(pinnedGroup.pkg)"
          @add="emit('addPackage', pinnedGroup.pkg)"
        />
      </ul>
      <ul class="list">
        <SearchResultItem
          v-for="r in results"
          :key="r.id"
          :result="r"
          :installed="isInstalled(r, installed)"
          :working="working.has(r.id) || addingPackage(r.source)"
          :package-busy="addingPackage(r.source) || addingSkillOf(r.source)"
          :disabled
          @add="emit('addSkill', r)"
          @add-package="emit('addPackage', r.source)"
        />
      </ul>
    </template>
  </div>
</template>

<style scoped>
.results {
  margin-bottom: 16px;
}
.layout {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.list + .list {
  margin-top: 10px;
}
</style>
