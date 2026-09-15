import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
import { SettingsProvider, useSettings } from '../../context/SettingsContext'
import { WidgetGrid } from './WidgetGrid'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../lib/storage'
import { widgetIdForShortcut } from '../../lib/shortcutWidgets'

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

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
})

describe('WidgetGrid', () => {
  it('renders the built-in widgets and the add-shortcut tile', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByTestId('widget-weather')).toBeInTheDocument()
    expect(screen.getByTestId('widget-add-shortcut')).toBeInTheDocument()
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

  it('moves a widget to an empty cell under the drop point and persists it', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    // Default layout occupies row 0 (search, cols 0-3) and rows 1-2 (weather,
    // cols 0-1). Column 5, row 5 is empty in a 12x8 grid.
    const weatherHandle = screen.getByTestId('widget-weather')
    fireEvent.dragStart(weatherHandle)
    dropAt(grid, 5, 5)

    const persisted = loadSettings().widgetLayout
    const weather = persisted.find((w) => w.widgetId === 'weather')!
    expect(weather.col).toBe(5)
    expect(weather.row).toBe(5)
    expect(weather.colSpan).toBe(2)
    expect(weather.rowSpan).toBe(2)
  })

  it('rejects a drop that would overlap another widget, leaving the layout unchanged', () => {
    const { container } = render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const grid = container.querySelector('.widget-grid') as HTMLElement
    const before = loadSettings().widgetLayout
    const weatherHandle = screen.getByTestId('widget-weather')
    fireEvent.dragStart(weatherHandle)
    // search occupies row 0, cols 0-3; dropping weather there should overlap and be rejected
    dropAt(grid, 0, 0)

    expect(loadSettings().widgetLayout).toEqual(before)
  })

  it('adds a new shortcut widget via the add-shortcut tile and persists it', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    const persisted = loadSettings()
    expect(persisted.shortcuts).toHaveLength(1)
    const widgetId = widgetIdForShortcut(persisted.shortcuts[0].id)
    expect(persisted.widgetLayout.some((w) => w.widgetId === widgetId)).toBe(true)
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

  describe('edit mode', () => {
    it('hides the add-shortcut tile while editing', () => {
      render(
        <SettingsProvider>
          <EditModeToggle />
          <WidgetGrid />
        </SettingsProvider>
      )
      expect(screen.getByTestId('widget-add-shortcut')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.queryByTestId('widget-add-shortcut')).not.toBeInTheDocument()
      fireEvent.click(screen.getByText('Done'))
      expect(screen.getByTestId('widget-add-shortcut')).toBeInTheDocument()
    })

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
