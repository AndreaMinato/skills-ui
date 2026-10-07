import { fetch } from '@tauri-apps/plugin-http'

const BASE_URL = 'https://skills.sh'

export interface SearchResult {
  /** `owner/repo/skill` */
  id: string
  /** `owner/repo` — the package passed to `skills add` */
  source: string
  skillId: string
  name: string
  installs: number
  url: string
}

interface SearchResponse {
  skills: Omit<SearchResult, 'url'>[]
  error?: string
}

export const MIN_QUERY_LENGTH = 2

/** skills.sh sends no CORS headers, so this goes through the Tauri HTTP plugin. */
export async function searchSkills(query: string, limit = 50): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  const res = await fetch(`${BASE_URL}/api/search?${params}`)
  const body = await res.json() as SearchResponse
  if (!res.ok || body.error)
    throw new Error(body.error ?? `Search failed (HTTP ${res.status})`)
  return body.skills.map(s => ({ ...s, url: `${BASE_URL}/${s.id}` }))
}

/** skills.sh page of a package. */
export function packageUrl(pkg: string): string {
  return `${BASE_URL}/${pkg}`
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function formatInstalls(n: number): string {
  return compact.format(n)
}
