import type { MutatingVerb, Outcome } from './skillsCli'

const NAME: Record<MutatingVerb, string> = {
  add: 'Add',
  update: 'Update',
  remove: 'Remove',
}

/**
 * One-line outcome of a finished mutating command, e.g. "Update finished · 2 warnings".
 * `notableCount` is the number of notable lines; it is never parsed from CLI text.
 */
export function outcomeSummary(verb: MutatingVerb, outcome: Outcome, notableCount: number): string {
  if (outcome === 'failed')
    return `${NAME[verb]} failed`
  if (outcome === 'ok' || notableCount < 1)
    return `${NAME[verb]} finished`
  return `${NAME[verb]} finished · ${notableCount} ${notableCount === 1 ? 'warning' : 'warnings'}`
}

const RUNNING: Record<MutatingVerb, string> = {
  add: 'Adding…',
  update: 'Updating…',
  remove: 'Removing…',
}

/** Progress line of the result bar while a mutating command runs. */
export function runningLabel(verb: MutatingVerb): string {
  return RUNNING[verb]
}
