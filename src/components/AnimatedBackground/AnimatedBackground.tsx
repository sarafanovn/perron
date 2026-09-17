import { useEffect, useRef } from 'react'
import { createGradientRenderer, type GradientRenderer } from './webgl'
import type { AnimatedBackgroundSettings } from '../../lib/types'
import './AnimatedBackground.css'

/**
 * Renders the grainy, drifting gradient background as a full-viewport
 * canvas behind the widget grid. A ref holds the latest settings so the
 * requestAnimationFrame loop (started once on mount) always reads current
 * values without needing to restart on every slider tweak — recreating the
 * WebGL context on each settings change would both be wasteful and cause a
 * visible flash.
 */
export function AnimatedBackground({ settings }: { settings: AnimatedBackgroundSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: GradientRenderer | null
    try {
      renderer = createGradientRenderer(canvas)
    } catch {
      renderer = null
    }
    if (!renderer) return

    let frameId: number | null = null
    const startTime = performance.now()
    // Respect the OS-level "reduce motion" request: render one still frame
    // of the gradient/grain instead of a continuously drifting one, rather
    // than ignoring the setting entirely just because this is a canvas and
    // not a CSS animation.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      if (reducedMotion.matches) renderer!.render(0, settingsRef.current, canvas!.width, canvas!.height)
    }
    resize()
    window.addEventListener('resize', resize)

    function frame(now: number) {
      const elapsedSeconds = (now - startTime) / 1000
      renderer!.render(elapsedSeconds, settingsRef.current, canvas!.width, canvas!.height)
      frameId = requestAnimationFrame(frame)
    }
    if (!reducedMotion.matches) frameId = requestAnimationFrame(frame)

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      renderer!.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="animated-background" aria-hidden />
}
