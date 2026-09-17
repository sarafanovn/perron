import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { WidgetPickerPanel } from './WidgetPickerPanel'

describe('WidgetPickerPanel', () => {
  it('does not render when closed', () => {
    render(
      <SettingsProvider>
        <WidgetPickerPanel open={false} onClose={() => {}} />
      </SettingsProvider>
    )
    expect(screen.queryByText('Add widget')).not.toBeInTheDocument()
  })

  it('shows a preview inside each available widget card', () => {
    render(
      <SettingsProvider>
        <WidgetPickerPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const card = screen.getByLabelText('Add Shortcut')
    expect(card.querySelector('.widget-preview')).toBeInTheDocument()
  })

  it('hides Search and Weather cards once they are already on the grid', () => {
    render(
      <SettingsProvider>
        <WidgetPickerPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    // DEFAULT_SETTINGS already places search and weather.
    expect(screen.queryByLabelText('Add Search')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Add Weather')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Add Shortcut')).toBeInTheDocument()
    expect(screen.getByLabelText('Add Note')).toBeInTheDocument()
    expect(screen.getByLabelText('Add Translator')).toBeInTheDocument()
  })
})
