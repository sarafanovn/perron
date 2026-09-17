import { Squircle } from '../Squircle/Squircle'
import { shapeForWidget } from '../../lib/widgetShapes'
import { weatherBackground, weatherIcon } from '../../lib/weatherBackground'
import type { ClockStyle } from '../../lib/types'
import '../SearchWidget/SearchWidget.css'
import '../WeatherWidget/WeatherWidget.css'
import '../ShortcutTile/ShortcutTile.css'
import '../NoteWidget/NoteWidget.css'
import '../TranslatorWidget/TranslatorWidget.css'
import '../ClockWidget/ClockWidget.css'
import './WidgetPreview.css'

export type PreviewWidgetId = 'search' | 'weather' | 'shortcut' | 'note' | 'translator' | 'clock'

// A representative cell size/gap, matching WidgetGrid's own defaults
// (MIN/MAX_CELL_SIZE_PX span 60-200, with 120 as its initial value before
// the viewport-based recalculation runs) and its GRID_GAP_PX. The preview is
// laid out at this real scale — same font sizes, same --radius-widget in
// actual pixels as the grid uses — then shrunk uniformly with CSS transform
// so it fits a narrow picker card. A --radius-widget rounded corner (or the
// squircle curve) only reads with the right proportions when it's computed
// against a close-to-real cell size; rendering small from the start and
// reusing the same fixed pixel radius made corners read far rounder than
// the genuine widget.
const PREVIEW_CELL_SIZE_PX = 120
const PREVIEW_GRID_GAP_PX = 20

// Card width the picker's preview area actually has to fit in (panel width
// 280px minus its horizontal padding); the widest widget (search, 4 cols)
// sets the scale, and every widget shrinks by that same factor so their
// relative sizes on the card still match their relative sizes on the grid.
const PREVIEW_MAX_WIDTH_PX = 232
const SEARCH_COL_SPAN = 4
const SEARCH_REAL_WIDTH_PX = SEARCH_COL_SPAN * PREVIEW_CELL_SIZE_PX + (SEARCH_COL_SPAN - 1) * PREVIEW_GRID_GAP_PX
const PREVIEW_SCALE = PREVIEW_MAX_WIDTH_PX / SEARCH_REAL_WIDTH_PX

// A fixed mockup time (matching Apple's own "9:41" convention) rather than
// the real current time — the preview is a static, non-ticking stand-in, so
// wiring it to a live clock would just be a clock that never updates.
const ANALOG_HOUR_ANGLE = 9 * 30 + 41 * 0.5
const ANALOG_MINUTE_ANGLE = 41 * 6

/**
 * A static, non-interactive stand-in for each widget's real component, used
 * only in WidgetPickerPanel so a picker card can show the widget's actual
 * shape, aspect ratio, and rough look before it's dropped onto the grid.
 * Unlike the real widgets (SearchWidget, WeatherWidget, ...), this fires no
 * network requests, reads no settings, and holds no state — every field is
 * hardcoded sample content, and it reuses each real widget's own CSS classes
 * so the preview stays visually honest without duplicating their styles.
 */
function previewContent(widgetId: PreviewWidgetId, clockStyle?: ClockStyle) {
  switch (widgetId) {
    case 'search':
      return (
        <div className="search-widget" aria-hidden>
          <span className="widget-preview-fake-select">Google</span>
          <span className="widget-preview-fake-text">Search the web</span>
        </div>
      )
    case 'weather':
      return (
        <div className="weather-widget" aria-hidden style={{ background: weatherBackground(1, 'day') }}>
          <div className="weather-current">
            <div className="weather-current-main">
              <span className="weather-icon">{weatherIcon(1, true)}</span>
              <span className="temp">17°</span>
            </div>
            <div className="weather-current-details">
              <span className="weather-location">San Francisco</span>
              <span className="weather-feels-like">Feels like 16°</span>
            </div>
          </div>
        </div>
      )
    case 'shortcut':
      return (
        <div className="shortcut-tile" aria-hidden>
          <span className="widget-preview-fake-favicon" />
          github.com
        </div>
      )
    case 'note':
      return (
        <div className="note-widget" aria-hidden>
          <p className="widget-preview-fake-note-text">Buy milk</p>
        </div>
      )
    case 'translator':
      return (
        <div className="translator-widget" aria-hidden>
          <div className="translator-langs">
            <span className="widget-preview-fake-select">Russian</span>
            <span className="swap-btn">⇄</span>
            <span className="widget-preview-fake-select">English</span>
          </div>
          <div className="translator-result">Hello!</div>
        </div>
      )
    case 'clock':
      return (
        <div className="clock-widget" aria-hidden>
          {clockStyle === 'analog' ? (
            <div className="clock-widget-analog">
              <svg viewBox="0 0 100 100" className="clock-widget-face">
                <circle cx="50" cy="50" r="48" className="clock-widget-face-circle" />
                {Array.from({ length: 12 }, (_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="6"
                    x2="50"
                    y2="12"
                    className="clock-widget-tick"
                    transform={`rotate(${i * 30} 50 50)`}
                  />
                ))}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="26"
                  className="clock-widget-hand clock-widget-hour-hand"
                  transform={`rotate(${ANALOG_HOUR_ANGLE} 50 50)`}
                />
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="16"
                  className="clock-widget-hand clock-widget-minute-hand"
                  transform={`rotate(${ANALOG_MINUTE_ANGLE} 50 50)`}
                />
                <circle cx="50" cy="50" r="3" className="clock-widget-hub" />
              </svg>
            </div>
          ) : (
            <div className="clock-widget-digital">
              <span className="clock-widget-time">9:41</span>
              <span className="clock-widget-date">Wed, 17 Sep</span>
            </div>
          )}
        </div>
      )
  }
}

export function WidgetPreview({
  widgetId,
  colSpan,
  rowSpan,
  clockStyle,
}: {
  widgetId: PreviewWidgetId
  colSpan: number
  rowSpan: number
  clockStyle?: ClockStyle
}) {
  const shape = shapeForWidget(widgetId, colSpan, rowSpan)
  const realWidth = colSpan * PREVIEW_CELL_SIZE_PX + (colSpan - 1) * PREVIEW_GRID_GAP_PX
  const realHeight = rowSpan * PREVIEW_CELL_SIZE_PX + (rowSpan - 1) * PREVIEW_GRID_GAP_PX

  return (
    <div
      className="widget-preview"
      style={{ width: realWidth * PREVIEW_SCALE, height: realHeight * PREVIEW_SCALE }}
    >
      <div
        className="widget-preview-real-scale"
        style={{ width: realWidth, height: realHeight, transform: `scale(${PREVIEW_SCALE})` }}
      >
        <Squircle shape={shape}>{previewContent(widgetId, clockStyle)}</Squircle>
      </div>
    </div>
  )
}
