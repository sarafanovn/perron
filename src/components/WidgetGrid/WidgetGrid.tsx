import { useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { moveWidget, reconcileLayout, resizeWidget } from '../../lib/gridLayout'
import { addShortcutAt, removeShortcut } from '../../lib/shortcutActions'
import { addNoteAt, removeNote } from '../../lib/noteActions'
import { addTranslatorAt, removeTranslator } from '../../lib/translatorActions'
import { addClockAt, removeClock, toggleClockStyle } from '../../lib/clockActions'
import { addWidgetAt, removeWidget } from '../../lib/widgetActions'
import { isShortcutWidgetId, shortcutIdFromWidgetId } from '../../lib/shortcutWidgets'
import { isNoteWidgetId, noteIdFromWidgetId } from '../../lib/noteWidgets'
import { isTranslatorWidgetId, translatorIdFromWidgetId } from '../../lib/translatorWidgets'
import { isClockWidgetId, clockIdFromWidgetId } from '../../lib/clockWidgets'
import { shapeForWidget } from '../../lib/widgetShapes'
import { sizePresets, closestPreset } from '../../lib/widgetSizes'
import type { ClockStyle, Translator, WidgetId } from '../../lib/types'
import { SearchWidget } from '../SearchWidget/SearchWidget'
import { WeatherWidget } from '../WeatherWidget/WeatherWidget'
import { ShortcutTile } from '../ShortcutTile/ShortcutTile'
import { AddShortcutTile } from '../AddShortcutTile/AddShortcutTile'
import { NoteWidget } from '../NoteWidget/NoteWidget'
import { TranslatorWidget } from '../TranslatorWidget/TranslatorWidget'
import { ClockWidget } from '../ClockWidget/ClockWidget'
import { Squircle } from '../Squircle/Squircle'
import { WidgetStylePanel } from '../WidgetStylePanel/WidgetStylePanel'
import { NEW_WIDGET_DRAG_TYPE } from '../WidgetPickerPanel/WidgetPickerPanel'
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
      // Round to a whole pixel: the grid overlay's repeating-gradient period
      // and the actual grid-template-columns/rows track size are computed
      // from this same value independently. A fractional cellSize (e.g.
      // 141.6667px) gets rounded slightly differently by each — the browser
      // snaps rendered grid tracks to device pixels, while the gradient
      // pattern uses the raw float — and that sub-pixel gap compounds across
      // columns/rows until widgets visibly drift away from the grid lines.
      setCellSize(Math.round(Math.min(Math.max(size, MIN_CELL_SIZE_PX), MAX_CELL_SIZE_PX)))
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
  const [styleEditorWidgetId, setStyleEditorWidgetId] = useState<WidgetId | null>(null)
  const [styleEditorAnchor, setStyleEditorAnchor] = useState<{ x: number; y: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { columns, rows } = settings.grid
  const cellSize = useCellSizePx(columns, rows)

  function openStyleEditor(e: ReactMouseEvent, widgetId: WidgetId) {
    e.preventDefault()
    e.stopPropagation()
    // Anchors the popover just past the badge itself; clamped off the right/
    // bottom edge so it never renders partly off-screen for a widget near
    // the viewport's edge.
    const x = Math.min(e.clientX + 8, window.innerWidth - 236)
    const y = Math.min(e.clientY + 8, window.innerHeight - 160)
    setStyleEditorAnchor({ x, y })
    setStyleEditorWidgetId(widgetId)
  }

  function closeStyleEditor() {
    setStyleEditorWidgetId(null)
    setStyleEditorAnchor(null)
  }

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

  // Where within the dragged widget (in whole cells from its top-left) the
  // pointer originally grabbed it — so dropping lands the *grabbed* cell
  // under the cursor instead of always forcing the widget's top-left there.
  // Grabbing a 2x2 widget by its bottom-right corner and dropping it should
  // put that corner where the cursor is, not snap the top-left to it.
  const grabOffsetRef = useRef({ col: 0, row: 0 })

  function handleDragStart(e: DragEvent, id: WidgetId, entryCol: number, entryRow: number) {
    setDraggingId(id)
    const point = cellAtPoint(e.clientX, e.clientY)
    grabOffsetRef.current = point ? { col: point.col - entryCol, row: point.row - entryRow } : { col: 0, row: 0 }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDragEnd() {
    setDraggingId(null)
    grabOffsetRef.current = { col: 0, row: 0 }
  }

  function cellAtPoint(clientX: number, clientY: number): { col: number; row: number } | null {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    return {
      col: Math.floor((clientX - rect.left - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX)),
      row: Math.floor((clientY - rect.top - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX)),
    }
  }

  function handleGridDrop(e: DragEvent) {
    e.preventDefault()

    const newWidgetPayload = e.dataTransfer?.getData(NEW_WIDGET_DRAG_TYPE)
    if (newWidgetPayload) {
      const { widgetId, colSpan, rowSpan, clockStyle } = JSON.parse(newWidgetPayload) as {
        widgetId: 'search' | 'weather' | 'shortcut' | 'note' | 'translator' | 'clock'
        colSpan: number
        rowSpan: number
        clockStyle?: ClockStyle
      }
      const point = cellAtPoint(e.clientX, e.clientY)
      if (!point) return
      // A brand-new widget from the picker is grabbed by a small preview
      // thumbnail rather than its real placed shape, so there's no
      // meaningful "grab point within the shape" to preserve — it's always
      // dropped with its top-left at the cursor's cell.
      const target = point
      update((current) => {
        if (widgetId === 'shortcut') return addShortcutAt(current, target.col, target.row)
        if (widgetId === 'note') return addNoteAt(current, target.col, target.row)
        if (widgetId === 'translator') return addTranslatorAt(current, target.col, target.row)
        if (widgetId === 'clock') return addClockAt(current, clockStyle ?? 'digital', target.col, target.row)
        return addWidgetAt(current, widgetId, target.col, target.row, colSpan, rowSpan)
      })
      return
    }

    if (!draggingId || !gridRef.current) {
      setDraggingId(null)
      return
    }
    const point = cellAtPoint(e.clientX, e.clientY)
    if (point) {
      const target = {
        col: point.col - grabOffsetRef.current.col,
        row: point.row - grabOffsetRef.current.row,
      }
      update((current) => ({
        ...current,
        widgetLayout: moveWidget(current.widgetLayout, draggingId, target.col, target.row, columns, rows),
      }))
    }
    setDraggingId(null)
  }

  function handleSaveShortcut(shortcutId: string, details: { label: string; url: string }) {
    update((current) => ({
      ...current,
      shortcuts: current.shortcuts.map((s) => (s.id === shortcutId ? { ...s, ...details } : s)),
    }))
  }

  function handleRemoveShortcut(shortcutId: string) {
    update((current) => removeShortcut(current, shortcutId))
  }

  function handleChangeNote(noteId: string, text: string) {
    update((current) => ({
      ...current,
      notes: current.notes.map((n) => (n.id === noteId ? { ...n, text } : n)),
    }))
  }

  function handleRemoveNote(noteId: string) {
    update((current) => removeNote(current, noteId))
  }

  function handleChangeTranslator(translatorId: string, patch: Partial<Omit<Translator, 'id'>>) {
    update((current) => ({
      ...current,
      translators: current.translators.map((t) => (t.id === translatorId ? { ...t, ...patch } : t)),
    }))
  }

  function handleRemoveTranslator(translatorId: string) {
    update((current) => removeTranslator(current, translatorId))
  }

  function handleRemoveClock(clockId: string) {
    update((current) => removeClock(current, clockId))
  }

  function handleToggleClockStyle(clockId: string) {
    update((current) => toggleClockStyle(current, clockId))
  }

  function handleSetWeatherDynamicBackground(dynamicBackground: boolean) {
    update((current) => ({ ...current, weather: { ...current.weather, dynamicBackground } }))
  }

  function handleRemoveWidget(widgetId: WidgetId) {
    update((current) => removeWidget(current, widgetId))
  }

  // Single remove entry point for the badge rendered in the grid loop below
  // — routes to whichever collection actually owns this widget instead of
  // each widget type's content component reaching for its own onRemove
  // prop (which would put the remove badge inside the jiggling shape).
  function removeAnyWidget(widgetId: WidgetId) {
    if (isShortcutWidgetId(widgetId)) return handleRemoveShortcut(shortcutIdFromWidgetId(widgetId))
    if (isNoteWidgetId(widgetId)) return handleRemoveNote(noteIdFromWidgetId(widgetId))
    if (isTranslatorWidgetId(widgetId)) return handleRemoveTranslator(translatorIdFromWidgetId(widgetId))
    if (isClockWidgetId(widgetId)) return handleRemoveClock(clockIdFromWidgetId(widgetId))
    handleRemoveWidget(widgetId)
  }

  // Which widget types get the second (style-editor) badge — Weather,
  // Clock, and Shortcut are the only ones with per-instance appearance
  // settings today (see styleEditorTarget below); Search/Note/Translator
  // have nothing to configure there.
  function hasStyleEditor(widgetId: WidgetId): boolean {
    return widgetId === 'weather' || isClockWidgetId(widgetId) || isShortcutWidgetId(widgetId)
  }

  // Human-readable name for badge aria-labels — a shortcut uses its own
  // label (e.g. "Remove GitHub") since widgetId alone ("shortcut:abc") is
  // meaningless to a screen reader; every other type has one fixed name.
  function widgetDisplayName(widgetId: WidgetId): string {
    if (isShortcutWidgetId(widgetId)) {
      const shortcut = settings.shortcuts.find((s) => s.id === shortcutIdFromWidgetId(widgetId))
      if (shortcut?.label) return shortcut.label
    }
    if (widgetId === 'search') return 'search'
    if (widgetId === 'weather') return 'weather'
    if (isNoteWidgetId(widgetId)) return 'note'
    if (isTranslatorWidgetId(widgetId)) return 'translator'
    if (isClockWidgetId(widgetId)) return 'clock'
    return widgetId
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

  function styleEditorTarget(widgetId: WidgetId): Parameters<typeof WidgetStylePanel>[0]['target'] | null {
    if (widgetId === 'weather') {
      return {
        kind: 'weather',
        dynamicBackground: settings.weather.dynamicBackground,
        onToggleDynamicBackground: handleSetWeatherDynamicBackground,
      }
    }
    if (isClockWidgetId(widgetId)) {
      const clockId = clockIdFromWidgetId(widgetId)
      const clock = settings.clocks.find((c) => c.id === clockId)
      if (!clock) return null
      return {
        kind: 'clock',
        clock,
        onUpdate: (patch) =>
          update((current) => ({
            ...current,
            clocks: current.clocks.map((c) => (c.id === clockId ? { ...c, ...patch } : c)),
          })),
      }
    }
    if (isShortcutWidgetId(widgetId)) {
      const shortcutId = shortcutIdFromWidgetId(widgetId)
      const shortcut = settings.shortcuts.find((s) => s.id === shortcutId)
      if (!shortcut) return null
      return { kind: 'shortcut', shortcut, onSave: (details) => handleSaveShortcut(shortcutId, details) }
    }
    return null
  }

  function renderWidget(widgetId: WidgetId, colSpan: number, rowSpan: number) {
    if (widgetId === 'search') return <SearchWidget />
    if (widgetId === 'weather') {
      return (
        <WeatherWidget
          colSpan={colSpan}
          rowSpan={rowSpan}
          dynamicBackground={settings.weather.dynamicBackground}
        />
      )
    }
    if (isShortcutWidgetId(widgetId)) {
      const shortcutId = shortcutIdFromWidgetId(widgetId)
      const shortcut = settings.shortcuts.find((s) => s.id === shortcutId)
      if (!shortcut) return null
      if (!shortcut.label && !shortcut.url) {
        return (
          <AddShortcutTile
            onSave={(details) => handleSaveShortcut(shortcutId, details)}
            onCancel={() => handleRemoveShortcut(shortcutId)}
          />
        )
      }
      return <ShortcutTile shortcut={shortcut} editMode={isEditMode} />
    }
    if (isNoteWidgetId(widgetId)) {
      const noteId = noteIdFromWidgetId(widgetId)
      const note = settings.notes.find((n) => n.id === noteId)
      if (!note) return null
      return <NoteWidget note={note} onChange={handleChangeNote} editMode={isEditMode} />
    }
    if (isTranslatorWidgetId(widgetId)) {
      const translatorId = translatorIdFromWidgetId(widgetId)
      const translator = settings.translators.find((t) => t.id === translatorId)
      if (!translator) return null
      return (
        <TranslatorWidget
          translator={translator}
          onChange={handleChangeTranslator}
          editMode={isEditMode}
          colSpan={colSpan}
        />
      )
    }
    if (isClockWidgetId(widgetId)) {
      const clockId = clockIdFromWidgetId(widgetId)
      const clock = settings.clocks.find((c) => c.id === clockId)
      if (!clock) return null
      return <ClockWidget clock={clock} onToggleStyle={handleToggleClockStyle} editMode={isEditMode} />
    }
    return null
  }

  const activeStyleTarget = styleEditorWidgetId ? styleEditorTarget(styleEditorWidgetId) : null

  return (
    <>
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
        const displayColSpan = isResizingThis ? resizeState!.trialColSpan : entry.colSpan
        const displayRowSpan = isResizingThis ? resizeState!.trialRowSpan : entry.rowSpan

        // An unconfigured shortcut (just dropped, label/url still empty)
        // renders AddShortcutTile instead — that has its own Cancel button,
        // not a remove/style badge pair.
        const isUnconfiguredShortcut =
          isShortcutWidgetId(entry.widgetId) &&
          (() => {
            const s = settings.shortcuts.find((sc) => sc.id === shortcutIdFromWidgetId(entry.widgetId))
            return s ? !s.label && !s.url : false
          })()

        return (
          <div
            key={entry.widgetId}
            data-testid={`widget-${entry.widgetId}`}
            className={`widget-cell${draggingId === entry.widgetId ? ' dragging' : ''}${isEditMode ? ' edit-mode' : ''}${isResizingThis ? ' resizing' : ''}`}
            draggable={isEditMode}
            style={{
              gridColumnStart: entry.col + 1,
              gridColumnEnd: `span ${entry.colSpan}`,
              gridRowStart: entry.row + 1,
              gridRowEnd: `span ${entry.rowSpan}`,
              width: overlayWidth,
              height: overlayHeight,
              zIndex: isResizingThis ? 5 : undefined,
            }}
            onDragStart={(e) => handleDragStart(e, entry.widgetId, entry.col, entry.row)}
            onDragEnd={handleDragEnd}
          >
            {/* The jiggle rotation lives on this inner wrapper, not
                .widget-cell itself, so the remove/style badges and resize
                handles (siblings below, outside this div) stay still while
                only the widget's own shape wobbles — matching iOS, where
                the delete badge doesn't spin with the icon. */}
            <div className={`widget-cell-shake${isEditMode ? ` edit-mode${index % 2 === 0 ? ' jiggle-a' : ' jiggle-b'}` : ''}${isResizingThis ? ' resizing' : ''}`}>
              <Squircle shape={shapeForWidget(entry.widgetId, displayColSpan, displayRowSpan)}>
                {renderWidget(entry.widgetId, displayColSpan, displayRowSpan)}
              </Squircle>
            </div>
            {isEditMode && !isUnconfiguredShortcut && (
              <>
                <span
                  className="widget-badge widget-badge-remove"
                  aria-label={`Remove ${widgetDisplayName(entry.widgetId)}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeAnyWidget(entry.widgetId)
                  }}
                >
                  ✕
                </span>
                {hasStyleEditor(entry.widgetId) && (
                  <span
                    className="widget-badge widget-badge-style"
                    aria-label={`Edit ${widgetDisplayName(entry.widgetId)} style`}
                    onClick={(e) => openStyleEditor(e, entry.widgetId)}
                  >
                    ✎
                  </span>
                )}
              </>
            )}
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
    </div>
    {activeStyleTarget && (
      <WidgetStylePanel anchor={styleEditorAnchor!} onClose={closeStyleEditor} target={activeStyleTarget} />
    )}
    </>
  )
}
