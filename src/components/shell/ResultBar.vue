<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useCli } from '../../composables/useCli'
import { OUTCOME_ICONS } from '../../lib/outcomeIcons'
import { outcomeSummary, runningLabel } from '../../lib/resultBar'
import { countNotable } from '../../lib/skillsCli'

/** How long an `ok` outcome stays before the bar hides itself */
const OK_HIDE_MS = 5000

const { latestMutating, dismissLatestMutating } = useCli()

const expanded = ref(false)
const showFull = ref(false)

const entry = computed(() =>
  latestMutating.value?.phase === 'finished' ? latestMutating.value.entry : null)

const outcome = computed(() => entry.value?.outcome ?? null)

const summary = computed(() => {
  const latest = latestMutating.value
  if (!latest)
    return ''
  return latest.phase === 'running'
    ? runningLabel(latest.verb)
    : outcomeSummary(latest.verb, latest.entry.outcome, countNotable(latest.entry.notable))
})

const icon = computed(() => outcome.value && OUTCOME_ICONS[outcome.value].symbol)

let hideTimer: ReturnType<typeof setTimeout> | undefined

function cancelAutoHide() {
  clearTimeout(hideTimer)
  hideTimer = undefined
}

/** (Re)starts the countdown for a collapsed `ok` bar; any other bar stays until dismissed. */
function scheduleAutoHide() {
  cancelAutoHide()
  // Someone reading the details should not have them vanish
  if (outcome.value === 'ok' && !expanded.value)
    hideTimer = setTimeout(dismissLatestMutating, OK_HIDE_MS)
}

// Keyed on id + phase so a new command, or the same one finishing, resets the bar
watch(
  () => latestMutating.value && `${latestMutating.value.id}:${latestMutating.value.phase}`,
  () => {
    showFull.value = false
    expanded.value = outcome.value === 'needs-attention' || outcome.value === 'failed'
    scheduleAutoHide()
  },
  { immediate: true },
)

onUnmounted(cancelAutoHide)

function toggleExpanded() {
  expanded.value = !expanded.value
  scheduleAutoHide()
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
        <li v-for="(line, i) in entry.notable" :key="i" :class="{ bullet: line.bullet }">
          {{ line.text }}
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
  --tone: var(--warn);
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
.notable li.bullet {
  padding-left: 2ch;
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
