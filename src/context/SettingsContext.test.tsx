import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from './SettingsContext'

function Consumer() {
  const {
    settings,
    update,
    isAdjustingGrid,
    setIsAdjustingGrid,
    pingGridAdjustment,
    isEditMode,
    setIsEditMode,
  } = useSettings()
  return (
    <div>
      <span data-testid="engine">{settings.search.engine}</span>
      <span data-testid="adjusting">{String(isAdjustingGrid)}</span>
      <span data-testid="editing">{String(isEditMode)}</span>
      <button onClick={() => update((s) => ({ ...s, search: { engine: 'bing' } }))}>
        change
      </button>
      <button onClick={() => setIsAdjustingGrid(true)}>start adjusting</button>
      <button onClick={() => setIsAdjustingGrid(false)}>stop adjusting</button>
      <button onClick={() => pingGridAdjustment()}>ping</button>
      <button onClick={() => setIsEditMode(true)}>start editing</button>
      <button onClick={() => setIsEditMode(false)}>stop editing</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.style.cssText = ''
})

describe('SettingsProvider', () => {
  it('provides default settings to consumers', () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )
    expect(screen.getByTestId('engine').textContent).toBe('google')
  })

  it('updates settings and re-renders consumers', () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )
    fireEvent.click(screen.getByText('change'))
    expect(screen.getByTestId('engine').textContent).toBe('bing')
  })

  it('applies accent color as a CSS custom property on the root element', () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#0a84ff')
  })

  it('defaults isAdjustingGrid to false and lets consumers toggle it', () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )
    expect(screen.getByTestId('adjusting').textContent).toBe('false')
    fireEvent.click(screen.getByText('start adjusting'))
    expect(screen.getByTestId('adjusting').textContent).toBe('true')
    fireEvent.click(screen.getByText('stop adjusting'))
    expect(screen.getByTestId('adjusting').textContent).toBe('false')
  })

  it('defaults isEditMode to false and lets consumers toggle it', () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )
    expect(screen.getByTestId('editing').textContent).toBe('false')
    fireEvent.click(screen.getByText('start editing'))
    expect(screen.getByTestId('editing').textContent).toBe('true')
    fireEvent.click(screen.getByText('stop editing'))
    expect(screen.getByTestId('editing').textContent).toBe('false')
  })

  describe('pingGridAdjustment', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('turns isAdjustingGrid on immediately and off again after a delay', () => {
      render(
        <SettingsProvider>
          <Consumer />
        </SettingsProvider>
      )
      act(() => {
        fireEvent.click(screen.getByText('ping'))
      })
      expect(screen.getByTestId('adjusting').textContent).toBe('true')
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(screen.getByTestId('adjusting').textContent).toBe('false')
    })

    it('restarts the hide delay on repeated pings instead of stacking timeouts', () => {
      render(
        <SettingsProvider>
          <Consumer />
        </SettingsProvider>
      )
      act(() => {
        fireEvent.click(screen.getByText('ping'))
      })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      act(() => {
        fireEvent.click(screen.getByText('ping'))
      })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.getByTestId('adjusting').textContent).toBe('true')
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(screen.getByTestId('adjusting').textContent).toBe('false')
    })
  })
})
