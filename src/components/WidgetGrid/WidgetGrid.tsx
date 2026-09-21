import { useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { moveWidget, reconcileLayout, resizeWidget } from '../../lib/gridLayout'
import { addShortcutAt, removeShortcut } from '../../lib/shortcutActions'
import { addNoteAt, removeNote } from '../../lib/noteActions'
import { addTranslatorAt, removeTranslator } from '../../lib/translatorActions'
import { addClockAt, removeClock, toggleClockStyle } from '../../lib/clockActions'
import { addSearchAt, removeSearch } from '../../lib/searchActions'
import { addWeatherAt, removeWeather } from '../../lib/weatherActions'
import { isShortcutWidgetId, shortcutIdFromWidgetId } from '../../lib/shortcutWidgets'
import { isNoteWidgetId, noteIdFromWidgetId } from '../../lib/noteWidgets'
import { isTranslatorWidgetId, translatorIdFromWidgetId } from '../../lib/translatorWidgets'
import { isClockWidgetId, clockIdFromWidgetId } from '../../lib/clockWidgets'
import { isSearchWidgetId } from '../../lib/searchWidgets'
import { isWeatherWidgetId } from '../../lib/weatherWidgets'
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
import { WidgetStylePanel, type StyleTarget } from '../WidgetStylePanel/WidgetStylePanel'
import { NEW_WIDGET_DRAG_TYPE } from '../WidgetPickerPanel/WidgetPickerPanel'
import { Icon } from '../Icon/Icon'
import './WidgetGrid.css'

const GRID_GAP_PX = 20
const GRID_PADDING_PX = 40
// Matches .edit-panel-shell's width in EditPanelShell.css — see the comment
// there if this ever needs to change.
const EDIT_PANEL_WIDTH_PX = 320
// The grid's cell size is fixed at this physical pixel size — columns/rows
// are derived from it and the viewport instead of the other way around, so
// a widget always occupies the same on-screen size regardless of display.
export const FIXED_CELL_SIZE_PX = 60
// The largest colSpan/rowSpan among the widget-size presets (Search's
// 10-wide, Weather's 4-tall, see widgetSizes.ts) — columns/rows can never
// be computed below these, or reconcileLayout (which only repositions
// widgets, never shrinks their span) would have nowhere left to put a
// widget that size.
const MIN_GRID_COLUMNS = 10
const MIN_GRID_ROWS = 4

function useAutoGridSize(): { columns: number; rows: number } {
  const [size, setSize] = useState({ columns: 12, rows: 8 })

  useEffect(() => {
    function recalculate() {
      const step = FIXED_CELL_SIZE_PX + GRID_GAP_PX
      const availableWidth = window.innerWidth - GRID_PADDING_PX * 2 + GRID_GAP_PX
      const availableHeight = window.innerHeight - GRID_PADDING_PX * 2 + GRID_GAP_PX
      const columns = Math.max(MIN_GRID_COLUMNS, Math.floor(availableWidth / step))
      const rows = Math.max(MIN_GRID_ROWS, Math.floor(availableHeight / step))
      setSize((current) => (current.columns === columns && current.rows === rows ? current : { columns, rows }))
    }
    recalculate()
    window.addEventListener('resize', recalculate)
    return () => window.removeEventListener('resize', recalculate)
  }, [])

  return size
}

// While the edit panel is open, the grid is visually scaled down and
// shifted left (via a CSS transform) to fit beside it instead of running
// underneath it — transform animates smoothly everywhere, unlike
// grid-template-columns track sizes, which don't interpolate in most
// browsers. cellSize/layout itself stays computed against the full
// viewport; only the rendered presentation shrinks and shifts.
//
// .app-root centers .widget-grid across the *full* window width regardless
// of the panel, so its untransformed left edge sits at
// (innerWidth - gridWidthPx) / 2. transform-origin: top left keeps that
// edge fixed under scale, so translateX moves it the rest of the way to 0
// — the left edge of the space actually available beside the panel.
function usePanelOpenTransform(gridWidthPx: number, panelOpen: boolean): { scale: number; translateX: number } {
  const [transform, setTransform] = useState({ scale: 1, translateX: 0 })

  useEffect(() => {
    function recalculate() {
      if (!panelOpen || gridWidthPx === 0) {
        setTransform({ scale: 1, translateX: 0 })
        return
      }
      const availableWidth = window.innerWidth - EDIT_PANEL_WIDTH_PX
      const scale = Math.min(1, availableWidth / gridWidthPx)
      const untransformedLeft = (window.innerWidth - gridWidthPx) / 2
      setTransform({ scale, translateX: -untransformedLeft })
    }
    recalculate()
    window.addEventListener('resize', recalculate)
    return () => window.removeEventListener('resize', recalculate)
  }, [gridWidthPx, panelOpen])

  return transform
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
  const { settings, update, isEditMode, setIsEditMode } = useSettings()
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [styleEditorWidgetId, setStyleEditorWidgetId] = useState<WidgetId | null>(null)
  const [styleEditorAnchor, setStyleEditorAnchor] = useState<{ x: number; y: number } | null>(null)
  // Frozen so WidgetStylePanel has a target/anchor to render during its
  // closing animation, even if the underlying widget is removed (which
  // would otherwise make styleEditorTarget() go null instantly) or once
  // styleEditorWidgetId itself is cleared by closeStyleEditor.
  const lastStyleTargetRef = useRef<{ target: StyleTarget; anchor: { x: number; y: number } } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { columns, rows } = useAutoGridSize()
  const cellSize = FIXED_CELL_SIZE_PX
  const gridWidthPx = columns * cellSize + GRID_GAP_PX * (columns - 1) + GRID_PADDING_PX * 2
  const { scale: panelScale, translateX: panelTranslateX } = usePanelOpenTransform(gridWidthPx, isEditMode)

  // settings.grid is a derived cache of the viewport-computed columns/rows
  // (not user-editable anymore — see useAutoGridSize) kept in Settings only
  // because addXAt()/findFirstFreeCell() and the storage-migration path
  // read it as plain data outside of React. Keep it in sync whenever the
  // computed size changes. `update` itself isn't in the dependency array —
  // it's a new function identity on every SettingsProvider render, and
  // including it would re-run this effect (and call setSettings) on every
  // render regardless of whether columns/rows actually changed.
  useEffect(() => {
    update((current) => {
      if (current.grid.columns === columns && current.grid.rows === rows) return current
      return { ...current, grid: { columns, rows } }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows])

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
    // rect is the grid's post-transform (visual) box, but cellSize/gap are
    // the pre-transform CSS pixel values baked into gridTemplateColumns —
    // while the edit panel's scale-down is active, a screen pixel covers
    // more grid pixels than 1:1, so the click offset needs to be scaled
    // back up before dividing by cellSize, or every cell past the first
    // would resolve to the wrong column/row.
    const visualScale = rect.width / gridWidthPx
    const localX = (clientX - rect.left) / visualScale
    const localY = (clientY - rect.top) / visualScale
    return {
      col: Math.floor((localX - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX)),
      row: Math.floor((localY - GRID_PADDING_PX) / (cellSize + GRID_GAP_PX)),
    }
  }

  function handleGridDrop(e: DragEvent) {
    e.preventDefault()

    const newWidgetPayload = e.dataTransfer?.getData(NEW_WIDGET_DRAG_TYPE)
    if (newWidgetPayload) {
      const { widgetId, clockStyle } = JSON.parse(newWidgetPayload) as {
        widgetId: 'search' | 'weather' | 'shortcut' | 'note' | 'translator' | 'clock'
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
        if (widgetId === 'search') return addSearchAt(current, target.col, target.row)
        return addWeatherAt(current, target.col, target.row)
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

  function handleRemoveSearch(widgetId: WidgetId) {
    update((current) => removeSearch(current, widgetId))
  }

  function handleRemoveWeather(widgetId: WidgetId) {
    update((current) => removeWeather(current, widgetId))
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
    if (isWeatherWidgetId(widgetId)) return handleRemoveWeather(widgetId)
    handleRemoveSearch(widgetId)
  }

  // Which widget types get the second (style-editor) badge — Weather,
  // Clock, and Shortcut are the only ones with per-instance appearance
  // settings today (see styleEditorTarget below); Search/Note/Translator
  // have nothing to configure there.
  function hasStyleEditor(widgetId: WidgetId): boolean {
    return isWeatherWidgetId(widgetId) || isClockWidgetId(widgetId) || isShortcutWidgetId(widgetId)
  }

  // Human-readable name for badge aria-labels — a shortcut uses its own
  // label (e.g. "Remove GitHub") since widgetId alone ("shortcut:abc") is
  // meaningless to a screen reader; every other type has one fixed name.
  function widgetDisplayName(widgetId: WidgetId): string {
    if (isShortcutWidgetId(widgetId)) {
      const shortcut = settings.shortcuts.find((s) => s.id === shortcutIdFromWidgetId(widgetId))
      if (shortcut?.label) return shortcut.label
    }
    if (isSearchWidgetId(widgetId)) return 'search'
    if (isWeatherWidgetId(widgetId)) return 'weather'
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
        // startX/startY were recorded in screen pixels; while the edit
        // panel's scale-down is active (see usePanelOpenTransform), the
        // grid's own CSS pixels (cellSize/step) are larger than screen
        // pixels by 1/panelScale, so the raw mouse delta needs scaling back
        // up first or a drag would resize far fewer cells than it visually
        // crossed.
        const deltaCol = Math.round((e.clientX - current.startX) / panelScale / step)
        const deltaRow = Math.round((e.clientY - current.startY) / panelScale / step)
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
    if (isWeatherWidgetId(widgetId)) {
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
    if (isSearchWidgetId(widgetId)) return <SearchWidget />
    if (isWeatherWidgetId(widgetId)) {
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

  const isStyleEditorOpen = styleEditorWidgetId !== null
  const resolvedStyleTarget = styleEditorWidgetId ? styleEditorTarget(styleEditorWidgetId) : null
  if (resolvedStyleTarget) lastStyleTargetRef.current = { target: resolvedStyleTarget, anchor: styleEditorAnchor! }
  const frozenStyleTarget = lastStyleTargetRef.current

  return (
    <>
      <div
        ref={gridRef}
        className={`widget-grid${draggingId || isEditMode ? ' dragging-active' : ''}${isEditMode ? ' edit-mode' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: `${GRID_GAP_PX}px`,
          transform: panelScale < 1 ? `translateX(${panelTranslateX}px) scale(${panelScale})` : undefined,
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
                  data-tooltip={`Remove ${widgetDisplayName(entry.widgetId)}`}
                  aria-label={`Remove ${widgetDisplayName(entry.widgetId)}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeAnyWidget(entry.widgetId)
                  }}
                >
                  <Icon name="close" size={10} />
                </span>
                {hasStyleEditor(entry.widgetId) && (
                  <span
                    className="widget-badge widget-badge-style"
                    data-tooltip="Edit style"
                    aria-label={`Edit ${widgetDisplayName(entry.widgetId)} style`}
                    onClick={(e) => openStyleEditor(e, entry.widgetId)}
                  >
                    <Icon name="edit" size={10} />
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
    {frozenStyleTarget && (
      <WidgetStylePanel
        open={isStyleEditorOpen}
        anchor={frozenStyleTarget.anchor}
        onClose={closeStyleEditor}
        target={frozenStyleTarget.target}
      />
    )}
    </>
  )
}
