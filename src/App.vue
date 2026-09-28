<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InstalledView from './components/installed/InstalledView.vue'
import SearchView from './components/search/SearchView.vue'
import ActivityLog from './components/shell/ActivityLog.vue'
import ScopeBar from './components/shell/ScopeBar.vue'
import UpdateBanner from './components/shell/UpdateBanner.vue'
import { useInstalled } from './composables/useInstalled'
import { useUpdater } from './composables/useUpdater'

type Tab = 'installed' | 'search'

const tab = ref<Tab>('installed')
const { skills } = useInstalled()
const { status: updaterStatus, currentVersion, checkForUpdate } = useUpdater()

onMounted(() => checkForUpdate({ silent: true }))
</script>

<template>
  <div class="app">
    <div class="top">
      <header class="topbar">
        <h1>Skills</h1>
        <button
          class="version"
          title="Check for updates"
          :disabled="updaterStatus === 'checking' || updaterStatus === 'downloading'"
          @click="checkForUpdate()"
        >
          {{ updaterStatus === 'checking' ? 'Checking…' : currentVersion ? `v${currentVersion}` : 'Check for updates' }}
        </button>
        <nav class="tabs">
          <button :class="{ active: tab === 'installed' }" @click="tab = 'installed'">
            Installed <span class="badge">{{ skills.length }}</span>
          </button>
          <button :class="{ active: tab === 'search' }" @click="tab = 'search'">
            Browse &amp; add
          </button>
        </nav>
        <ScopeBar class="scope" />
      </header>
      <UpdateBanner />
    </div>

    <main class="content">
      <InstalledView v-if="tab === 'installed'" />
      <SearchView v-else />
    </main>

    <aside class="sidebar">
      <ActivityLog />
    </aside>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: auto 1fr;
  height: 100vh;
}
.top {
  grid-column: 1 / -1;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
h1 {
  font-size: 16px;
  margin: 0;
}
.version {
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  margin-left: -12px;
  white-space: nowrap;
}
.version:hover:not(:disabled) {
  color: var(--fg);
}
.tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.tabs button {
  white-space: nowrap;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.tabs button.active {
  background: var(--surface-2);
  color: var(--fg);
}
.badge {
  font-size: 11px;
  background: var(--border);
  border-radius: 999px;
  padding: 1px 6px;
  margin-left: 4px;
}
.scope {
  margin-left: auto;
  min-width: 0;
}
.content {
  overflow: auto;
  padding: 20px;
}
.sidebar {
  border-left: 1px solid var(--border);
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
@media (max-width: 820px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr 220px;
  }
  .topbar {
    flex-wrap: wrap;
  }
  .sidebar {
    border-left: 0;
    border-top: 1px solid var(--border);
  }
}
</style>
