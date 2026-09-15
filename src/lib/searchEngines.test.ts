import { describe, it, expect } from 'vitest'
import { SEARCH_ENGINES } from './searchEngines'

describe('SEARCH_ENGINES', () => {
  it('builds a Google search URL with an encoded query', () => {
    expect(SEARCH_ENGINES.google.buildUrl('hello world')).toBe(
      'https://www.google.com/search?q=hello%20world'
    )
  })

  it('builds a DuckDuckGo search URL', () => {
    expect(SEARCH_ENGINES.duckduckgo.buildUrl('cats')).toBe('https://duckduckgo.com/?q=cats')
  })

  it('builds a Bing search URL', () => {
    expect(SEARCH_ENGINES.bing.buildUrl('cats')).toBe('https://www.bing.com/search?q=cats')
  })

  it('builds a Yandex search URL', () => {
    expect(SEARCH_ENGINES.yandex.buildUrl('cats')).toBe('https://yandex.com/search/?text=cats')
  })
})
