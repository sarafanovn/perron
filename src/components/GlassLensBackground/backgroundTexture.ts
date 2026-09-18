import { BACKGROUND_PRESETS } from '../../lib/backgroundPresets'

export type StaticBackgroundKind = 'gradient' | 'solid' | 'image'

interface CacheEntry {
  key: string
  canvas: HTMLCanvasElement
  image?: HTMLImageElement
}

let cache: CacheEntry | null = null

function resolveCssBackground(kind: StaticBackgroundKind, cssValue: string): string {
  if (kind !== 'gradient') return cssValue
  const preset = BACKGROUND_PRESETS.find((p) => p.id === cssValue)
  return preset ? preset.css : cssValue
}

const LINEAR_GRADIENT_RE = /^linear-gradient\(\s*([\d.]+)deg\s*,\s*(.+)\)$/i
const GRADIENT_STOP_RE = /(#[0-9a-f]{3,8}|rgba?\([^)]+\))\s+([\d.]+)%/gi

interface ParsedGradient {
  angleDeg: number
  stops: Array<{ color: string; offset: number }>
}

// Canvas 2D's fillStyle does NOT accept CSS gradient syntax as a string
// (only solid <color> values) — a linear-gradient(...) string silently
// falls back to black rather than throwing, which is what made every
// gradient-background lens render as a black/grey wash before this was
// caught. BACKGROUND_PRESETS only ever uses this one
// `linear-gradient(<N>deg, <hex> <N>%, ...)` shape, so a small dedicated
// parser is enough — no need for a general CSS <image> parser.
export function parseLinearGradient(css: string): ParsedGradient | null {
  const match = LINEAR_GRADIENT_RE.exec(css.trim())
  if (!match) return null
  const stops: Array<{ color: string; offset: number }> = []
  for (const stopMatch of match[2].matchAll(GRADIENT_STOP_RE)) {
    stops.push({ color: stopMatch[1], offset: Number(stopMatch[2]) / 100 })
  }
  if (stops.length < 2) return null
  return { angleDeg: Number(match[1]), stops }
}

// CSS gradient angles are measured clockwise from "up" (0deg = bottom to
// top), unlike the atan2/trig convention canvas coordinates use (0 = along
// +x) — this converts a CSS angle into the start/end point pair
// createLinearGradient expects, sized to fully span a width x height box
// at that angle.
export function gradientLineEndpoints(angleDeg: number, width: number, height: number) {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)
  const halfLength = (Math.abs(dx) * width + Math.abs(dy) * height) / 2
  const cx = width / 2
  const cy = height / 2
  return {
    x0: cx - dx * halfLength,
    y0: cy - dy * halfLength,
    x1: cx + dx * halfLength,
    y1: cy + dy * halfLength,
  }
}

// `ctx` is null only in test environments without a real canvas rasterizer
// (jsdom without the native `canvas` package) — every real browser always
// returns a 2D context for a freshly created <canvas>.
function paintCssBackground(ctx: CanvasRenderingContext2D | null, css: string, width: number, height: number) {
  if (!ctx) return

  const gradient = parseLinearGradient(css)
  if (gradient) {
    const { x0, y0, x1, y1 } = gradientLineEndpoints(gradient.angleDeg, width, height)
    const canvasGradient = ctx.createLinearGradient(x0, y0, x1, y1)
    for (const stop of gradient.stops) canvasGradient.addColorStop(stop.offset, stop.color)
    ctx.fillStyle = canvasGradient
    ctx.fillRect(0, 0, width, height)
    return
  }

  ctx.fillStyle = css
  ctx.fillRect(0, 0, width, height)
}

/**
 * Builds (and caches) the offscreen canvas GlassLensBackground samples as
 * its WebGL texture for every static background type. Re-used across
 * frames — only redrawn when the resolved CSS or requested size actually
 * changes, since gradient/solid/image never change without a settings
 * update, unlike the animated (Vanta) case which redraws every frame from
 * its own canvas instead of going through this cache at all.
 */
export function getStaticBackgroundCanvas(
  kind: StaticBackgroundKind,
  cssValue: string,
  width: number,
  height: number
): HTMLCanvasElement {
  const resolved = resolveCssBackground(kind, cssValue)
  const key = `${kind}:${resolved}:${width}x${height}`
  if (cache && cache.key === key) return cache.canvas

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (kind === 'image') {
    const img = new Image()
    img.onload = () => {
      if (!ctx) return
      const scale = Math.max(width / img.width, height / img.height)
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
    }
    img.src = resolved
    cache = { key, canvas, image: img }
    return canvas
  }

  paintCssBackground(ctx, resolved, width, height)
  cache = { key, canvas }
  return canvas
}
