import { ref, watch } from 'vue'

const STORAGE_KEY = 'skills-ui:search-layout'

export type SearchLayout = 'grouped' | 'flat'

function load(): SearchLayout {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'flat')
      return 'flat'
  }
  catch {}
  return 'grouped'
}

/** How search results are listed: bucketed by package, or one flat ranked list. */
const layout = ref<SearchLayout>(load())

watch(layout, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  }
  catch {}
})

export function useSearchLayout() {
  return { layout }
}
