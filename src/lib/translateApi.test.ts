import { describe, it, expect, vi, afterEach } from 'vitest'
import { translateText } from './translateApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('translateText', () => {
  it('parses MyMemory translation response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ responseData: { translatedText: 'Bonjour' } }),
      })
    )
    const result = await translateText('Hello', 'en', 'fr')
    expect(result).toBe('Bonjour')
  })

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(translateText('Hello', 'en', 'fr')).rejects.toThrow()
  })

  it('throws when the response is missing translatedText', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ responseData: {} }) })
    )
    await expect(translateText('Hello', 'en', 'fr')).rejects.toThrow()
  })
})
