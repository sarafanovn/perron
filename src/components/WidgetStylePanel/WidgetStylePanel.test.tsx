import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WidgetStylePanel } from './WidgetStylePanel'
import type { Clock, Shortcut } from '../../lib/types'

const anchor = { x: 100, y: 100 }

describe('WidgetStylePanel', () => {
  it('renders a dynamic-background checkbox for a weather target and calls back on toggle', () => {
    const onToggle = vi.fn()
    render(
      <WidgetStylePanel
        anchor={anchor}
        onClose={() => {}}
        target={{ kind: 'weather', dynamicBackground: true, onToggleDynamicBackground: onToggle }}
      />
    )
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
    fireEvent.click(checkbox)
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('renders digital/analog buttons for a clock target and calls back on selection', () => {
    const onUpdate = vi.fn()
    const clock: Clock = { id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }
    render(<WidgetStylePanel anchor={anchor} onClose={() => {}} target={{ kind: 'clock', clock, onUpdate }} />)
    fireEvent.click(screen.getByText('Analog'))
    expect(onUpdate).toHaveBeenCalledWith({ style: 'analog' })
  })

  it('renders time-format and show-date controls only for a digital clock', () => {
    const onUpdate = vi.fn()
    const digitalClock: Clock = { id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }
    const { rerender } = render(
      <WidgetStylePanel anchor={anchor} onClose={() => {}} target={{ kind: 'clock', clock: digitalClock, onUpdate }} />
    )
    expect(screen.getByText('12h')).toBeInTheDocument()
    expect(screen.getByText('Show date')).toBeInTheDocument()

    const analogClock: Clock = { ...digitalClock, style: 'analog' }
    rerender(
      <WidgetStylePanel anchor={anchor} onClose={() => {}} target={{ kind: 'clock', clock: analogClock, onUpdate }} />
    )
    expect(screen.queryByText('12h')).not.toBeInTheDocument()
    expect(screen.queryByText('Show date')).not.toBeInTheDocument()
  })

  it('calls onUpdate with the time format when 12h/24h is picked', () => {
    const onUpdate = vi.fn()
    const clock: Clock = { id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }
    render(<WidgetStylePanel anchor={anchor} onClose={() => {}} target={{ kind: 'clock', clock, onUpdate }} />)
    fireEvent.click(screen.getByText('12h'))
    expect(onUpdate).toHaveBeenCalledWith({ timeFormat: '12h' })
  })

  it('calls onUpdate when the show-background checkbox is toggled', () => {
    const onUpdate = vi.fn()
    const clock: Clock = { id: 'c1', style: 'digital', timeFormat: '24h', showDate: true, showBackground: true }
    render(<WidgetStylePanel anchor={anchor} onClose={() => {}} target={{ kind: 'clock', clock, onUpdate }} />)
    fireEvent.click(screen.getByText('Show background'))
    expect(onUpdate).toHaveBeenCalledWith({ showBackground: false })
  })

  it('renders a label/url form for a shortcut target and calls back with trimmed values on save', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const shortcut: Shortcut = { id: 's1', label: 'GitHub', url: 'https://github.com' }
    render(
      <WidgetStylePanel anchor={anchor} onClose={onClose} target={{ kind: 'shortcut', shortcut, onSave }} />
    )
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: '  New Label  ' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ label: 'New Label', url: 'https://github.com' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <WidgetStylePanel
        anchor={anchor}
        onClose={onClose}
        target={{ kind: 'weather', dynamicBackground: true, onToggleDynamicBackground: () => {} }}
      />
    )
    fireEvent.click(screen.getByLabelText('Close style editor'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
