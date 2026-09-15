import type { WidgetId, WidgetLayoutEntry } from './types'

export function swapWidgets(
  layout: WidgetLayoutEntry[],
  draggedId: WidgetId,
  targetId: WidgetId
): WidgetLayoutEntry[] {
  if (draggedId === targetId) return layout
  const dragged = layout.find((w) => w.widgetId === draggedId)
  const target = layout.find((w) => w.widgetId === targetId)
  if (!dragged || !target) return layout

  return layout.map((entry) => {
    if (entry.widgetId === draggedId) {
      return { ...entry, col: target.col, row: target.row }
    }
    if (entry.widgetId === targetId) {
      return { ...entry, col: dragged.col, row: dragged.row }
    }
    return entry
  })
}

export function findWidgetAt(
  layout: WidgetLayoutEntry[],
  col: number,
  row: number
): WidgetLayoutEntry | undefined {
  return layout.find((w) => w.col === col && w.row === row)
}
