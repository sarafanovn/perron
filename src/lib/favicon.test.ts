import { describe, it, expect } from 'vitest'
import { faviconUrlFor } from './favicon'

describe('faviconUrlFor', () => {
  it('builds a favicon service URL from a full URL', () => {
    expect(faviconUrlFor('https://github.com/anthropics')).toBe(
      'https://www.google.com/s2/favicons?domain=github.com&sz=64'
    )
  })

  it('handles URLs without a protocol by assuming https', () => {
    expect(faviconUrlFor('example.com')).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=64'
    )
  })
})
