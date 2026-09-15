import { useState, type DragEvent, type JSX } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { swapWidgets } from '../../lib/gridLayout'
import type { WidgetId } from '../../lib/types'
import { SearchWidget } from '../SearchWidget/SearchWidget'
import { WeatherWidget } from '../WeatherWidget/WeatherWidget'
import { ShortcutsWidget } from '../ShortcutsWidget/ShortcutsWidget'
import './WidgetGrid.css'

const WIDGET_COMPONENTS: Record<WidgetId, () => JSX.Element> = {
  search: SearchWidget,
  weather: WeatherWidget,
  shortcuts: ShortcutsWidget,
}

export function WidgetGrid() {
  const { settings, update } = useSettings()
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)

  function handleDragStart(id: WidgetId) {
    setDraggingId(id)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetId: WidgetId) {
    if (draggingId && draggingId !== targetId) {
      update((current) => ({
        ...current,
        widgetLayout: swapWidgets(current.widgetLayout, draggingId, targetId),
      }))
    }
    setDraggingId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  return (
    <div className={`widget-grid${draggingId ? ' dragging-active' : ''}`}>
      {settings.widgetLayout.map((entry) => {
        const Widget = WIDGET_COMPONENTS[entry.widgetId]
        return (
          <div
            key={entry.widgetId}
            data-testid={`widget-${entry.widgetId}`}
            className={`widget-cell${draggingId === entry.widgetId ? ' dragging' : ''}`}
            draggable
            style={{
              gridColumnStart: entry.col + 1,
              gridColumnEnd: `span ${entry.colSpan}`,
              gridRowStart: entry.row + 1,
              gridRowEnd: `span ${entry.rowSpan}`,
            }}
            onDragStart={() => handleDragStart(entry.widgetId)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(entry.widgetId)}
            onDragEnd={handleDragEnd}
          >
            <Widget />
          </div>
        )
      })}
    </div>
  )
}
