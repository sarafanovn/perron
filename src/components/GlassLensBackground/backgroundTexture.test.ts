import { describe, it, expect } from 'vitest'
import { getStaticBackgroundCanvas } from './backgroundTexture'

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
