import { describe, it, expect } from 'vitest'
import { packLensRects } from './webgl'
import type { ResolvedLens } from './webgl'

describe('packLensRects', () => {
  it('packs center xy + half-size zw per lens, in order', () => {
    const lenses: ResolvedLens[] = [
      { x: 10, y: 20, width: 100, height: 50, shape: 'rounded' },
      { x: 200, y: 300, width: 40, height: 40, shape: 'squircle' },
    ]
    const packed = packLensRects(lenses)
    expect(Array.from(packed.slice(0, 4))).toEqual([60, 45, 50, 25])
    expect(Array.from(packed.slice(4, 8))).toEqual([220, 320, 20, 20])
  })

  it('returns a zero-filled tail past MAX_LENSES worth of slots when given fewer lenses', () => {
    const packed = packLensRects([{ x: 0, y: 0, width: 10, height: 10, shape: 'rounded' }])
    expect(packed.length).toBe(16 * 4)
    expect(packed[4]).toBe(0)
  })

  it('truncates to MAX_LENSES when given more lenses than the cap', () => {
    const lenses: ResolvedLens[] = Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: i,
      width: 10,
      height: 10,
      shape: 'rounded' as const,
    }))
    const packed = packLensRects(lenses)
    expect(packed.length).toBe(16 * 4)
  })
})
