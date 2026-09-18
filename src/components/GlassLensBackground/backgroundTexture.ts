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

// Canvas 2D's fillStyle accepts the same CSS <color>/<gradient> syntax the
// spec defines (a subset of full CSS, but linear-gradient and solid colors
// both fall within it) — delegating to it avoids hand-rolling a parser for
// gradient stops/angles that the browser already understands natively.
// `ctx` is null only in test environments without a real canvas rasterizer
// (jsdom without the native `canvas` package) — every real browser always
// returns a 2D context for a freshly created <canvas>.
function paintCssBackground(ctx: CanvasRenderingContext2D | null, css: string, width: number, height: number) {
  if (!ctx) return
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
