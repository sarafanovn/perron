import { describe, it, expect } from 'vitest'
import { addNoteAt, removeNote } from './noteActions'
import { widgetIdForNote } from './noteWidgets'
import type { Settings } from './types'

const baseSettings: Settings = {
  version: 1,
  theme: {
    accentColor: '#0a84ff',
    background: { type: 'gradient', value: 'sunset' },
    font: 'system',
    mode: 'auto',
    style: 'glass',
  },
  search: { engine: 'google' },
  weather: { dynamicBackground: true },
  shortcuts: [],
  notes: [],
  translators: [],
  clocks: [],
  widgetLayout: [
    { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
    { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  ],
  grid: { columns: 4, rows: 8 },
}

describe('addNoteAt', () => {
  it('creates an empty note and places it at the given cell', () => {
    const result = addNoteAt(baseSettings, 2, 3)
    expect(result.notes).toHaveLength(1)
    expect(result.notes[0]).toMatchObject({ text: '' })
    const entry = result.widgetLayout.find((w) => w.widgetId === widgetIdForNote(result.notes[0].id))
    expect(entry).toMatchObject({ col: 2, row: 3, colSpan: 1, rowSpan: 1 })
  })

  it('does not add anything if the target cell is already occupied', () => {
    const result = addNoteAt(baseSettings, 0, 0)
    expect(result).toBe(baseSettings)
  })
})

describe('removeNote', () => {
  it('removes the note and its widgetLayout entry together', () => {
    const withNote = addNoteAt(baseSettings, 2, 3)
    const noteId = withNote.notes[0].id
    const result = removeNote(withNote, noteId)
    expect(result.notes).toHaveLength(0)
    expect(result.widgetLayout.find((w) => w.widgetId === widgetIdForNote(noteId))).toBeUndefined()
  })
})
