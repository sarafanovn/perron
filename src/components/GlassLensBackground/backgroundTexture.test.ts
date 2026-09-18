import { describe, it, expect } from 'vitest'
import { getStaticBackgroundCanvas, parseLinearGradient, gradientLineEndpoints } from './backgroundTexture'

// jsdom has no real 2D canvas rasterizer (getContext('2d') returns null
// without the native `canvas` npm package, which this project doesn't
// depend on — see AnimatedBackground.test.tsx for the same WebGL-side
// limitation) — so these tests cover sizing/caching/no-throw behavior
// rather than actual pixel output, which is verified visually in a real
// browser instead (see the plan's Task 9).
describe('getStaticBackgroundCanvas', () => {
  it('returns a canvas sized to the requested dimensions', () => {
    const canvas = getStaticBackgroundCanvas('solid', '#ff0000', 400, 300)
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(300)
  })

  it('returns the same canvas instance on a repeated identical call (cached)', () => {
    const a = getStaticBackgroundCanvas('solid', '#00ff00', 200, 200)
    const b = getStaticBackgroundCanvas('solid', '#00ff00', 200, 200)
    expect(a).toBe(b)
  })

  it('returns a different canvas instance when the css value changes', () => {
    const a = getStaticBackgroundCanvas('solid', '#0000ff', 200, 200)
    const b = getStaticBackgroundCanvas('solid', '#ffffff', 200, 200)
    expect(a).not.toBe(b)
  })

  it('resolves a known gradient preset id without throwing', () => {
    const canvas = getStaticBackgroundCanvas('gradient', 'sunset', 100, 100)
    expect(canvas.width).toBe(100)
  })

  it('falls back to a flat fill for an unknown gradient preset id without throwing', () => {
    expect(() => getStaticBackgroundCanvas('gradient', 'not-a-real-preset', 100, 100)).not.toThrow()
  })

  it('does not throw for an image background even though the image has not loaded yet', () => {
    expect(() => getStaticBackgroundCanvas('image', 'data:image/png;base64,', 100, 100)).not.toThrow()
  })
})

// Regression coverage for a real bug: canvas 2D's fillStyle does NOT accept
// CSS gradient syntax as a string (only solid colors) — passing
// 'linear-gradient(...)' straight through silently produced a black fill
// instead of throwing, which is what made every gradient background render
// as a black/grey wash behind the WebGL lens before this parser existed.
describe('parseLinearGradient', () => {
  it('parses angle and color/offset stops from a 2-stop preset gradient', () => {
    const parsed = parseLinearGradient('linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)')
    expect(parsed).toEqual({
      angleDeg: 135,
      stops: [
        { color: '#a1c4fd', offset: 0 },
        { color: '#c2e9fb', offset: 1 },
      ],
    })
  })

  it('parses a 3-stop gradient', () => {
    const parsed = parseLinearGradient('linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)')
    expect(parsed?.stops).toHaveLength(3)
    expect(parsed?.stops[1]).toEqual({ color: '#203a43', offset: 0.5 })
  })

  it('returns null for a non-gradient CSS value', () => {
    expect(parseLinearGradient('#1d1d1f')).toBeNull()
  })

  it('returns null for an unsupported gradient shape (radial-gradient)', () => {
    expect(parseLinearGradient('radial-gradient(circle, #fff 0%, #000 100%)')).toBeNull()
  })
})

describe('gradientLineEndpoints', () => {
  it('runs bottom-to-top for a 0deg angle', () => {
    const { x0, y0, x1, y1 } = gradientLineEndpoints(0, 100, 100)
    expect(x0).toBeCloseTo(x1)
    expect(y0).toBeGreaterThan(y1)
  })

  it('runs left-to-right for a 90deg angle', () => {
    const { x0, y0, x1, y1 } = gradientLineEndpoints(90, 100, 100)
    expect(y0).toBeCloseTo(y1)
    expect(x0).toBeLessThan(x1)
  })

  it('spans the box corner-to-corner diagonal for a 135deg angle on a square box', () => {
    const { x0, y0, x1, y1 } = gradientLineEndpoints(135, 100, 100)
    const length = Math.hypot(x1 - x0, y1 - y0)
    expect(length).toBeCloseTo(100 * Math.SQRT2, 5)
  })
})
