import { useEffect, useRef, useState, type ReactNode } from 'react'
import { squirclePath } from '../../lib/squircle'
import type { WidgetShape } from '../../lib/widgetShapes'
import './Squircle.css'

/**
 * Wraps its children in an Apple-style widget outline: a "squircle"
 * superellipse (continuous curvature, not a circular-arc border-radius) for
 * roughly square widgets, or a "stadium" pill (rounded ends, radius = half
 * the height) for wide bar-shaped widgets like search. The shape is passed
 * in explicitly rather than inferred from the current width/height, so a
 * wide search bar always reads as a pill instead of a stretched squircle.
 *
 * The squircle path is measured against the wrapper's actual rendered size
 * via ResizeObserver so it stays correct across grid resizes; stadium needs
 * no measurement — a large border-radius is clamped by the browser to half
 * the shorter side automatically.
 *
 * A regular box-shadow is clipped away by clip-path, so the shadow is
 * applied separately via `filter: drop-shadow` in Squircle.css, which works
 * for both shapes.
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

  useEffect(() => {
    if (shape !== 'squircle') {
      setClipPath(undefined)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setClipPath(`path("${squirclePath(width, height)}")`)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [shape])

  const style = shape === 'stadium' ? { borderRadius: '9999px', overflow: 'hidden' as const } : { clipPath }

  return (
    <div ref={ref} className={`squircle-wrapper${className ? ` ${className}` : ''}`} style={style}>
      <div className="squircle-content">{children}</div>
    </div>
  )
}
