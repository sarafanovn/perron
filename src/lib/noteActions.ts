import { placeWidgetAt } from './gridLayout'
import { widgetIdForNote } from './noteWidgets'
import type { Note, Settings } from './types'

/**
 * Creates an empty note (text filled in afterward, inline on the grid) at a
 * specific cell — used when a "Note" picker card is dropped onto the grid,
 * macOS-desktop-icon style: the tile appears where dropped, then the user
 * types into it in place. No-op if the target cell is already occupied.
 */
export function addNoteAt(settings: Settings, col: number, row: number): Settings {
  const newNote: Note = { id: crypto.randomUUID(), text: '' }
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForNote(newNote.id),
    col,
    row,
    1,
    1,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, notes: [...settings.notes, newNote], widgetLayout }
}

export function removeNote(settings: Settings, noteId: string): Settings {
  const widgetId = widgetIdForNote(noteId)
  return {
    ...settings,
    notes: settings.notes.filter((n) => n.id !== noteId),
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
