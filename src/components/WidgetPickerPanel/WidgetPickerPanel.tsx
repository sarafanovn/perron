import type { DragEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { WidgetPreview, type PreviewWidgetId } from '../WidgetPreview/WidgetPreview'
import type { ClockStyle } from '../../lib/types'
import './WidgetPickerPanel.css'

// Custom MIME type carried in the native drag's dataTransfer so WidgetGrid
// can tell "a new widget dragged in from this panel" apart from "an existing
// widget being repositioned" (which instead tracks its dragged id in local
// React state, since drag start and drop both happen inside WidgetGrid).
export const NEW_WIDGET_DRAG_TYPE = 'application/x-perron-new-widget'

interface PickerEntry {
  key: string
  widgetId: PreviewWidgetId
  label: string
  colSpan: number
  rowSpan: number
  clockStyle?: ClockStyle
  // Multi-instance widgets (shortcut, note, translator, clock) are always
  // offered, even when some are already on the grid; singletons (search,
  // weather) are hidden once placed, since there's nowhere else to put a
  // second one.
  singleton: boolean
}

// colSpan/rowSpan here match each widget's smallest size preset (see
// widgetSizes.ts) — the size it's placed at when dropped from this panel,
// and the aspect ratio its picker-card preview is shown at. The two clock
// cards share widgetId 'clock' but differ in clockStyle, which becomes the
// new clock's initial style (still changeable later by clicking it in edit
// mode).
const PICKER_ENTRIES: PickerEntry[] = [
  { key: 'search', widgetId: 'search', label: 'Search', colSpan: 4, rowSpan: 1, singleton: true },
  { key: 'weather', widgetId: 'weather', label: 'Weather', colSpan: 2, rowSpan: 2, singleton: true },
  { key: 'shortcut', widgetId: 'shortcut', label: 'Shortcut', colSpan: 1, rowSpan: 1, singleton: false },
  { key: 'note', widgetId: 'note', label: 'Note', colSpan: 1, rowSpan: 1, singleton: false },
  { key: 'translator', widgetId: 'translator', label: 'Translator', colSpan: 2, rowSpan: 2, singleton: false },
  {
    key: 'clock-digital',
    widgetId: 'clock',
    label: 'Clock (Digital)',
    colSpan: 2,
    rowSpan: 2,
    clockStyle: 'digital',
    singleton: false,
  },
  {
    key: 'clock-analog',
    widgetId: 'clock',
    label: 'Clock (Analog)',
    colSpan: 2,
    rowSpan: 2,
    clockStyle: 'analog',
    singleton: false,
  },
]

export function WidgetPickerPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSettings()

  if (!open) return null

  const placedIds = new Set(settings.widgetLayout.map((w) => w.widgetId))
  const available = PICKER_ENTRIES.filter((entry) => !entry.singleton || !placedIds.has(entry.widgetId))
  const hiddenSingletons = PICKER_ENTRIES.filter((entry) => entry.singleton && placedIds.has(entry.widgetId))

  function handleDragStart(e: DragEvent, entry: PickerEntry) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(
      NEW_WIDGET_DRAG_TYPE,
      JSON.stringify({
        widgetId: entry.widgetId,
        colSpan: entry.colSpan,
        rowSpan: entry.rowSpan,
        clockStyle: entry.clockStyle,
      })
    )
  }

  return (
    <div className="widget-picker-panel">
      <div className="widget-picker-header">
        <h3>Add widget</h3>
        <button className="close-btn" aria-label="Close widget picker" onClick={onClose}>
          ✕
        </button>
      </div>
      <p className="widget-picker-hint">Drag a widget onto the grid to place it.</p>
      <div className="widget-picker-list">
        {available.map((entry) => (
          <div
            key={entry.key}
            className="widget-picker-card"
            draggable
            aria-label={`Add ${entry.label}`}
            onDragStart={(e) => handleDragStart(e, entry)}
          >
            <WidgetPreview
              widgetId={entry.widgetId}
              colSpan={entry.colSpan}
              rowSpan={entry.rowSpan}
              clockStyle={entry.clockStyle}
            />
            <span className="widget-picker-label">{entry.label}</span>
          </div>
        ))}
        {hiddenSingletons.length > 0 && (
          <p className="widget-picker-empty">
            {hiddenSingletons.map((entry) => entry.label).join(' and ')} already on your grid.
          </p>
        )}
      </div>
    </div>
  )
}
