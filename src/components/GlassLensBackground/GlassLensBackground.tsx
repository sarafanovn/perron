import { useEffect, useRef } from 'react'
import { createLensRenderer, type LensRenderer, type ResolvedLens } from './webgl'
import { getStaticBackgroundCanvas } from './backgroundTexture'
import { useGlassLensRegistry, type LensShape } from '../../context/GlassLensContext'
import type { BackgroundSettings } from '../../lib/types'
import './GlassLensBackground.css'

function resolveLens(handle: { element: HTMLElement; shape: LensShape }): ResolvedLens | null {
  const rect = handle.element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, shape: handle.shape }
}

/**
 * The Glass style's refraction layer: one full-viewport canvas rendering
 * every currently-mounted glass surface's lens in a single draw call per
 * frame (see webgl.ts). Lives behind WidgetGrid in DOM/z-index order, but
 * visually reads as "inside" each widget because the widget's own
 * semi-transparent surface (background: var(--color-surface)) sits on top
 * and tints what this canvas shows through it.
 */
export function GlassLensBackground({
  background,
  vantaCanvas,
}: {
  background: BackgroundSettings
  vantaCanvas: HTMLCanvasElement | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { getSnapshot } = useGlassLensRegistry()
  const backgroundRef = useRef(background)
  backgroundRef.current = background
  const vantaCanvasRef = useRef(vantaCanvas)
  vantaCanvasRef.current = vantaCanvas

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: LensRenderer | null
    try {
      renderer = createLensRenderer(canvas)
    } catch {
      renderer = null
    }
    if (!renderer) return

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let frameId: number | null = null
    function frame() {
      frameId = requestAnimationFrame(frame)
      if (document.hidden) return

      const dpr = canvas!.width / window.innerWidth
      // getBoundingClientRect() is top-left-origin (y grows downward), but
      // gl_FragCoord in the fragment shader is bottom-left-origin (y grows
      // upward) — without this flip every lens renders mirrored vertically
      // about the canvas's vertical center.
      const lenses = getSnapshot()
        .map(resolveLens)
        .filter((lens): lens is ResolvedLens => lens !== null)
        .map((lens) => ({
          ...lens,
          x: lens.x * dpr,
          y: canvas!.height - (lens.y + lens.height) * dpr,
          width: lens.width * dpr,
          height: lens.height * dpr,
        }))

      const bg = backgroundRef.current
      let source: TexImageSource
      if (bg.type === 'animated') {
        if (!vantaCanvasRef.current) return
        source = vantaCanvasRef.current
      } else {
        source = getStaticBackgroundCanvas(bg.type, bg.value, canvas!.width, canvas!.height)
      }

      renderer!.render(lenses, source, canvas!.width, canvas!.height, bg.type === 'animated')
    }
    frameId = requestAnimationFrame(frame)

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      renderer!.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className="glass-lens-background" aria-hidden />
}
