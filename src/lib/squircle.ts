// Apple's "squircle" is a superellipse (|x/a|^n + |y/b|^n = 1), giving
// continuous curvature instead of an arc-with-straight-edge transition like
// border-radius. Inscribed edge-to-edge in the rectangle (a = width/2, b =
// height/2) as done here, a high exponent like n=5 — closer to the flatter
// curve real iOS app icons use, which are inset from their full bounding
// square — reads as harder-edged than a plain border-radius at small widget
// sizes instead of softer. n=3 keeps continuous curvature while staying
// visibly rounder than border-radius, matching what a squircle should read
// as on a 60-200px tile.
const SUPERELLIPSE_EXPONENT = 3
const POINTS_PER_QUARTER = 24

function superellipsePoint(angle: number, a: number, b: number, n: number): [number, number] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const x = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / n) * a
  const y = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / n) * b
  return [x, y]
}

/**
 * Builds an SVG path (in local 0..width x 0..height coordinates) tracing a
 * superellipse inscribed in the given rectangle. Intended for use as a
 * `clip-path: path(...)` value so widgets get an Apple-style continuous-
 * curvature "squircle" outline instead of a circular-arc border-radius.
 */
export function squirclePath(width: number, height: number): string {
  const a = width / 2
  const b = height / 2
  const cx = a
  const cy = b
  const totalPoints = POINTS_PER_QUARTER * 4

  const points: Array<[number, number]> = []
  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2
    const [x, y] = superellipsePoint(angle, a, b, SUPERELLIPSE_EXPONENT)
    points.push([cx + x, cy + y])
  }

  const [firstX, firstY] = points[0]
  const commands = points
    .slice(1)
    .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${commands} Z`
}
