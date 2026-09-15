import type { WidgetId } from './types'

export type WidgetShape = 'squircle' | 'stadium'

/**
 * Each widget's visual shape is an explicit property of that widget, not
 * derived from its current colSpan/rowSpan — a wide search bar should always
 * read as a pill (stadium: rounded ends, radius = half the height), never as
 * a stretched squircle, regardless of how the grid currently sizes it.
 */
export function shapeForWidget(widgetId: WidgetId): WidgetShape {
  if (widgetId === 'search') return 'stadium'
  return 'squircle'
}
