import { describe, expect, it } from 'vitest'
import { classifyOutcome, CliError, commandKind, countNotable, ignoreCliError, mutatingVerb, notableLines, parseSkillNames, spawnFailureMessage } from './skillsCli'

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

/** Text of each notable line, bullets included */
function texts(cleaned: string): string[] {
  return notableLines(cleaned).map(line => line.text)
}

describe('notableLines', () => {
  it('picks the warning, its bullet and the skipping line from an update that exits 0', () => {
    expect(texts(UPDATE_WITH_DELETED_UPSTREAM)).toEqual([
      'Warning: The following skills from mattpocock/skills appear to have been deleted upstream:',
      '• resolving-merge-conflicts',
      'Skipping deletion in non-interactive mode.',
    ])
  })

  it('finds nothing notable in a clean update', () => {
    expect(texts('Found 1 global update(s)\nUpdating tdd…\n  ✓ Updated tdd')).toEqual([])
  })

  it('matches warnings regardless of case and indentation', () => {
    expect(texts('  WARNING: lockfile is stale\nwarning - no agents detected')).toEqual([
      'WARNING: lockfile is stale',
      'warning - no agents detected',
    ])
  })

  it('does not treat a mid-line mention of a warning as notable', () => {
    expect(texts('Finished with no warning')).toEqual([])
  })

  it('matches skipped and deleted-upstream lines anywhere in the line', () => {
    expect(texts('  ✓ Updated tdd\n  ○ Skipped antfu (no changes)\nvue was deleted upstream')).toEqual([
      '○ Skipped antfu (no changes)',
      'vue was deleted upstream',
    ])
  })

  it('keeps every bullet style listed under a warning, and stops at the first other line', () => {
    const output = 'Warning: could not update:\n  • one\n  - two\n  * three\nDone\n  • not under a warning'
    expect(texts(output)).toEqual(['Warning: could not update:', '• one', '- two', '* three'])
  })

  it('sees through the box-drawing prefix the CLI puts in front of its lines', () => {
    const output = '│  Warning: could not update:\n│    • one\n│    - two\n│  Skipping deletion in non-interactive mode.\n│  Done'
    expect(texts(output)).toEqual([
      'Warning: could not update:',
      '• one',
      '- two',
      'Skipping deletion in non-interactive mode.',
    ])
    expect(countNotable(notableLines(output))).toBe(2)
  })

  it('does not treat a box-prefixed bullet as notable when it is not under a notable line', () => {
    expect(texts('│  Installed:\n│    • tdd')).toEqual([])
  })

  it('does not treat a skill whose name merely contains a skip word as notable', () => {
    expect(texts('  ✓ Updated unskippedthing\n  ✓ Updated noskipping-here\n  ✓ Updated skippedx')).toEqual([])
  })

  it('matches skip words as whole words, regardless of case', () => {
    expect(texts('SKIPPED: antfu\ntdd (skipping)')).toEqual(['SKIPPED: antfu', 'tdd (skipping)'])
  })

  it('ignores bullets that are not under a notable line', () => {
    expect(texts('Installed:\n  • tdd\n  • antfu')).toEqual([])
  })
})

describe('countNotable', () => {
  it('counts the warning and the skipping line, not the bullet listed under the warning', () => {
    expect(countNotable(notableLines(UPDATE_WITH_DELETED_UPSTREAM))).toBe(2)
  })

  it('counts one warning however many bullets it lists', () => {
    expect(countNotable(notableLines('Warning: could not update:\n  • one\n  - two\n  * three'))).toBe(1)
  })

  it('is zero when nothing is notable', () => {
    expect(countNotable(notableLines('Updating tdd…\n  ✓ Updated tdd'))).toBe(0)
  })
})

describe('classifyOutcome', () => {
  it('is needs attention when the command exits 0 with notable lines', () => {
    expect(classifyOutcome(true, notableLines(UPDATE_WITH_DELETED_UPSTREAM))).toBe('needs-attention')
  })

  it('is ok when the command exits 0 with nothing notable', () => {
    expect(classifyOutcome(true, notableLines('Updating tdd…\n  ✓ Updated tdd'))).toBe('ok')
  })

  it('is failed when the command does not succeed, whatever it printed', () => {
    expect(classifyOutcome(false, notableLines(UPDATE_WITH_DELETED_UPSTREAM))).toBe('failed')
    expect(classifyOutcome(false, [])).toBe('failed')
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

describe('mutatingVerb', () => {
  it('is the verb of a mutating command', () => {
    expect(mutatingVerb(['add', 'mattpocock/skills', '-g', '-y'])).toBe('add')
    expect(mutatingVerb(['update', '-g', '-y'])).toBe('update')
    expect(mutatingVerb(['remove', 'tdd', '-y'])).toBe('remove')
  })

  it('is null for a read command', () => {
    expect(mutatingVerb(['ls', '--json', '-g'])).toBeNull()
    expect(mutatingVerb([])).toBeNull()
  })
})

describe('spawnFailureMessage', () => {
  it('is the message of the error, without the "Error:" prefix', () => {
    expect(spawnFailureMessage(new Error('failed to spawn npx: No such file or directory'))).toBe('failed to spawn npx: No such file or directory')
  })

  it('takes a rejection that is a plain string as it is', () => {
    expect(spawnFailureMessage('failed to spawn npx: No such file or directory')).toBe('failed to spawn npx: No such file or directory')
  })

  it('drops an "Error:" prefix that is already part of the text', () => {
    expect(spawnFailureMessage('Error: failed to spawn npx')).toBe('failed to spawn npx')
  })

  it('cleans the text like normal command output', () => {
    expect(spawnFailureMessage('\x1B[31mfailed to spawn npx\x1B[0m\n│\n')).toBe('failed to spawn npx')
  })

  it('still says something when the rejection carries no text', () => {
    expect(spawnFailureMessage('')).toBe('Could not run the command')
  })
})

describe('ignoreCliError', () => {
  it('swallows the error of a failed command', () => {
    expect(() => ignoreCliError(new CliError('Exit code 1'))).not.toThrow()
  })

  it('rethrows anything else', () => {
    const bug = new TypeError('x is not a function')
    expect(() => ignoreCliError(bug)).toThrow(bug)
    expect(() => ignoreCliError('nope')).toThrow('nope')
  })
})

describe('CliError', () => {
  it('is an Error carrying the short error text', () => {
    const error = new CliError('Exit code 1')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Exit code 1')
    expect(error.name).toBe('CliError')
  })
})

describe('parseSkillNames', () => {
  it('splits names on spaces and commas', () => {
    expect(parseSkillNames('pr-review commit')).toEqual(['pr-review', 'commit'])
    expect(parseSkillNames(' pr-review,  commit ,tdd')).toEqual(['pr-review', 'commit', 'tdd'])
  })

  it('means every skill when left empty', () => {
    expect(parseSkillNames('')).toEqual([])
    expect(parseSkillNames('   ')).toEqual([])
  })

  it('means every skill when the user types all or *', () => {
    expect(parseSkillNames('all')).toEqual([])
    expect(parseSkillNames(' ALL ')).toEqual([])
    expect(parseSkillNames('*')).toEqual([])
  })

  it('keeps a skill that is merely listed next to others', () => {
    expect(parseSkillNames('all-hands commit')).toEqual(['all-hands', 'commit'])
  })
})
