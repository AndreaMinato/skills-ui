import type { CommandKind, Outcome } from './skillsCli'

/**
 * Whether a finished command is listed in Activity: every mutating command, plus
 * any read command that did not come out `ok`. Routine successful reads are noise.
 */
export function isListedInActivity(entry: { kind: CommandKind, outcome: Outcome }): boolean {
  return entry.kind === 'mutating' || entry.outcome !== 'ok'
}
