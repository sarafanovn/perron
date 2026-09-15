import type { WidgetId } from './types'
import { isShortcutWidgetId } from './shortcutWidgets'

export interface SizeSpan {
  colSpan: number
  rowSpan: number
}

const SHORTCUT_PRESETS: SizeSpan[] = [
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 },
]

const WEATHER_PRESETS: SizeSpan[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 4, rowSpan: 2 },
]

const SEARCH_PRESETS: SizeSpan[] = [{ colSpan: 4, rowSpan: 1 }]

/**
 * Ordered smallest to largest. A widget with exactly one preset (search)
 * has nothing to resize to, so edit mode renders no resize handles for it.
 */
export function sizePresets(widgetId: WidgetId): SizeSpan[] {
  if (widgetId === 'search') return SEARCH_PRESETS
  if (widgetId === 'weather') return WEATHER_PRESETS
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
