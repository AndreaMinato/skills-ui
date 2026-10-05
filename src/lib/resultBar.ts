import type { MutatingVerb, Outcome } from './skillsCli'

/** How the result bar names each mutating command: once it has finished, and while it runs */
const VERB_LABELS: Record<MutatingVerb, { name: string, running: string }> = {
  add: { name: 'Add', running: 'Adding…' },
  update: { name: 'Update', running: 'Updating…' },
  remove: { name: 'Remove', running: 'Removing…' },
}

/**
 * One-line outcome of a finished mutating command, e.g. "Update finished · 2 warnings".
 * `notableCount` comes from `countNotable` (bullets excluded); it is never parsed from CLI text.
 */
export function outcomeSummary(verb: MutatingVerb, outcome: Outcome, notableCount: number): string {
  const { name } = VERB_LABELS[verb]
  if (outcome === 'failed')
    return `${name} failed`
  if (outcome === 'ok' || notableCount < 1)
    return `${name} finished`
  return `${name} finished · ${notableCount} ${notableCount === 1 ? 'warning' : 'warnings'}`
}

/** Progress line of the result bar while a mutating command runs. */
export function runningLabel(verb: MutatingVerb): string {
  return VERB_LABELS[verb].running
}
