import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { GridPanel } from './GridPanel'
import { loadSettings } from '../../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('GridPanel', () => {
  it('does not render when closed', () => {
    render(
      <SettingsProvider>
        <GridPanel open={false} onClose={() => {}} />
      </SettingsProvider>
    )
    expect(screen.queryByLabelText('Columns')).not.toBeInTheDocument()
  })

  it('updates grid columns and persists it', () => {
    render(
      <SettingsProvider>
        <GridPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '16' } })
    expect(loadSettings().grid.columns).toBe(16)
  })

  it('updates grid rows and persists it', () => {
    render(
      <SettingsProvider>
        <GridPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '10' } })
    expect(loadSettings().grid.rows).toBe(10)
  })

  it('calls onClose when the close button is clicked', () => {
    let closed = false
    render(
      <SettingsProvider>
        <GridPanel open={true} onClose={() => (closed = true)} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByLabelText('Close grid settings'))
    expect(closed).toBe(true)
  })
})
