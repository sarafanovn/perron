import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { AppearancePanel } from './AppearancePanel'
import { loadSettings } from '../../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('AppearancePanel', () => {
  it('does not render when closed', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={false} onClose={() => {}} />
      </SettingsProvider>
    )
    expect(screen.queryByLabelText('Accent color')).not.toBeInTheDocument()
  })

  it('defaults to auto appearance mode', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to dark mode and persists it', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(loadSettings().theme.mode).toBe('dark')
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to light mode and persists it', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Light' }))
    expect(loadSettings().theme.mode).toBe('light')
  })

  it('sets data-theme on the document root for an explicit mode, and clears it for auto', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Auto' }))
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('updates accent color and persists it', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Accent color'), { target: { value: '#ff3b30' } })
    expect(loadSettings().theme.accentColor).toBe('#ff3b30')
  })

  it('selects a background preset and persists it', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByLabelText('Ocean'))
    const stored = loadSettings().theme.background
    expect(stored.type).toBe('gradient')
    expect(stored.value).toBe('ocean')
  })

  it('changes the search engine and persists it', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Search engine'), { target: { value: 'yandex' } })
    expect(loadSettings().search.engine).toBe('yandex')
  })

  it('warns and does not persist when an uploaded image is too large', () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const bigFile = new File([new Uint8Array(5_000_000)], 'big.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload background image') as HTMLInputElement
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(screen.getByText(/too large/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    let closed = false
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => (closed = true)} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByLabelText('Close appearance settings'))
    expect(closed).toBe(true)
  })
})
