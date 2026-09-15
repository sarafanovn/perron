import type { SearchEngineId } from './types'

export const SEARCH_ENGINES: Record<SearchEngineId, { label: string; buildUrl: (query: string) => string }> = {
  google: {
    label: 'Google',
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    buildUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  },
  bing: {
    label: 'Bing',
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
  yandex: {
    label: 'Yandex',
    buildUrl: (query) => `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
  },
}
