import { describe, expect, it } from 'vitest'
import { classifyOutcome, commandKind, notableLines } from './skillsCli'

const UPDATE_WITH_DELETED_UPSTREAM = `Checking skills from source: mattpocock/skills
  Skill paths changed; resolving via Git clone
Warning: The following skills from mattpocock/skills appear to have been deleted upstream:
  • resolving-merge-conflicts
Skipping deletion in non-interactive mode.
Found 10 global update(s)
Updating antfu…
  ✓ Updated antfu
Updating tdd…
  ✓ Updated tdd`

describe('notableLines', () => {
  it('picks the warning, its bullet and the skipping line from an update that exits 0', () => {
    expect(notableLines(UPDATE_WITH_DELETED_UPSTREAM)).toEqual([
      'Warning: The following skills from mattpocock/skills appear to have been deleted upstream:',
      '• resolving-merge-conflicts',
      'Skipping deletion in non-interactive mode.',
    ])
  })

  it('finds nothing notable in a clean update', () => {
    expect(notableLines('Found 1 global update(s)\nUpdating tdd…\n  ✓ Updated tdd')).toEqual([])
  })

  it('matches warnings regardless of case and indentation', () => {
    expect(notableLines('  WARNING: lockfile is stale\nwarning - no agents detected')).toEqual([
      'WARNING: lockfile is stale',
      'warning - no agents detected',
    ])
  })

  it('does not treat a mid-line mention of a warning as notable', () => {
    expect(notableLines('Finished with no warning')).toEqual([])
  })

  it('matches skipped and deleted-upstream lines anywhere in the line', () => {
    expect(notableLines('  ✓ Updated tdd\n  ○ Skipped antfu (no changes)\nvue was deleted upstream')).toEqual([
      '○ Skipped antfu (no changes)',
      'vue was deleted upstream',
    ])
  })

  it('keeps every bullet style listed under a warning, and stops at the first other line', () => {
    const output = 'Warning: could not update:\n  • one\n  - two\n  * three\nDone\n  • not under a warning'
    expect(notableLines(output)).toEqual(['Warning: could not update:', '• one', '- two', '* three'])
  })

  it('ignores bullets that are not under a notable line', () => {
    expect(notableLines('Installed:\n  • tdd\n  • antfu')).toEqual([])
  })
})

describe('classifyOutcome', () => {
  it('is needs attention when the command exits 0 with notable lines', () => {
    expect(classifyOutcome(true, UPDATE_WITH_DELETED_UPSTREAM)).toBe('needs-attention')
  })

  it('is ok when the command exits 0 with nothing notable', () => {
    expect(classifyOutcome(true, 'Updating tdd…\n  ✓ Updated tdd')).toBe('ok')
  })

  it('is failed when the command does not succeed, whatever it printed', () => {
    expect(classifyOutcome(false, UPDATE_WITH_DELETED_UPSTREAM)).toBe('failed')
    expect(classifyOutcome(false, '')).toBe('failed')
  })
})

describe('commandKind', () => {
  it('treats add, update and remove as mutating commands', () => {
    expect(commandKind(['add', 'mattpocock/skills', '-g', '-y'])).toBe('mutating')
    expect(commandKind(['update', '-g', '-y'])).toBe('mutating')
    expect(commandKind(['remove', 'tdd', '-y'])).toBe('mutating')
  })

  it('treats ls and anything else as a read command', () => {
    expect(commandKind(['ls', '--json', '-g'])).toBe('read')
    expect(commandKind(['find', 'vue'])).toBe('read')
    expect(commandKind([])).toBe('read')
  })
})
