import type { WidgetId, WidgetLayoutEntry } from './types'

/**
 * Moves one widget to a new top-left cell, keeping its own colSpan/rowSpan.
 * Rejects (returns the layout unchanged) if the target rectangle would run
 * off the grid's bounds or overlap any other widget's rectangle — free
 * placement never bumps or swaps another widget out of the way.
 */
export function moveWidget(
  layout: WidgetLayoutEntry[],
  widgetId: WidgetId,
  targetCol: number,
  targetRow: number,
  columns: number,
  rows: number
): WidgetLayoutEntry[] {
  const moving = layout.find((w) => w.widgetId === widgetId)
  if (!moving) return layout
  if (targetCol === moving.col && targetRow === moving.row) return layout

  if (targetCol < 0 || targetRow < 0) return layout
  if (targetCol + moving.colSpan > columns || targetRow + moving.rowSpan > rows) return layout

  const overlapsAnother = layout.some((w) => {
    if (w.widgetId === widgetId) return false
    const colOverlap = targetCol < w.col + w.colSpan && targetCol + moving.colSpan > w.col
    const rowOverlap = targetRow < w.row + w.rowSpan && targetRow + moving.rowSpan > w.row
    return colOverlap && rowOverlap
  })
  if (overlapsAnother) return layout

  return layout.map((entry) =>
    entry.widgetId === widgetId ? { ...entry, col: targetCol, row: targetRow } : entry
  )
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
