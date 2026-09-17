import { describe, it, expect } from 'vitest'
import { labelFromUrl } from './shortcutLabel'

describe('labelFromUrl', () => {
  it('extracts the hostname from a full URL', () => {
    expect(labelFromUrl('https://github.com/foo/bar')).toBe('github.com')
  })

  it('strips a leading www.', () => {
    expect(labelFromUrl('https://www.github.com')).toBe('github.com')
  })

  it('assumes https for a URL without a scheme', () => {
    expect(labelFromUrl('github.com')).toBe('github.com')
  })

  it('returns an empty string for an empty or unparseable URL', () => {
    expect(labelFromUrl('')).toBe('')
  })
})
