import { useEffect, useRef, useState, type ReactNode } from 'react'
import { squirclePath } from '../../lib/squircle'
import './Squircle.css'

/**
 * Wraps its children in an Apple-style "squircle" outline (a superellipse,
 * not a circular-arc border-radius) via clip-path, measured against the
 * wrapper's actual rendered size so it stays correct across grid resizes.
 * A regular box-shadow is clipped away by clip-path, so the shadow is
 * applied separately via `filter: drop-shadow` in Squircle.css.
 */
export function Squircle({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [clipPath, setClipPath] = useState<string | undefined>(undefined)

  useEffect(() => {
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
  }, [])

  return (
    <div
      ref={ref}
      className={`squircle-wrapper${className ? ` ${className}` : ''}`}
      style={{ clipPath }}
    >
      <div className="squircle-content">{children}</div>
    </div>
  )
}
