import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import * as VantaFogModule from 'vanta/dist/vanta.fog.min'
import type { VantaFogEffect, VantaFogOptions } from 'vanta/dist/vanta.fog.min'
import type { AnimatedBackgroundSettings } from '../../lib/types'
import './AnimatedBackground.css'

type VantaFogFn = (options: VantaFogOptions) => VantaFogEffect

// vanta's UMD build has no __esModule marker, so its actual nesting depth
// under a namespace import varies by bundler/runtime — Node ESM interop
// unwraps it to `.default.default`, some bundlers stop at `.default`, and
// under others the namespace import IS the function. Rather than assume a
// fixed depth, walk `.default` until a callable is found. Cast through
// `unknown` since the declared type (see vanta.d.ts) claims a plain default
// export, which is only sometimes what's actually there at runtime.
function unwrapDefault(value: unknown): VantaFogFn {
  let current = value
  for (let depth = 0; depth < 5; depth++) {
    if (typeof current === 'function') return current as VantaFogFn
    if (current && typeof current === 'object' && 'default' in current) {
      current = (current as { default: unknown }).default
      continue
    }
    break
  }
  throw new Error('[AnimatedBackground] Could not resolve the vanta FOG export')
}

const FOG: VantaFogFn = unwrapDefault(VantaFogModule)

function toVantaOptions(el: HTMLElement, settings: AnimatedBackgroundSettings) {
  return {
    el,
    THREE,
    mouseControls: false,
    touchControls: false,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    baseColor: settings.baseColor,
    lowlightColor: settings.lowlightColor,
    midtoneColor: settings.midtoneColor,
    highlightColor: settings.highlightColor,
    speed: 0.3 + (settings.speed / 100) * 2.7,
    zoom: 0.6 + (settings.zoom / 100) * 2.4,
    blurFactor: 0.2 + (settings.blurFactor / 100) * 0.6,
  }
}

/**
 * Renders the Vanta.js FOG effect (a maintained, published library —
 * see https://www.vantajs.com/?effect=fog) as a full-viewport backdrop
 * behind the widget grid, instead of a hand-rolled WebGL shader. Vanta
 * owns the canvas element and its own render loop internally; this
 * component only creates/destroys the effect and forwards settings
 * changes via setOptions (no context recreation needed on every tweak).
 */
export function AnimatedBackground({
  settings,
  onCanvasReady,
}: {
  settings: AnimatedBackgroundSettings
  // Called with the underlying <canvas> Vanta creates inside our host div
  // once init succeeds (and again with null on teardown) — GlassLensBackground
  // reads this canvas each frame as its texture source for the 'animated'
  // background case, since Vanta already redraws it every frame on its own.
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<ReturnType<typeof FOG> | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    // Respect the OS-level "reduce motion" request — Vanta has no built-in
    // static mode, so the least invasive option is to simply not start its
    // continuous render loop at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Vanta's own internal try/catch around init() swallows shader/render
    // errors, but WebGLRenderer construction itself (e.g. no WebGL support
    // at all, as in jsdom) can still throw synchronously before that.
    let effect: ReturnType<typeof FOG> | null = null
    try {
      effect = FOG(toVantaOptions(el, settings))
    } catch (err) {
      console.error('[AnimatedBackground] FOG init failed', err)
      effect = null
    }
    if (!effect) return
    effectRef.current = effect
    onCanvasReady?.(el.querySelector('canvas'))

    return () => {
      effect.destroy()
      effectRef.current = null
      onCanvasReady?.(null)
    }
    // Settings changes are applied via setOptions below, not by recreating
    // the effect — see the second effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!effectRef.current || !elRef.current) return
    effectRef.current.setOptions(toVantaOptions(elRef.current, settings))
  }, [settings])

  return <div ref={elRef} className="animated-background" aria-hidden />
}
