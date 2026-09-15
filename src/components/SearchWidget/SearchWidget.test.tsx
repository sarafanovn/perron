import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsProvider } from '../../context/SettingsContext'
import { SearchWidget } from './SearchWidget'

beforeEach(() => {
  localStorage.clear()
})

describe('SearchWidget', () => {
  it('navigates to the search URL for the current engine on submit', () => {
    const assignSpy = vi.fn()
    // @ts-expect-error overriding for test
    delete window.location
    // @ts-expect-error test stub
    window.location = { assign: assignSpy }

    render(
      <SettingsProvider>
        <SearchWidget />
      </SettingsProvider>
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'apple design' } })
    fireEvent.submit(screen.getByRole('search'))

    expect(assignSpy).toHaveBeenCalledWith('https://www.google.com/search?q=apple%20design')
  })

  it('does not navigate on empty query submit', () => {
    const assignSpy = vi.fn()
    // @ts-expect-error overriding for test
    delete window.location
    // @ts-expect-error test stub
    window.location = { assign: assignSpy }

    render(
      <SettingsProvider>
        <SearchWidget />
      </SettingsProvider>
    )

    fireEvent.submit(screen.getByRole('search'))
    expect(assignSpy).not.toHaveBeenCalled()
  })
})
