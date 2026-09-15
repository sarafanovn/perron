import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { ShortcutsWidget } from './ShortcutsWidget'

beforeEach(() => {
  localStorage.clear()
})

describe('ShortcutsWidget', () => {
  it('adds a new shortcut via the inline form', () => {
    render(
      <SettingsProvider>
        <ShortcutsWidget />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('removes a shortcut', () => {
    render(
      <SettingsProvider>
        <ShortcutsWidget />
      </SettingsProvider>
    )

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    fireEvent.click(screen.getByLabelText('Remove GitHub'))
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
  })
})
