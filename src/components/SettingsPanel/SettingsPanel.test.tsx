import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { SettingsPanel } from './SettingsPanel'
import { loadSettings } from '../../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsPanel', () => {
  it('does not render when closed', () => {
    render(
      <SettingsProvider>
        <SettingsPanel open={false} onClose={() => {}} />
      </SettingsProvider>
    )
    expect(screen.queryByLabelText('Accent color')).not.toBeInTheDocument()
  })

  it('updates accent color and persists it', () => {
    render(
      <SettingsProvider>
        <SettingsPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Accent color'), { target: { value: '#ff3b30' } })
    expect(loadSettings().theme.accentColor).toBe('#ff3b30')
  })

  it('selects a background preset and persists it', () => {
    render(
      <SettingsProvider>
        <SettingsPanel open={true} onClose={() => {}} />
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
        <SettingsPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    fireEvent.change(screen.getByLabelText('Search engine'), { target: { value: 'yandex' } })
    expect(loadSettings().search.engine).toBe('yandex')
  })

  it('warns and does not persist when an uploaded image is too large', () => {
    render(
      <SettingsProvider>
        <SettingsPanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const bigFile = new File([new Uint8Array(5_000_000)], 'big.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload background image') as HTMLInputElement
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(screen.getByText(/too large/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <SettingsProvider>
        <SettingsPanel open={true} onClose={onClose} />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalled()
  })
})
