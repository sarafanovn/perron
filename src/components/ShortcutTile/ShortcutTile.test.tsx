import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShortcutTile } from './ShortcutTile'
import type { Shortcut } from '../../lib/types'

function tileImage(container: HTMLElement): HTMLImageElement {
  return container.querySelector('img') as HTMLImageElement
}

const shortcut: Shortcut = { id: 'abc', label: 'GitHub', url: 'https://github.com' }

describe('ShortcutTile', () => {
  it('renders the label and links to the url', () => {
    render(<ShortcutTile shortcut={shortcut} onRemove={() => {}} />)
    const link = screen.getByText('GitHub').closest('a')
    expect(link).toHaveAttribute('href', 'https://github.com')
  })

  it('calls onRemove with the shortcut id when the remove control is clicked', () => {
    const onRemove = vi.fn()
    render(<ShortcutTile shortcut={shortcut} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText('Remove GitHub'))
    expect(onRemove).toHaveBeenCalledWith('abc')
  })

  it('uses a custom iconUrl when provided instead of the favicon service', () => {
    const withIcon: Shortcut = { ...shortcut, iconUrl: 'https://example.com/icon.png' }
    const { container } = render(<ShortcutTile shortcut={withIcon} onRemove={() => {}} />)
    expect(tileImage(container)).toHaveAttribute('src', 'https://example.com/icon.png')
  })
})
