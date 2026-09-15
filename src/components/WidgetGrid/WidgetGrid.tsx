import { useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { moveWidget, findFirstFreeCell, reconcileLayout, resizeWidget } from '../../lib/gridLayout'
import { addShortcut, removeShortcut } from '../../lib/shortcutActions'
import { isShortcutWidgetId, shortcutIdFromWidgetId } from '../../lib/shortcutWidgets'
import { shapeForWidget } from '../../lib/widgetShapes'
import { sizePresets, closestPreset } from '../../lib/widgetSizes'
import type { WidgetId } from '../../lib/types'
import { SearchWidget } from '../SearchWidget/SearchWidget'
import { WeatherWidget } from '../WeatherWidget/WeatherWidget'
import { ShortcutTile } from '../ShortcutTile/ShortcutTile'
import { AddShortcutTile } from '../AddShortcutTile/AddShortcutTile'
import { Squircle } from '../Squircle/Squircle'
import './WidgetGrid.css'

const GRID_GAP_PX = 20
const GRID_PADDING_PX = 40
export const MIN_CELL_SIZE_PX = 60
export const MAX_CELL_SIZE_PX = 200

function useCellSizePx(columns: number, rows: number): number {
  const [cellSize, setCellSize] = useState(120)

  useEffect(() => {
    function recalculate() {
      const availableWidth = window.innerWidth - GRID_PADDING_PX * 2 - GRID_GAP_PX * (columns - 1)
      const availableHeight = window.innerHeight - GRID_PADDING_PX * 2 - GRID_GAP_PX * (rows - 1)
      const size = Math.min(availableWidth / columns, availableHeight / rows)
      setCellSize(Math.min(Math.max(size, MIN_CELL_SIZE_PX), MAX_CELL_SIZE_PX))
    }
    recalculate()
    window.addEventListener('resize', recalculate)
    return () => window.removeEventListener('resize', recalculate)
  }, [columns, rows])

  return cellSize
}

interface ResizeState {
  widgetId: WidgetId
  startColSpan: number
  startRowSpan: number
  startX: number
  startY: number
  trialColSpan: number
  trialRowSpan: number
}

export function WidgetGrid() {
  const { settings, update, isAdjustingGrid, isEditMode, setIsEditMode } = useSettings()
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { columns, rows } = settings.grid
  const cellSize = useCellSizePx(columns, rows)

  // Whenever the grid's bounds shrink (density sliders, or a window resize
  // that lowers the viewport-derived cell count), pull back in any widget
  // that now runs off the edge instead of leaving it stuck out of view.
  useEffect(() => {
    update((current) => {
      const reconciled = reconcileLayout(current.widgetLayout, columns, rows)
      if (reconciled === current.widgetLayout) return current
      return { ...current, widgetLayout: reconciled }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows])

  function handleDragStart(id: WidgetId) {
    setDraggingId(id)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function handleGridDrop(e: DragEvent) {
    e.preventDefault()
    if (!draggingId || !gridRef.current) {
      setDraggingId(null)
      return
    }
    const rect = gridRef.current.getBoundingClientRect()
    const targetCol = Math.floor((e.clientX - rect.left - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX))
    const targetRow = Math.floor((e.clientY - rect.top - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX))
    update((current) => ({
      ...current,
      widgetLayout: moveWidget(current.widgetLayout, draggingId, targetCol, targetRow, columns, rows),
    }))
    setDraggingId(null)
  }

  function handleAddShortcut(shortcut: { label: string; url: string }) {
    update((current) => addShortcut(current, shortcut))
  }

  function handleRemoveShortcut(shortcutId: string) {
    update((current) => removeShortcut(current, shortcutId))
  }

  function handleGridBackgroundClick(e: ReactMouseEvent) {
    if (e.target === gridRef.current) setIsEditMode(false)
  }

  function startResize(e: ReactMouseEvent, widgetId: WidgetId, colSpan: number, rowSpan: number) {
    e.preventDefault()
    e.stopPropagation()
    setResizeState({
      widgetId,
      startColSpan: colSpan,
      startRowSpan: rowSpan,
      startX: e.clientX,
      startY: e.clientY,
      trialColSpan: colSpan,
      trialRowSpan: rowSpan,
    })
  }

  useEffect(() => {
    if (!resizeState) return

    const step = cellSize + GRID_GAP_PX

    function handleMove(e: globalThis.MouseEvent) {
      setResizeState((current) => {
        if (!current) return current
        const deltaCol = Math.round((e.clientX - current.startX) / step)
        const deltaRow = Math.round((e.clientY - current.startY) / step)
        const trialColSpan = Math.max(1, Math.min(columns, current.startColSpan + deltaCol))
        const trialRowSpan = Math.max(1, Math.min(rows, current.startRowSpan + deltaRow))
        if (trialColSpan === current.trialColSpan && trialRowSpan === current.trialRowSpan) return current
        return { ...current, trialColSpan, trialRowSpan }
      })
    }

    function handleUp() {
      setResizeState((current) => {
        if (!current) return null
        const preset = closestPreset(current.widgetId, current.trialColSpan, current.trialRowSpan)
        update((settings) => ({
          ...settings,
          widgetLayout: resizeWidget(
            settings.widgetLayout,
            current.widgetId,
            preset.colSpan,
            preset.rowSpan,
            columns,
            rows
          ),
        }))
        return null
      })
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeState !== null, cellSize, columns, rows])

  function renderWidget(widgetId: WidgetId) {
    if (widgetId === 'search') return <SearchWidget />
    if (widgetId === 'weather') return <WeatherWidget />
    if (isShortcutWidgetId(widgetId)) {
      const shortcutId = shortcutIdFromWidgetId(widgetId)
      const shortcut = settings.shortcuts.find((s) => s.id === shortcutId)
      if (!shortcut) return null
      return <ShortcutTile shortcut={shortcut} onRemove={handleRemoveShortcut} editMode={isEditMode} />
    }
    return null
  }

  const addTilePosition = findFirstFreeCell(settings.widgetLayout, columns)

  return (
    <div
      ref={gridRef}
      className={`widget-grid${draggingId || isAdjustingGrid || isEditMode ? ' dragging-active' : ''}${isEditMode ? ' edit-mode' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: `${GRID_GAP_PX}px`,
        ['--cell-size' as string]: `${cellSize}px`,
        ['--grid-gap' as string]: `${GRID_GAP_PX}px`,
        ['--grid-padding' as string]: `${GRID_PADDING_PX}px`,
      }}
      onDragOver={handleDragOver}
      onDrop={handleGridDrop}
      onClick={handleGridBackgroundClick}
    >
      {settings.widgetLayout.map((entry, index) => {
        const isResizingThis = resizeState?.widgetId === entry.widgetId
        const presets = sizePresets(entry.widgetId)
        const canResizeCol = presets.some((p) => p.colSpan !== presets[0].colSpan)
        const canResizeRow = presets.some((p) => p.rowSpan !== presets[0].rowSpan)
        const canResize = presets.length > 1

        const overlayWidth = isResizingThis
          ? resizeState!.trialColSpan * cellSize + (resizeState!.trialColSpan - 1) * GRID_GAP_PX
          : undefined
        const overlayHeight = isResizingThis
          ? resizeState!.trialRowSpan * cellSize + (resizeState!.trialRowSpan - 1) * GRID_GAP_PX
          : undefined

        return (
          <div
            key={entry.widgetId}
            data-testid={`widget-${entry.widgetId}`}
            className={`widget-cell${draggingId === entry.widgetId ? ' dragging' : ''}${isEditMode ? ' edit-mode' : ''}${index % 2 === 0 ? ' jiggle-a' : ' jiggle-b'}${isResizingThis ? ' resizing' : ''}`}
            draggable={!isEditMode}
            style={{
              gridColumnStart: entry.col + 1,
              gridColumnEnd: `span ${entry.colSpan}`,
              gridRowStart: entry.row + 1,
              gridRowEnd: `span ${entry.rowSpan}`,
              width: overlayWidth,
              height: overlayHeight,
              zIndex: isResizingThis ? 5 : undefined,
            }}
            onDragStart={() => handleDragStart(entry.widgetId)}
            onDragEnd={handleDragEnd}
          >
            <Squircle shape={shapeForWidget(entry.widgetId)}>{renderWidget(entry.widgetId)}</Squircle>
            {isEditMode && canResize && (
              <>
                {canResizeCol && (
                  <div
                    className="resize-handle resize-handle-e"
                    onMouseDown={(e) => startResize(e, entry.widgetId, entry.colSpan, entry.rowSpan)}
                  />
                )}
                {canResizeRow && (
                  <div
                    className="resize-handle resize-handle-s"
                    onMouseDown={(e) => startResize(e, entry.widgetId, entry.colSpan, entry.rowSpan)}
                  />
                )}
                {canResizeCol && canResizeRow && (
                  <div
                    className="resize-handle resize-handle-se"
                    onMouseDown={(e) => startResize(e, entry.widgetId, entry.colSpan, entry.rowSpan)}
                  />
                )}
              </>
            )}
          </div>
        )
      })}
      {!isEditMode && (
        <div
          data-testid="widget-add-shortcut"
          className="widget-cell"
          style={{
            gridColumnStart: addTilePosition.col + 1,
            gridColumnEnd: 'span 1',
            gridRowStart: addTilePosition.row + 1,
            gridRowEnd: 'span 1',
          }}
        >
          <Squircle>
            <AddShortcutTile onAdd={handleAddShortcut} />
          </Squircle>
        </div>
      )}
    </div>
  )
}
