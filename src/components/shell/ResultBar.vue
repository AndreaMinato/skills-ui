<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useCli } from '../../composables/useCli'
import { outcomeSummary, runningLabel } from '../../lib/resultBar'

/** How long an `ok` outcome stays before the bar hides itself */
const OK_HIDE_MS = 5000

const { latestMutating, dismissLatestMutating } = useCli()

const expanded = ref(false)
const showFull = ref(false)

const entry = computed(() =>
  latestMutating.value?.status === 'finished' ? latestMutating.value.entry : null)

const outcome = computed(() => entry.value?.outcome ?? null)

const summary = computed(() => {
  const latest = latestMutating.value
  if (!latest)
    return ''
  return latest.status === 'running'
    ? runningLabel(latest.verb)
    : outcomeSummary(latest.verb, latest.entry.outcome, latest.entry.notable.length)
})

const icon = computed(() => {
  if (outcome.value === 'failed')
    return '✗'
  return outcome.value === 'needs-attention' ? '!' : '✓'
})

let hideTimer: ReturnType<typeof setTimeout> | undefined

function cancelAutoHide() {
  clearTimeout(hideTimer)
  hideTimer = undefined
}

// Keyed on id + status so a new command, or the same one finishing, resets the bar
watch(
  () => latestMutating.value && `${latestMutating.value.id}:${latestMutating.value.status}`,
  () => {
    cancelAutoHide()
    showFull.value = false
    expanded.value = outcome.value === 'needs-attention' || outcome.value === 'failed'
    if (outcome.value === 'ok')
      hideTimer = setTimeout(dismissLatestMutating, OK_HIDE_MS)
  },
  { immediate: true },
)

onUnmounted(cancelAutoHide)

function toggleExpanded() {
  expanded.value = !expanded.value
  // Someone reading the details should not have them vanish
  if (expanded.value)
    cancelAutoHide()
}

function dismiss() {
  cancelAutoHide()
  dismissLatestMutating()
}
</script>

<template>
  <!-- Always mounted so the live region exists before its text changes -->
  <div v-show="latestMutating" class="result-bar" :class="outcome ?? 'running'">
    <div class="line">
      <span v-if="!entry" class="spinner" aria-hidden="true" />
      <span v-else class="icon" aria-hidden="true">{{ icon }}</span>
      <span class="summary" role="status" aria-live="polite">{{ summary }}</span>
      <template v-if="entry">
        <button
          class="btn small ghost"
          type="button"
          :aria-expanded="expanded"
          aria-controls="result-bar-details"
          @click="toggleExpanded"
        >
          {{ expanded ? 'Hide details' : 'Show details' }}
        </button>
        <button class="btn small ghost" type="button" @click="dismiss">
          Dismiss
        </button>
      </template>
    </div>

    <div v-if="entry && expanded" id="result-bar-details" class="details">
      <p v-if="outcome === 'failed'" class="failure">
        {{ entry.error }}
      </p>
      <ul v-else-if="entry.notable.length" class="notable">
        <li v-for="(line, i) in entry.notable" :key="i">
          {{ line }}
        </li>
      </ul>
      <template v-if="entry.output">
        <button
          class="btn small"
          type="button"
          :aria-expanded="showFull"
          aria-controls="result-bar-output"
          @click="showFull = !showFull"
        >
          {{ showFull ? 'Hide full output' : 'Show full output' }}
        </button>
        <pre v-if="showFull" id="result-bar-output" class="output">{{ entry.output }}</pre>
      </template>
      <p v-else-if="outcome === 'ok'" class="muted none">
        No output.
      </p>
    </div>
  </div>
</template>

<style scoped>
.result-bar {
  --tone: var(--accent);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 40vh;
  font-size: 13px;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--tone) 12%, var(--surface));
}
.result-bar.ok {
  --tone: var(--ok);
}
.result-bar.needs-attention {
  /* Amber fallback until style.css has a shared variable for it */
  --tone: var(--warn, #d97706);
}
.result-bar.failed {
  --tone: var(--danger);
}
.line {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
}
.summary {
  flex: 1;
  min-width: 0;
}
.icon {
  width: 12px;
  text-align: center;
  font-weight: 700;
  color: var(--tone);
}
.failed .summary {
  color: var(--danger);
}
.details {
  min-height: 0;
  overflow: auto;
  padding: 0 20px 12px;
}
.notable,
.failure,
.none {
  margin: 0 0 10px;
}
.notable {
  list-style: none;
  padding: 0;
}
.notable li,
.failure,
.output {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.failure {
  color: var(--danger);
}
.output {
  margin: 10px 0 0;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
}
</style>
