import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { WidgetGrid } from './WidgetGrid'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../lib/storage'
import { widgetIdForShortcut } from '../../lib/shortcutWidgets'

beforeEach(() => {
  localStorage.clear()
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

  it('swaps two widgets on drag-and-drop and persists the new layout', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const searchHandle = screen.getByTestId('widget-search')
    const weatherHandle = screen.getByTestId('widget-weather')

    fireEvent.dragStart(searchHandle)
    fireEvent.dragOver(weatherHandle)
    fireEvent.drop(weatherHandle)

    const persisted = loadSettings().widgetLayout
    const search = persisted.find((w) => w.widgetId === 'search')!
    const weather = persisted.find((w) => w.widgetId === 'weather')!
    // search takes weather's old slot (and span) entirely, and vice versa
    expect(search.col).toBe(0)
    expect(search.row).toBe(1)
    expect(search.colSpan).toBe(2)
    expect(weather.col).toBe(0)
    expect(weather.row).toBe(0)
    expect(weather.colSpan).toBe(4)
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
        <WidgetGrid />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByLabelText('Remove GitHub'))

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    const persisted = loadSettings()
    expect(persisted.shortcuts).toHaveLength(0)
    expect(persisted.widgetLayout.some((w) => w.widgetId === widgetIdForShortcut('abc'))).toBe(false)
  })
})
