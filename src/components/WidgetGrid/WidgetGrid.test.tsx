import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { WidgetGrid } from './WidgetGrid'
import { loadSettings } from '../../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('WidgetGrid', () => {
  it('renders all three widgets', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByTestId('widget-weather')).toBeInTheDocument()
    expect(screen.getByTestId('widget-shortcuts')).toBeInTheDocument()
  })

  it('swaps two widgets on drag-and-drop and persists the new layout', () => {
    render(
      <SettingsProvider>
        <WidgetGrid />
      </SettingsProvider>
    )

    const weatherHandle = screen.getByTestId('widget-weather')
    const shortcutsHandle = screen.getByTestId('widget-shortcuts')

    fireEvent.dragStart(weatherHandle)
    fireEvent.dragOver(shortcutsHandle)
    fireEvent.drop(shortcutsHandle)

    const persisted = loadSettings().widgetLayout
    const weather = persisted.find((w) => w.widgetId === 'weather')!
    const shortcuts = persisted.find((w) => w.widgetId === 'shortcuts')!
    expect(weather.col).toBe(2)
    expect(shortcuts.col).toBe(0)
  })
})
