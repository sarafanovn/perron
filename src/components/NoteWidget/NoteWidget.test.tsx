import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteWidget } from './NoteWidget'
import type { Note } from '../../lib/types'

const note: Note = { id: 'abc', text: 'Buy milk' }

describe('NoteWidget', () => {
  it('renders the note text in a textarea', () => {
    render(<NoteWidget note={note} onChange={() => {}} />)
    expect(screen.getByLabelText('Note text')).toHaveValue('Buy milk')
  })

  it('calls onChange with the note id and new text as the user types', () => {
    const onChange = vi.fn()
    render(<NoteWidget note={note} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Buy milk and eggs' } })
    expect(onChange).toHaveBeenCalledWith('abc', 'Buy milk and eggs')
  })

  it('makes the textarea read-only in edit mode', () => {
    render(<NoteWidget note={note} onChange={() => {}} editMode />)
    expect(screen.getByLabelText('Note text')).toHaveAttribute('readonly')
  })

  it('adds the edit-mode class so the textarea stops capturing mousedown, letting drag reach the parent', () => {
    const { container } = render(<NoteWidget note={note} onChange={() => {}} editMode />)
    expect(container.querySelector('.note-widget')).toHaveClass('edit-mode')
  })

  it('does not add the edit-mode class outside edit mode', () => {
    const { container } = render(<NoteWidget note={note} onChange={() => {}} />)
    expect(container.querySelector('.note-widget')).not.toHaveClass('edit-mode')
  })
})
