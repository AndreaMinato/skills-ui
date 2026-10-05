import { describe, expect, it } from 'vitest'
import { outcomeSummary, runningLabel } from './resultBar'

describe('outcomeSummary', () => {
  it('says the command finished when the outcome is ok', () => {
    expect(outcomeSummary('update', 'ok', 0)).toBe('Update finished')
    expect(outcomeSummary('add', 'ok', 0)).toBe('Add finished')
    expect(outcomeSummary('remove', 'ok', 0)).toBe('Remove finished')
  })

  it('appends the count of notable lines when the command needs attention', () => {
    expect(outcomeSummary('update', 'needs-attention', 2)).toBe('Update finished · 2 warnings')
  })

  it('uses the singular for one notable line', () => {
    expect(outcomeSummary('add', 'needs-attention', 1)).toBe('Add finished · 1 warning')
  })

  it('says the command failed, without a count', () => {
    expect(outcomeSummary('remove', 'failed', 0)).toBe('Remove failed')
    expect(outcomeSummary('update', 'failed', 3)).toBe('Update failed')
  })
})

describe('runningLabel', () => {
  it('names the mutating command in progress', () => {
    expect(runningLabel('update')).toBe('Updating…')
    expect(runningLabel('add')).toBe('Adding…')
    expect(runningLabel('remove')).toBe('Removing…')
  })
})
