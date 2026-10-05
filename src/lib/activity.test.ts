import { describe, expect, it } from 'vitest'
import { isListedInActivity } from './activity'

describe('isListedInActivity', () => {
  it('hides a successful read command', () => {
    expect(isListedInActivity({ kind: 'read', outcome: 'ok' })).toBe(false)
  })

  it('lists a mutating command whatever its outcome', () => {
    expect(isListedInActivity({ kind: 'mutating', outcome: 'ok' })).toBe(true)
    expect(isListedInActivity({ kind: 'mutating', outcome: 'needs-attention' })).toBe(true)
    expect(isListedInActivity({ kind: 'mutating', outcome: 'failed' })).toBe(true)
  })

  it('lists a failed read command', () => {
    expect(isListedInActivity({ kind: 'read', outcome: 'failed' })).toBe(true)
  })

  it('lists a read command that needs attention, so its warning is not lost', () => {
    expect(isListedInActivity({ kind: 'read', outcome: 'needs-attention' })).toBe(true)
  })
})
