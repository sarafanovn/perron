import type { WidgetId } from './types'
import { isShortcutWidgetId } from './shortcutWidgets'
import { isNoteWidgetId } from './noteWidgets'
import { isTranslatorWidgetId } from './translatorWidgets'
import { isClockWidgetId } from './clockWidgets'
import { isSearchWidgetId } from './searchWidgets'
import { isWeatherWidgetId } from './weatherWidgets'

export interface SizeSpan {
  colSpan: number
  rowSpan: number
}

const SHORTCUT_PRESETS: SizeSpan[] = [
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
]

// Mirrors iOS Weather's small/medium/large widget sizes: 2x2 shows only the
// current conditions, 4x2 adds an hourly forecast strip, 4x4 adds a 7-day
// forecast list underneath.
const WEATHER_PRESETS: SizeSpan[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 4, rowSpan: 2 },
  { colSpan: 4, rowSpan: 4 },
]

// Widths at a fixed one-row height — a search bar only ever needs more
// horizontal room (for a longer visible query), never more height.
const SEARCH_PRESETS: SizeSpan[] = [
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 4, rowSpan: 1 },
  { colSpan: 6, rowSpan: 1 },
  { colSpan: 8, rowSpan: 1 },
  { colSpan: 10, rowSpan: 1 },
]

// No 1x1: a ~60px cell leaves room for about one character of text once
// the textarea's padding is taken out.
const NOTE_PRESETS: SizeSpan[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 4, rowSpan: 2 },
  { colSpan: 4, rowSpan: 4 },
]

// Two language pickers, a swap button, the input and the result need about
// 3 cells each way; at 2 columns even the 3-letter language codes got cut
// down to "R…".
const TRANSLATOR_PRESETS: SizeSpan[] = [
  { colSpan: 3, rowSpan: 3 },
  { colSpan: 4, rowSpan: 4 },
]

// Both clock styles (digital, analog) share the same preset set: 2x2
// (square) and 4x2 (wide) — the digital face uses the extra width for a
// larger single-row time readout, the analog face just centers its circular
// dial in the wider box.
const CLOCK_PRESETS: SizeSpan[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 4, rowSpan: 2 },
]

/**
 * Ordered smallest to largest. A widget with exactly one preset has nothing
 * to resize to, so edit mode renders no resize handles for it.
 */
export function sizePresets(widgetId: WidgetId): SizeSpan[] {
  if (isSearchWidgetId(widgetId)) return SEARCH_PRESETS
  if (isWeatherWidgetId(widgetId)) return WEATHER_PRESETS
  if (isNoteWidgetId(widgetId)) return NOTE_PRESETS
  if (isTranslatorWidgetId(widgetId)) return TRANSLATOR_PRESETS
  if (isClockWidgetId(widgetId)) return CLOCK_PRESETS
  if (isShortcutWidgetId(widgetId)) return SHORTCUT_PRESETS
  return SHORTCUT_PRESETS
}

/**
 * Picks the preset closest to a trial size reached mid-drag, by simple
 * distance in cell units — used to snap a continuous resize gesture to a
 * discrete preset on release.
 */
export function closestPreset(widgetId: WidgetId, trialColSpan: number, trialRowSpan: number): SizeSpan {
  const presets = sizePresets(widgetId)
  let closest = presets[0]
  let closestDistance = Infinity
  for (const preset of presets) {
    const distance = Math.abs(preset.colSpan - trialColSpan) + Math.abs(preset.rowSpan - trialRowSpan)
    if (distance < closestDistance) {
      closestDistance = distance
      closest = preset
    }
  }
  return closest
}
