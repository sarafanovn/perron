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
      return { ...entry, col: target.col, row: target.row, colSpan: target.colSpan, rowSpan: target.rowSpan }
    }
    if (entry.widgetId === targetId) {
      return { ...entry, col: dragged.col, row: dragged.row, colSpan: dragged.colSpan, rowSpan: dragged.rowSpan }
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

function cellIsOccupied(layout: WidgetLayoutEntry[], col: number, row: number): boolean {
  return layout.some(
    (w) => col >= w.col && col < w.col + w.colSpan && row >= w.row && row < w.row + w.rowSpan
  )
}

/**
 * Scans left-to-right, top-to-bottom for the first 1x1 cell not covered by
 * any existing widget's rectangle (accounting for colSpan/rowSpan, not just
 * each widget's origin cell). Used to auto-place newly added shortcut tiles.
 */
export function findFirstFreeCell(
  layout: WidgetLayoutEntry[],
  columns: number
): { col: number; row: number } {
  for (let row = 0; ; row++) {
    for (let col = 0; col < columns; col++) {
      if (!cellIsOccupied(layout, col, row)) {
        return { col, row }
      }
    }
  }
}
