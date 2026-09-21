import { type DragEvent } from 'react'
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
}

// colSpan/rowSpan here match each widget's smallest size preset (see
// widgetSizes.ts) — the size it's placed at when dropped from this panel,
// and the aspect ratio its picker-card preview is shown at. The two clock
// cards share widgetId 'clock' but differ in clockStyle, which becomes the
// new clock's initial style (still changeable later by clicking it in edit
// mode). Every widget here is multi-instance — dragging one onto the grid
// always adds a new instance, regardless of how many are already placed.
const PICKER_ENTRIES: PickerEntry[] = [
  { key: 'search', widgetId: 'search', label: 'Search', colSpan: 4, rowSpan: 1 },
  { key: 'weather', widgetId: 'weather', label: 'Weather', colSpan: 2, rowSpan: 2 },
  { key: 'shortcut', widgetId: 'shortcut', label: 'Shortcut', colSpan: 1, rowSpan: 1 },
  { key: 'note', widgetId: 'note', label: 'Note', colSpan: 1, rowSpan: 1 },
  { key: 'translator', widgetId: 'translator', label: 'Translator', colSpan: 2, rowSpan: 2 },
  {
    key: 'clock-digital',
    widgetId: 'clock',
    label: 'Clock (Digital)',
    colSpan: 2,
    rowSpan: 2,
    clockStyle: 'digital',
  },
  {
    key: 'clock-analog',
    widgetId: 'clock',
    label: 'Clock (Analog)',
    colSpan: 2,
    rowSpan: 2,
    clockStyle: 'analog',
  },
]

export function WidgetPickerPanel() {
  function handleDragStart(e: DragEvent, entry: PickerEntry) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(
      NEW_WIDGET_DRAG_TYPE,
      JSON.stringify({
        widgetId: entry.widgetId,
        clockStyle: entry.clockStyle,
      })
    )
  }

  return (
    <div className="widget-picker-panel">
      <h3>Add widget</h3>
      <p className="widget-picker-hint">Drag a widget onto the grid to place it.</p>
      <div className="widget-picker-list">
        {PICKER_ENTRIES.map((entry) => (
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
      </div>
    </div>
  )
}
