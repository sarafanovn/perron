import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider, useSettings } from './SettingsContext'

function Consumer() {
  const { settings, update } = useSettings()
  return (
    <div>
      <span data-testid="engine">{settings.search.engine}</span>
      <button onClick={() => update((s) => ({ ...s, search: { engine: 'bing' } }))}>
        change
      </button>
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
})
