import type { SearchEngineId } from './types'

export const SEARCH_ENGINES: Record<
  SearchEngineId,
  { label: string; homepageUrl: string; buildUrl: (query: string) => string }
> = {
  google: {
    label: 'Google',
    homepageUrl: 'https://www.google.com',
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    homepageUrl: 'https://duckduckgo.com',
    buildUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  },
  bing: {
    label: 'Bing',
    homepageUrl: 'https://www.bing.com',
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
  yandex: {
    label: 'Yandex',
    homepageUrl: 'https://yandex.com',
    buildUrl: (query) => `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
  },
}
