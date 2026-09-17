import type { WidgetId } from './types'

export type WidgetShape = 'squircle' | 'stadium' | 'rounded'

/**
 * Search always reads as a pill (stadium: rounded ends, radius = half the
 * height) regardless of size — that's an identity of the widget itself, not
 * a function of its current footprint. Every other widget is a squircle
 * (continuous-curvature superellipse) only at exactly 1x1, where it reads
 * as an app-icon-style glyph; any larger footprint — a search bar excepted
 * — is a plain rounded rectangle instead, since a squircle's curvature was
 * tuned for a small square glyph and looks wrong stretched across a bigger
 * tile.
 */
export function shapeForWidget(widgetId: WidgetId, colSpan: number, rowSpan: number): WidgetShape {
  if (widgetId === 'search') return 'stadium'
  if (colSpan === 1 && rowSpan === 1) return 'squircle'
  return 'rounded'
}
