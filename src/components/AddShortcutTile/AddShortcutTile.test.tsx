import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddShortcutTile } from './AddShortcutTile'

describe('AddShortcutTile', () => {
  it('shows a + button initially', () => {
    render(<AddShortcutTile onAdd={() => {}} />)
    expect(screen.getByLabelText('Add shortcut')).toBeInTheDocument()
  })

  it('opens the inline form and calls onAdd with the entered values', () => {
    const onAdd = vi.fn()
    render(<AddShortcutTile onAdd={onAdd} />)

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onAdd).toHaveBeenCalledWith({ label: 'GitHub', url: 'https://github.com' })
  })

  it('does not call onAdd when label or url is blank', () => {
    const onAdd = vi.fn()
    render(<AddShortcutTile onAdd={onAdd} />)

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('closes the form and clears fields after a successful add', () => {
    render(<AddShortcutTile onAdd={() => {}} />)

    fireEvent.click(screen.getByLabelText('Add shortcut'))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByLabelText('Add shortcut')).toBeInTheDocument()
  })
})
