<script setup lang="ts">
import { useCli } from '../../composables/useCli'

const { log, busy, clearLog } = useCli()

function time(d: Date) {
  return d.toLocaleTimeString()
}
</script>

<template>
  <section class="activity">
    <header>
      <h2>Activity <span v-if="busy" class="spinner" aria-label="Running" /></h2>
      <button v-if="log.length" class="btn ghost small" @click="clearLog">
        Clear
      </button>
    </header>
    <p v-if="!log.length" class="muted">
      Commands you run appear here.
    </p>
    <ul v-else>
      <li v-for="entry in log" :key="entry.id">
        <details>
          <summary>
            <span :class="entry.success ? 'ok' : 'fail'">{{ entry.success ? '✓' : '✗' }}</span>
            <code>{{ entry.command }}</code>
            <time>{{ time(entry.at) }}</time>
          </summary>
          <pre>{{ entry.output || '(no output)' }}</pre>
        </details>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.activity {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
h2 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
}
li + li {
  border-top: 1px solid var(--border);
}
summary {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 6px 0;
  cursor: pointer;
  font-size: 12px;
}
summary code {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
time {
  color: var(--muted);
}
.ok {
  color: var(--ok);
}
.fail {
  color: var(--danger);
}
pre {
  margin: 0 0 8px;
  padding: 8px;
  background: var(--surface-2);
  border-radius: 6px;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow: auto;
}
</style>
