import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
import { SettingsProvider, useSettings } from '../../context/SettingsContext'
import { WidgetGrid } from './WidgetGrid'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../lib/storage'
import { widgetIdForShortcut } from '../../lib/shortcutWidgets'
import { widgetIdForNote } from '../../lib/noteWidgets'
import { widgetIdForTranslator } from '../../lib/translatorWidgets'
import { widgetIdForClock } from '../../lib/clockWidgets'
import type { ClockStyle } from '../../lib/types'
import { NEW_WIDGET_DRAG_TYPE } from '../WidgetPickerPanel/WidgetPickerPanel'

// WidgetGrid doesn't own the Edit/Done toggle itself (that lives in App,
// next to Settings) — this stand-in gives tests a way to flip isEditMode
// without pulling in all of App.
function EditModeToggle() {
  const { isEditMode, setIsEditMode } = useSettings()
  return <button onClick={() => setIsEditMode(!isEditMode)}>{isEditMode ? 'Done' : 'Edit'}</button>
}

// With the default 12x8 grid and a mocked 1200x1000 viewport:
// availableWidth = 1200 - 80 - 20*11 = 900, 900/12 = 75
// availableHeight = 1000 - 80 - 20*7 = 780, 780/8 = 97.5
// cellSize = min(75, 97.5) = 75
const CELL_SIZE = 75
const GAP = 20
const PADDING = 40

// jsdom/RTL's fireEvent.drop doesn't apply clientX/clientY from its init
// object onto the resulting DragEvent, so they must be set directly via
// defineProperty on a manually created event.
function dropAt(target: Element, col: number, row: number) {
  const event = createEvent.drop(target)
  Object.defineProperty(event, 'clientX', { value: PADDING + col * (CELL_SIZE + GAP) + 10 })
  Object.defineProperty(event, 'clientY', { value: PADDING + row * (CELL_SIZE + GAP) + 10 })
  fireEvent(target, event)
}

// Same clientX/clientY workaround as dropAt, for dragStart — WidgetGrid
// reads the grab point at drag-start to compute the offset within the
// dragged widget (see WidgetGrid.tsx's grabOffsetRef), so tests that drag
// from a specific point within the widget need this instead of the
// coordinate-less fireEvent.dragStart.
function dragStartAt(target: Element, col: number, row: number) {
  const event = createEvent.dragStart(target)
  Object.defineProperty(event, 'clientX', { value: PADDING + col * (CELL_SIZE + GAP) + 10 })
  Object.defineProperty(event, 'clientY', { value: PADDING + row * (CELL_SIZE + GAP) + 10 })
  fireEvent(target, event)
}

// Simulates dragging a card in from WidgetPickerPanel: a native drag whose
// dataTransfer carries the NEW_WIDGET_DRAG_TYPE payload, rather than
// WidgetGrid's own draggingId state (which only covers repositioning a
// widget already on the grid).
function dropNewWidgetAt(
  target: Element,
  col: number,
  row: number,
  payload: {
    widgetId: 'search' | 'weather' | 'shortcut' | 'note' | 'translator' | 'clock'
    colSpan: number
    rowSpan: number
    clockStyle?: ClockStyle
  }
) {
  const event = createEvent.drop(target)
  Object.defineProperty(event, 'clientX', { value: PADDING + col * (CELL_SIZE + GAP) + 10 })
  Object.defineProperty(event, 'clientY', { value: PADDING + row * (CELL_SIZE + GAP) + 10 })
  Object.defineProperty(event, 'dataTransfer', {
    value: { getData: (type: string) => (type === NEW_WIDGET_DRAG_TYPE ? JSON.stringify(payload) : '') },
  })
  fireEvent(target, event)
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
})

describe('WidgetGrid', () => {
  it('renders the built-in widgets', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByTestId('widget-weather')).toBeInTheDocument()
  })

  it('renders one widget per shortcut, independently draggable', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      shortcuts: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
      widgetLayout: [
        ...DEFAULT_SETTINGS.widgetLayout,
        { widgetId: widgetIdForShortcut('abc'), col: 2, row: 1, colSpan: 1, rowSpan: 1 },
      ],
    })

    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    expect(screen.getByTestId(`widget-${widgetIdForShortcut('abc')}`)).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('moves a widget to an empty cell under the drop point in edit mode and persists it', () => {
    const { container } = render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    const grid = container.querySelector('.widget-grid') as HTMLElement
    // Default layout occupies row 0 (search, cols 0-3) and rows 1-2 (weather,
    // cols 0-1). Column 5, row 5 is empty in a 12x8 grid.
    const weatherHandle = screen.getByTestId('widget-weather')
    // Weather starts at col 0, row 1 — grabbing it at that same cell (its
    // top-left) means the offset is zero, so this drop still lands the
    // top-left exactly at (5, 5) as before.
    dragStartAt(weatherHandle, 0, 1)
    dropAt(grid, 5, 5)

    const persisted = loadSettings().widgetLayout
    const weather = persisted.find((w) => w.widgetId === 'weather')!
    expect(weather.col).toBe(5)
    expect(weather.row).toBe(5)
    expect(weather.colSpan).toBe(2)
    expect(weather.rowSpan).toBe(2)
  })

  it('moves a note widget by dragging from within its textarea (which is pointer-events:none in edit mode)', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      notes: [{ id: 'n1', text: 'Buy milk' }],
      widgetLayout: [
        ...DEFAULT_SETTINGS.widgetLayout,
        { widgetId: widgetIdForNote('n1'), col: 3, row: 0, colSpan: 1, rowSpan: 1 },
      ],
    })
    const { container } = render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByText('Edit'))
    const grid = container.querySelector('.widget-grid') as HTMLElement
    const noteHandle = screen.getByTestId(`widget-${widgetIdForNote('n1')}`)
    dragStartAt(noteHandle, 3, 0)
    dropAt(grid, 6, 6)

    const note = loadSettings().widgetLayout.find((w) => w.widgetId === widgetIdForNote('n1'))!
    expect(note.col).toBe(6)
    expect(note.row).toBe(6)
  })

  it('preserves the grab point within the widget instead of snapping its top-left to the cursor', () => {
    const { container } = render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    const grid = container.querySelector('.widget-grid') as HTMLElement
    // Weather is a 2x2 widget at (0, 1)-(1, 2); grab its bottom-right cell
    // (1, 2) and drop that same cell at (6, 6) — the top-left should land at
    // (5, 5), not (6, 6), preserving the offset from where it was grabbed.
    const weatherHandle = screen.getByTestId('widget-weather')
    dragStartAt(weatherHandle, 1, 2)
    dropAt(grid, 6, 6)

    const persisted = loadSettings().widgetLayout
    const weather = persisted.find((w) => w.widgetId === 'weather')!
    expect(weather.col).toBe(5)
    expect(weather.row).toBe(5)
  })

  it('rejects a drop that would overlap another widget, leaving the layout unchanged', () => {
    const { container } = render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    const grid = container.querySelector('.widget-grid') as HTMLElement
    const before = loadSettings().widgetLayout
    const weatherHandle = screen.getByTestId('widget-weather')
    dragStartAt(weatherHandle, 0, 1)
    // search occupies row 0, cols 0-3; dropping weather there should overlap and be rejected
    dropAt(grid, 0, 0)

    expect(loadSettings().widgetLayout).toEqual(before)
  })

  it('is not draggable outside edit mode', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )
    const weatherHandle = screen.getByTestId('widget-weather')
    expect(weatherHandle.getAttribute('draggable')).toBe('false')
  })

  it('is draggable once edit mode is on', () => {
    render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByText('Edit'))
    const weatherHandle = screen.getByTestId('widget-weather')
    expect(weatherHandle.getAttribute('draggable')).toBe('true')
  })

  it('drops a new shortcut card from the picker, showing an inline form at the drop cell', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'shortcut', colSpan: 1, rowSpan: 1 })

    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    const persisted = loadSettings()
    expect(persisted.shortcuts).toHaveLength(1)
    const widgetId = widgetIdForShortcut(persisted.shortcuts[0].id)
    const layoutEntry = persisted.widgetLayout.find((w) => w.widgetId === widgetId)
    expect(layoutEntry).toMatchObject({ col: 5, row: 5 })
  })

  it('cancelling a freshly dropped shortcut removes it', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'shortcut', colSpan: 1, rowSpan: 1 })
    fireEvent.click(screen.getByLabelText('Cancel adding shortcut'))

    expect(loadSettings().shortcuts).toHaveLength(0)
  })

  it('drops a new weather card from the picker onto an empty cell', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      widgetLayout: DEFAULT_SETTINGS.widgetLayout.filter((w) => w.widgetId !== 'weather'),
    })

    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'weather', colSpan: 2, rowSpan: 2 })

    const persisted = loadSettings().widgetLayout.find((w) => w.widgetId === 'weather')
    expect(persisted).toMatchObject({ col: 5, row: 5, colSpan: 2, rowSpan: 2 })
  })

  it('drops a new note card from the picker, showing an inline textarea at the drop cell', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'note', colSpan: 1, rowSpan: 1 })

    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Buy milk' } })

    const persisted = loadSettings()
    expect(persisted.notes).toHaveLength(1)
    expect(persisted.notes[0].text).toBe('Buy milk')
    const widgetId = widgetIdForNote(persisted.notes[0].id)
    const layoutEntry = persisted.widgetLayout.find((w) => w.widgetId === widgetId)
    expect(layoutEntry).toMatchObject({ col: 5, row: 5 })
  })

  it('drops a new translator card from the picker, ready to use immediately', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'translator', colSpan: 2, rowSpan: 2 })

    const persisted = loadSettings()
    expect(persisted.translators).toHaveLength(1)
    expect(persisted.translators[0]).toMatchObject({ sourceLang: 'ru', targetLang: 'en' })
    const widgetId = widgetIdForTranslator(persisted.translators[0].id)
    const layoutEntry = persisted.widgetLayout.find((w) => w.widgetId === widgetId)
    expect(layoutEntry).toMatchObject({ col: 5, row: 5, colSpan: 2, rowSpan: 2 })
  })

  it('drops a new digital clock card from the picker in the chosen style', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'clock', colSpan: 2, rowSpan: 2, clockStyle: 'digital' })

    const persisted = loadSettings()
    expect(persisted.clocks).toHaveLength(1)
    expect(persisted.clocks[0]).toMatchObject({ style: 'digital' })
    const widgetId = widgetIdForClock(persisted.clocks[0].id)
    const layoutEntry = persisted.widgetLayout.find((w) => w.widgetId === widgetId)
    expect(layoutEntry).toMatchObject({ col: 5, row: 5, colSpan: 2, rowSpan: 2 })
  })

  it('drops a new analog clock card from the picker in the chosen style', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    dropNewWidgetAt(grid, 5, 5, { widgetId: 'clock', colSpan: 2, rowSpan: 2, clockStyle: 'analog' })

    const persisted = loadSettings()
    expect(persisted.clocks[0]).toMatchObject({ style: 'analog' })
  })

  it('toggles a clock style when clicked in edit mode', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      clocks: [{ id: 'abc', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }],
      widgetLayout: [
        ...DEFAULT_SETTINGS.widgetLayout,
        { widgetId: widgetIdForClock('abc'), col: 5, row: 5, colSpan: 2, rowSpan: 2 },
      ],
    })

    render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByTestId(`widget-${widgetIdForClock('abc')}`).querySelector('.clock-widget')!)

    expect(loadSettings().clocks[0]).toMatchObject({ style: 'analog' })
  })

  it('removes a shortcut widget and its layout entry together', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      shortcuts: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
      widgetLayout: [
        ...DEFAULT_SETTINGS.widgetLayout,
        { widgetId: widgetIdForShortcut('abc'), col: 2, row: 1, colSpan: 1, rowSpan: 1 },
      ],
    })

    render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByLabelText('Remove GitHub'))

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    const persisted = loadSettings()
    expect(persisted.shortcuts).toHaveLength(0)
    expect(persisted.widgetLayout.some((w) => w.widgetId === widgetIdForShortcut('abc'))).toBe(false)
  })

  it('removes a singleton widget (weather) from the grid via its remove badge', () => {
    render(
      <SettingsProvider>
        <EditModeToggle />
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByLabelText('Remove weather'))

    expect(screen.queryByTestId('widget-weather')).not.toBeInTheDocument()
    expect(loadSettings().widgetLayout.some((w) => w.widgetId === 'weather')).toBe(false)
  })

  describe('edit mode', () => {
    it('applies the edit-mode jiggle class to widget cells only while editing', () => {
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      const weatherCell = screen.getByTestId('widget-weather')
      expect(weatherCell.className).not.toContain('edit-mode')
      fireEvent.click(screen.getByText('Edit'))
      expect(weatherCell.className).toContain('edit-mode')
    })

    it('applies the jiggle rotation only to the inner shape wrapper, not the badges or the cell itself', () => {
      const { container } = render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      const weatherCell = screen.getByTestId('widget-weather')
      // The cell itself never rotates — only its .widget-cell-shake child does.
      expect(weatherCell.className).not.toMatch(/\bjiggle-[ab]\b/)
      const shakeWrapper = weatherCell.querySelector('.widget-cell-shake')!
      expect(shakeWrapper.className).toMatch(/\bjiggle-[ab]\b/)
      // Badges are siblings of the shake wrapper, not descendants of it, so
      // they don't inherit its rotation.
      const removeBadge = weatherCell.querySelector('.widget-badge-remove')!
      expect(shakeWrapper.contains(removeBadge)).toBe(false)
      expect(container.querySelector('.widget-cell-shake .widget-badge')).toBeNull()
    })

    it('shows a style-editor badge for weather, clock, and shortcut but not search, note, or translator', () => {
      saveSettings({
        ...DEFAULT_SETTINGS,
        shortcuts: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
        notes: [{ id: 'n1', text: 'hi' }],
        translators: [
          { id: 't1', sourceLang: 'en', targetLang: 'fr', sourceText: '', translatedText: '' },
        ],
        clocks: [{ id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }],
        widgetLayout: [
          ...DEFAULT_SETTINGS.widgetLayout,
          { widgetId: widgetIdForShortcut('abc'), col: 2, row: 0, colSpan: 1, rowSpan: 1 },
          { widgetId: widgetIdForNote('n1'), col: 3, row: 0, colSpan: 1, rowSpan: 1 },
          { widgetId: widgetIdForTranslator('t1'), col: 4, row: 0, colSpan: 2, rowSpan: 2 },
          { widgetId: widgetIdForClock('c1'), col: 6, row: 0, colSpan: 2, rowSpan: 2 },
        ],
      })
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))

      expect(screen.getByTestId('widget-weather').querySelector('.widget-badge-style')).not.toBeNull()
      expect(
        screen.getByTestId(`widget-${widgetIdForClock('c1')}`).querySelector('.widget-badge-style')
      ).not.toBeNull()
      expect(
        screen.getByTestId(`widget-${widgetIdForShortcut('abc')}`).querySelector('.widget-badge-style')
      ).not.toBeNull()

      const searchCell = screen.getByRole('search').closest('[data-testid="widget-search"]')!
      expect(searchCell.querySelector('.widget-badge-style')).toBeNull()
      expect(screen.getByTestId(`widget-${widgetIdForNote('n1')}`).querySelector('.widget-badge-style')).toBeNull()
      expect(
        screen.getByTestId(`widget-${widgetIdForTranslator('t1')}`).querySelector('.widget-badge-style')
      ).toBeNull()
    })

    it('opens the style panel for weather and toggles its dynamic-background setting', () => {
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      fireEvent.click(screen.getByLabelText('Edit weather style'))

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
      fireEvent.click(checkbox)
      expect(loadSettings().weather.dynamicBackground).toBe(false)
    })

    it('opens the style panel for a clock and switches its face style', () => {
      saveSettings({
        ...DEFAULT_SETTINGS,
        clocks: [{ id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }],
        widgetLayout: [...DEFAULT_SETTINGS.widgetLayout, { widgetId: widgetIdForClock('c1'), col: 6, row: 0, colSpan: 2, rowSpan: 2 }],
      })
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      fireEvent.click(screen.getByLabelText('Edit clock style'))
      fireEvent.click(screen.getByText('Analog'))

      const clock = loadSettings().clocks.find((c) => c.id === 'c1')!
      expect(clock.style).toBe('analog')
    })

    it('opens the style panel for a shortcut and saves an edited label', () => {
      saveSettings({
        ...DEFAULT_SETTINGS,
        shortcuts: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
        widgetLayout: [
          ...DEFAULT_SETTINGS.widgetLayout,
          { widgetId: widgetIdForShortcut('abc'), col: 2, row: 0, colSpan: 1, rowSpan: 1 },
        ],
      })
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      fireEvent.click(screen.getByLabelText('Edit GitHub style'))
      fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub Renamed' } })
      fireEvent.click(screen.getByText('Save'))

      const shortcut = loadSettings().shortcuts.find((s) => s.id === 'abc')!
      expect(shortcut.label).toBe('GitHub Renamed')
    })

    it('shows resize handles only for widgets with more than one size preset', () => {
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      // weather has 2 presets (2x2, 4x2) -> resizable
      const weatherCell = screen.getByTestId('widget-weather')
      expect(weatherCell.querySelector('.resize-handle')).not.toBeNull()
      // search has a single preset (4x1) -> not resizable
      const searchCell = screen.getByRole('search').closest('[data-testid="widget-search"]')!
      expect(searchCell.querySelector('.resize-handle')).toBeNull()
    })

    it('exits edit mode when clicking the empty grid background', () => {
      const { container } = render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByText('Done')).toBeInTheDocument()
      const grid = container.querySelector('.widget-grid') as HTMLElement
      fireEvent.click(grid)
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('does not exit edit mode when clicking on a widget', () => {
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))
      fireEvent.click(screen.getByTestId('widget-weather'))
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('resizing a widget snaps to the closest preset and displaces overlapping widgets', () => {
      saveSettings({
        ...DEFAULT_SETTINGS,
        shortcuts: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
        widgetLayout: [
          ...DEFAULT_SETTINGS.widgetLayout,
          { widgetId: widgetIdForShortcut('abc'), col: 0, row: 3, colSpan: 1, rowSpan: 1 },
        ],
      })

      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      fireEvent.click(screen.getByText('Edit'))

      const weatherCell = screen.getByTestId('widget-weather')
      // weather's two presets (2x2, 4x2) only differ in colSpan, so only the
      // east handle renders. weather starts at col 0-1, row 1-2 (2x2). Drag
      // by ~2 cell-steps horizontally to trial a 4x2 size.
      const handle = weatherCell.querySelector('.resize-handle-e') as HTMLElement
      fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })
      fireEvent.mouseMove(window, { clientX: (CELL_SIZE + GAP) * 2, clientY: 0 })
      fireEvent.mouseUp(window)

      const persisted = loadSettings().widgetLayout
      const weather = persisted.find((w) => w.widgetId === 'weather')!
      expect(weather.colSpan).toBe(4)
      expect(weather.rowSpan).toBe(2)
      // shortcut at col 0, row 3 would now overlap weather's grown rectangle
      // (rows 1-2 stay, but col span 0-3 now covers it) — displaced elsewhere.
      const shortcut = persisted.find((w) => w.widgetId === widgetIdForShortcut('abc'))!
      const overlaps =
        shortcut.col < weather.col + weather.colSpan &&
        shortcut.col + shortcut.colSpan > weather.col &&
        shortcut.row < weather.row + weather.rowSpan &&
        shortcut.row + shortcut.rowSpan > weather.row
      expect(overlaps).toBe(false)
    })
  })
})
