import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { squirclePath } from '../../lib/squircle'
import type { WidgetShape } from '../../lib/widgetShapes'
import './Squircle.css'

/**
 * Wraps its children in one of three outlines, per WidgetShape: a
 * "squircle" superellipse (continuous curvature, not a circular-arc
 * border-radius) for 1x1 icon-style widgets, a "stadium" pill (rounded
 * ends, radius = half the height) for the search bar, or a plain "rounded"
 * rectangle (var(--radius-widget)) for every other, larger widget — a
 * squircle's curvature is tuned for a small square glyph and reads wrong
 * stretched across a bigger tile. The shape is passed in explicitly rather
 * than inferred from the current width/height inside this component, so
 * callers control exactly when a widget's footprint should flip it.
 *
 * The squircle path is measured against the wrapper's actual rendered size
 * so it stays correct across grid resizes; stadium and rounded need no
 * measurement — a border-radius is plain CSS.
 *
 * The first path is computed synchronously in useLayoutEffect via
 * getBoundingClientRect, not left to ResizeObserver's first callback — that
 * callback is only guaranteed to fire on a later animation frame (spec'd
 * behavior, not a bug in one browser), so relying on it alone left the very
 * first paint clipped to nothing, i.e. a plain rectangle, for however long
 * that frame took to arrive. ResizeObserver still drives every update after
 * that initial paint, when the wrapper's size actually changes.
 */
export function Squircle({
  children,
  className,
  shape = 'squircle',
}: {
  children: ReactNode
  className?: string
  shape?: WidgetShape
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [clipPath, setClipPath] = useState<string | undefined>(undefined)

  useLayoutEffect(() => {
    if (shape !== 'squircle') {
      setClipPath(undefined)
      return
    }
    const el = ref.current
    if (!el) return

    function applySize(width: number, height: number) {
      if (width > 0 && height > 0) {
        setClipPath(`path("${squirclePath(width, height)}")`)
      }
    }

    const rect = el.getBoundingClientRect()
    applySize(rect.width, rect.height)

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      applySize(width, height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [shape])

  // overflow: hidden backstops clip-path here: Firefox doesn't reliably clip
  // a descendant's backdrop-filter to a `path()` clip-path on this wrapper —
  // the blur stays visible past the squircle's rounded corners, in the
  // wrapper's full untouched rectangle, even though the wrapper's own
  // background and clip-path are themselves correct. overflow: hidden forces
  // a real clipping box that backdrop-filter compositing respects.
  const style =
    shape === 'stadium'
      ? { borderRadius: '9999px', overflow: 'hidden' as const }
      : shape === 'rounded'
        ? { borderRadius: 'var(--radius-widget)', overflow: 'hidden' as const }
        : { clipPath, overflow: 'hidden' as const }

  return (
    <div ref={ref} className={`squircle-wrapper${className ? ` ${className}` : ''}`} style={style}>
      <div className="squircle-content">{children}</div>
    </div>
  )
}
