import type { SearchResult } from './skillsApi'
import { describe, expect, it } from 'vitest'
import { confirmedQueryPackage, groupByPackage, isInstalled, packageFromQuery } from './searchResults'

function result(source: string, skillId: string): SearchResult {
  return { id: `${source}/${skillId}`, source, skillId, name: skillId, installs: 1, url: '' }
}

describe('groupByPackage', () => {
  const results = [
    result('wordpress/agent-skills', 'wp-playground'),
    result('jeffallan/claude-skills', 'wordpress-pro'),
    result('wordpress/agent-skills', 'blueprint'),
  ]

  it('buckets skills by package, keeping the order of each package\'s first hit', () => {
    const groups = groupByPackage(results)
    expect(groups.map(g => g.pkg)).toEqual(['wordpress/agent-skills', 'jeffallan/claude-skills'])
    expect(groups[0].results.map(r => r.skillId)).toEqual(['wp-playground', 'blueprint'])
  })

  it('returns no groups for no results', () => {
    expect(groupByPackage([])).toEqual([])
  })

  it('puts the pinned package first, whatever its rank', () => {
    const groups = groupByPackage(results, 'jeffallan/claude-skills')
    expect(groups.map(g => g.pkg)).toEqual(['jeffallan/claude-skills', 'wordpress/agent-skills'])
  })
})

describe('packageFromQuery', () => {
  it('accepts the owner/repo shorthand', () => {
    expect(packageFromQuery(' wordpress/agent-skills ')).toBe('wordpress/agent-skills')
  })

  it('reduces a GitHub URL to owner/repo', () => {
    expect(packageFromQuery('https://github.com/wordpress/agent-skills')).toBe('wordpress/agent-skills')
    expect(packageFromQuery('github.com/wordpress/agent-skills.git')).toBe('wordpress/agent-skills')
    expect(packageFromQuery('https://github.com/wordpress/agent-skills/tree/trunk/skills')).toBe('wordpress/agent-skills')
  })

  it('ignores keyword queries and partial or deeper paths', () => {
    expect(packageFromQuery('wordpress')).toBeNull()
    expect(packageFromQuery('wordpress/')).toBeNull()
    expect(packageFromQuery('react testing')).toBeNull()
    expect(packageFromQuery('wordpress/agent-skills/wp-playground')).toBeNull()
  })

  it('does not take a relative path for a package', () => {
    expect(packageFromQuery('./foo')).toBeNull()
    expect(packageFromQuery('../..')).toBeNull()
    expect(packageFromQuery('../skills')).toBeNull()
  })

  it('rejects an owner that GitHub would not allow as an account name', () => {
    expect(packageFromQuery('my_org/skills')).toBeNull()
    expect(packageFromQuery('node.js/tips')).toBeNull()
    expect(packageFromQuery('-foo/skills')).toBeNull()
    expect(packageFromQuery('foo-/skills')).toBeNull()
  })

  it('rejects a repository named only with dots', () => {
    expect(packageFromQuery('foo/.')).toBeNull()
    expect(packageFromQuery('foo/..')).toBeNull()
    expect(packageFromQuery('foo/.github')).toBe('foo/.github')
  })

  it('applies the same owner rule to a GitHub URL', () => {
    expect(packageFromQuery('github.com/my_org/skills')).toBeNull()
    expect(packageFromQuery('https://github.com/foo/..')).toBeNull()
  })
})

describe('confirmedQueryPackage', () => {
  const results = [
    result('vercel-labs/agent-browser', 'agent-browser'),
    result('vercel-labs/agent-skills', 'web-design-guidelines'),
  ]

  it('is the package the query names when the search returned one of its skills', () => {
    expect(confirmedQueryPackage('vercel-labs/agent-skills', results)).toBe('vercel-labs/agent-skills')
    expect(confirmedQueryPackage('https://github.com/Vercel-Labs/Agent-Skills', results)).toBe('vercel-labs/agent-skills')
  })

  it('is null when no returned skill belongs to the named package', () => {
    expect(confirmedQueryPackage('client/server', results)).toBeNull()
    expect(confirmedQueryPackage('zzqqxx/nothing-here', [])).toBeNull()
  })

  it('is null for a keyword query', () => {
    expect(confirmedQueryPackage('agent', results)).toBeNull()
  })
})

describe('isInstalled', () => {
  const wpPlayground = result('wordpress/agent-skills', 'wp-playground')

  it('matches an installed skill of the same name from the same package', () => {
    expect(isInstalled(wpPlayground, [{ name: 'wp-playground', source: 'wordpress/agent-skills' }])).toBe(true)
  })

  it('does not match a same-named skill installed from another package', () => {
    expect(isInstalled(wpPlayground, [{ name: 'wp-playground', source: 'automattic/agent-skills' }])).toBe(false)
  })

  it('matches by name alone when the installed skill records no package', () => {
    expect(isInstalled(wpPlayground, [{ name: 'wp-playground', source: null }])).toBe(true)
  })

  it('does not match a different skill', () => {
    expect(isInstalled(wpPlayground, [{ name: 'blueprint', source: 'wordpress/agent-skills' }])).toBe(false)
  })
})
