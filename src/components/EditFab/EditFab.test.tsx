import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditFab } from './EditFab'

describe('EditFab', () => {
  it('calls onHover when the mouse enters the FAB area', () => {
    const onHover = vi.fn()
    render(<EditFab onSelect={() => {}} onHover={onHover} />)
    fireEvent.mouseEnter(screen.getByLabelText('Edit').closest('.edit-fab')!)
    expect(onHover).toHaveBeenCalledOnce()
  })

  it('calls onHover when the FAB gains focus without a mouse', () => {
    const onHover = vi.fn()
    render(<EditFab onSelect={() => {}} onHover={onHover} />)
    fireEvent.focus(screen.getByLabelText('Appearance'))
    expect(onHover).toHaveBeenCalledOnce()
  })

  it('calls onSelect with the picked action', () => {
    const onSelect = vi.fn()
    render(<EditFab onSelect={onSelect} onHover={() => {}} />)
    fireEvent.click(screen.getByLabelText('Grid'))
    expect(onSelect).toHaveBeenCalledWith('grid')
  })
})
