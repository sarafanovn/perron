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

/**
 * Inserts a brand-new widget (not yet in the layout) at a specific
 * colSpan x rowSpan rectangle, e.g. from a drag-and-drop of a picker card
 * onto a grid cell. Rejects (returns the layout unchanged) if the rectangle
 * runs off the grid's bounds or overlaps any existing widget — same
 * placement rule as moveWidget, but for insertion rather than relocation.
 */
export function placeWidgetAt(
  layout: WidgetLayoutEntry[],
  widgetId: WidgetId,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  columns: number,
  rows: number
): WidgetLayoutEntry[] {
  if (col < 0 || row < 0) return layout
  if (col + colSpan > columns || row + rowSpan > rows) return layout
  if (!rectangleFree(layout, col, row, colSpan, rowSpan)) return layout

  return [...layout, { widgetId, col, row, colSpan, rowSpan }]
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

function rectangleFree(
  layout: WidgetLayoutEntry[],
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number
): boolean {
  for (let r = row; r < row + rowSpan; r++) {
    for (let c = col; c < col + colSpan; c++) {
      if (cellIsOccupied(layout, c, r)) return false
    }
  }
  return true
}

/**
 * Scans left-to-right, top-to-bottom for the first colSpan x rowSpan
 * rectangle that fits entirely within the grid's bounds (columns x rows)
 * without overlapping any existing widget. Returns null if no such
 * rectangle exists — the caller decides what to do (e.g. leave the widget
 * where it is rather than losing it).
 */
export function findFirstFreeSlot(
  layout: WidgetLayoutEntry[],
  colSpan: number,
  rowSpan: number,
  columns: number,
  rows: number
): { col: number; row: number } | null {
  for (let row = 0; row + rowSpan <= rows; row++) {
    for (let col = 0; col + colSpan <= columns; col++) {
      if (rectangleFree(layout, col, row, colSpan, rowSpan)) {
        return { col, row }
      }
    }
  }
  return null
}

/**
 * Called whenever the grid's bounds shrink (density sliders, or a window
 * resize that lowers the viewport-derived column/row count). Any widget
 * whose rectangle now runs off the grid is relocated to the first free slot
 * that fits it; a widget that still fits in place is left untouched so
 * unrelated widgets don't shuffle around every time the grid is resized.
 * A widget with nowhere left to fit is left at its out-of-bounds position
 * rather than deleted — better recoverable than lost.
 */
export function reconcileLayout(
  layout: WidgetLayoutEntry[],
  columns: number,
  rows: number
): WidgetLayoutEntry[] {
  let changed = false
  const result: WidgetLayoutEntry[] = []

  for (const entry of layout) {
    const fitsInPlace = entry.col + entry.colSpan <= columns && entry.row + entry.rowSpan <= rows
    if (fitsInPlace) {
      result.push(entry)
      continue
    }
    const slot = findFirstFreeSlot(result, entry.colSpan, entry.rowSpan, columns, rows)
    if (!slot) {
      result.push(entry)
      continue
    }
    changed = true
    result.push({ ...entry, col: slot.col, row: slot.row })
  }

  return changed ? result : layout
}

function rectanglesOverlap(
  aCol: number,
  aRow: number,
  aColSpan: number,
  aRowSpan: number,
  bCol: number,
  bRow: number,
  bColSpan: number,
  bRowSpan: number
): boolean {
  const colOverlap = aCol < bCol + bColSpan && aCol + aColSpan > bCol
  const rowOverlap = aRow < bRow + bRowSpan && aRow + aRowSpan > bRow
  return colOverlap && rowOverlap
}

/**
 * Resizes one widget in place (its top-left col/row stays put; only
 * colSpan/rowSpan change), clamping col/row back on-grid if the new span
 * would otherwise push it out of bounds. Any other widget now overlapping
 * the resized rectangle is displaced to the first free slot elsewhere in
 * the grid — mirroring reconcileLayout's approach — so growing a widget
 * shuffles its neighbors instead of silently overlapping them. A displaced
 * widget with nowhere left to fit is left at its (now-overlapping) position,
 * same fallback reconcileLayout uses, rather than being lost.
 */
export function resizeWidget(
  layout: WidgetLayoutEntry[],
  widgetId: WidgetId,
  colSpan: number,
  rowSpan: number,
  columns: number,
  rows: number
): WidgetLayoutEntry[] {
  const target = layout.find((w) => w.widgetId === widgetId)
  if (!target) return layout
  if (target.colSpan === colSpan && target.rowSpan === rowSpan) return layout

  const col = Math.max(0, Math.min(target.col, columns - colSpan))
  const row = Math.max(0, Math.min(target.row, rows - rowSpan))

  const resizedTarget: WidgetLayoutEntry = { ...target, col, row, colSpan, rowSpan }
  const displaced = layout.filter(
    (w) =>
      w.widgetId !== widgetId &&
      rectanglesOverlap(col, row, colSpan, rowSpan, w.col, w.row, w.colSpan, w.rowSpan)
  )
  const untouched = layout.filter(
    (w) => w.widgetId !== widgetId && !displaced.includes(w)
  )

  const result: WidgetLayoutEntry[] = [resizedTarget, ...untouched]
  for (const entry of displaced) {
    const slot = findFirstFreeSlot(result, entry.colSpan, entry.rowSpan, columns, rows)
    result.push(slot ? { ...entry, col: slot.col, row: slot.row } : entry)
  }

  return result
}
