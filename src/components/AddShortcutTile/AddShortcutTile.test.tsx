import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddShortcutTile } from './AddShortcutTile'

describe('AddShortcutTile', () => {
  it('shows the label and URL fields', () => {
    render(<AddShortcutTile onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('Label')).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
  })

  it('auto-fills the label from the URL hostname as the user types it', () => {
    render(<AddShortcutTile onSave={() => {}} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://www.github.com/foo' } })
    expect(screen.getByLabelText('Label')).toHaveValue('github.com')
  })

  it('stops auto-filling the label once the user edits it directly', () => {
    render(<AddShortcutTile onSave={() => {}} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'My GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://example.com' } })
    expect(screen.getByLabelText('Label')).toHaveValue('My GitHub')
  })

  it('calls onSave with the entered values', () => {
    const onSave = vi.fn()
    render(<AddShortcutTile onSave={onSave} onCancel={() => {}} />)

    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).toHaveBeenCalledWith({ label: 'GitHub', url: 'https://github.com' })
  })

  it('calls onSave with the auto-filled label when the user never edited it', () => {
    const onSave = vi.fn()
    render(<AddShortcutTile onSave={onSave} onCancel={() => {}} />)

    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://github.com' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).toHaveBeenCalledWith({ label: 'github.com', url: 'https://github.com' })
  })

  it('does not call onSave when label or url is blank', () => {
    const onSave = vi.fn()
    render(<AddShortcutTile onSave={onSave} onCancel={() => {}} />)

    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'GitHub' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<AddShortcutTile onSave={() => {}} onCancel={onCancel} />)

    fireEvent.click(screen.getByLabelText('Cancel adding shortcut'))

    expect(onCancel).toHaveBeenCalled()
  })
})
