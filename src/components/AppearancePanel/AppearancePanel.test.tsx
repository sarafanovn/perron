import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { AppearancePanel } from './AppearancePanel'
import { loadSettings } from '../../lib/storage'

// The mock stands in for real compression (which needs canvas/worker APIs
// jsdom doesn't provide) by returning a small file instead of the original,
// so tests can assert the component used the compressed result without
// depending on the library's actual pixel-crunching.
vi.mock('browser-image-compression', () => ({
  default: vi.fn(async () => new File([new Uint8Array(100)], 'compressed.jpg', { type: 'image/jpeg' })),
}))
import imageCompression from 'browser-image-compression'

beforeEach(() => {
  localStorage.clear()
  vi.mocked(imageCompression).mockClear()
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

  it('compresses an oversized image instead of rejecting it, then persists it', async () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const bigFile = new File([new Uint8Array(5_000_000)], 'big.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload background image') as HTMLInputElement
    fireEvent.change(input, { target: { files: [bigFile] } })

    expect(imageCompression).toHaveBeenCalledWith(bigFile, expect.objectContaining({ maxSizeMB: expect.any(Number) }))
    await waitFor(() => expect(loadSettings().theme.background.type).toBe('image'))
    expect(screen.queryByText(/too large/i)).not.toBeInTheDocument()
  })

  it('does not compress a small image, and still persists it', async () => {
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const smallFile = new File([new Uint8Array(1000)], 'small.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload background image') as HTMLInputElement
    fireEvent.change(input, { target: { files: [smallFile] } })

    await waitFor(() => expect(loadSettings().theme.background.type).toBe('image'))
    expect(imageCompression).not.toHaveBeenCalled()
  })

  it('shows an error when compression fails, without persisting a broken image', async () => {
    vi.mocked(imageCompression).mockRejectedValueOnce(new Error('nope'))
    render(
      <SettingsProvider>
        <AppearancePanel open={true} onClose={() => {}} />
      </SettingsProvider>
    )
    const bigFile = new File([new Uint8Array(5_000_000)], 'big.png', { type: 'image/png' })
    const input = screen.getByLabelText('Upload background image') as HTMLInputElement
    fireEvent.change(input, { target: { files: [bigFile] } })

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(loadSettings().theme.background.type).not.toBe('image')
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
