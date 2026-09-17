import { describe, it, expect } from 'vitest'
import { hexToRgb } from './webgl'

describe('hexToRgb', () => {
  it('converts a 6-digit hex color to normalized RGB', () => {
    const [r, g, b] = hexToRgb('#ff6a88')
    expect(r).toBeCloseTo(255 / 255)
    expect(g).toBeCloseTo(106 / 255)
    expect(b).toBeCloseTo(136 / 255)
  })

  it('converts a 3-digit shorthand hex color', () => {
    const [r, g, b] = hexToRgb('#0f8')
    expect(r).toBeCloseTo(0)
    expect(g).toBeCloseTo(1)
    expect(b).toBeCloseTo(136 / 255)
  })

  it('handles black and white', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1])
  })
})
