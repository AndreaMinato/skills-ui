import type { Outcome } from './skillsCli'

/** Symbol and accessible label for each outcome, shared by the result bar and Activity. */
export const OUTCOME_ICONS: Record<Outcome, { symbol: string, label: string }> = {
  'ok': { symbol: '✓', label: 'OK' },
  'needs-attention': { symbol: '!', label: 'Needs attention' },
  'failed': { symbol: '✗', label: 'Failed' },
}
