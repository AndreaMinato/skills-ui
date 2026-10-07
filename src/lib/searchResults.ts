import type { SearchResult } from './skillsApi'
import type { InstalledSkill } from './skillsCli'

export interface PackageGroup {
  /** The package name passed to `skills add`, usually `owner/repo` */
  pkg: string
  results: SearchResult[]
}

function samePackage(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * Search results bucketed by package; packages keep the order of their best-ranked
 * skill, except `pinned`, which goes first.
 */
export function groupByPackage(results: readonly SearchResult[], pinned?: string | null): PackageGroup[] {
  const groups = new Map<string, PackageGroup>()
  for (const result of results) {
    const group = groups.get(result.source)
    if (group)
      group.results.push(result)
    else
      groups.set(result.source, { pkg: result.source, results: [result] })
  }
  const ordered = [...groups.values()]
  if (!pinned)
    return ordered
  return [...ordered.filter(g => samePackage(g.pkg, pinned)), ...ordered.filter(g => !samePackage(g.pkg, pinned))]
}

const SHORTHAND_RE = /^[a-z\d](?:[a-z\d-]*[a-z\d])?\/(?!\.{1,2}$)[\w.-]+$/i
const GITHUB_URL_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?(?:[/?#].*)?$/i

/** The `owner/repo` a search query names (shorthand or GitHub URL), or null for a plain keyword query. */
export function packageFromQuery(query: string): string | null {
  const q = query.trim()
  const url = GITHUB_URL_RE.exec(q)
  const candidate = url ? `${url[1]}/${url[2]}` : q
  return SHORTHAND_RE.test(candidate) ? candidate : null
}

/** The package a query names, as the search results spell it, once one of its skills came back; else null. */
export function confirmedQueryPackage(query: string, results: readonly SearchResult[]): string | null {
  const pkg = packageFromQuery(query)
  if (!pkg)
    return null
  return results.find(r => samePackage(r.source, pkg))?.source ?? null
}

/** Whether this search result is already installed; an installed skill with no recorded package matches by name. */
export function isInstalled(result: SearchResult, installed: readonly Pick<InstalledSkill, 'name' | 'source'>[]): boolean {
  return installed.some(s => s.name === result.skillId && (s.source === null || samePackage(s.source, result.source)))
}

/** Key of a whole-package install in the view's `working` set; skill installs use the result id. */
export function packageKey(pkg: string): string {
  return `pkg:${pkg}`
}
