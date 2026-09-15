import { describe, it, expect } from 'vitest'
import { squirclePath } from './squircle'

describe('squirclePath', () => {
  it('produces an SVG path string starting and ending correctly', () => {
    const path = squirclePath(100, 100)
    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
  })

  it('produces different paths for different sizes', () => {
    expect(squirclePath(100, 100)).not.toBe(squirclePath(200, 100))
  })

  it('produces a path usable for both square and rectangular widgets', () => {
    const square = squirclePath(120, 120)
    const rect = squirclePath(240, 120)
    expect(square).not.toBe(rect)
    expect(square.length).toBeGreaterThan(0)
    expect(rect.length).toBeGreaterThan(0)
  })

  it('is deterministic for the same inputs', () => {
    expect(squirclePath(150, 90)).toBe(squirclePath(150, 90))
  })
})
