import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { ClockWidget } from './ClockWidget'
import type { Clock } from '../../lib/types'

const digitalClock: Clock = {
  id: 'abc',
  style: 'digital',
  timeFormat: '24h',
  showDate: true,
  showBackground: true,
}
const analogClock: Clock = { ...digitalClock, style: 'analog' }

afterEach(() => {
  vi.useRealTimers()
})

describe('ClockWidget', () => {
  it('renders a digital face with the time and date', () => {
    render(<ClockWidget clock={digitalClock} onToggleStyle={() => {}} />)
    expect(document.querySelector('.clock-widget-time')).toBeInTheDocument()
    expect(document.querySelector('.clock-widget-date')).toBeInTheDocument()
  })

  it('renders an analog face with a clock hand for an analog clock', () => {
    render(<ClockWidget clock={analogClock} onToggleStyle={() => {}} />)
    expect(document.querySelector('.clock-widget-face')).toBeInTheDocument()
    expect(document.querySelector('.clock-widget-hour-hand')).toBeInTheDocument()
  })

  it('calls onToggleStyle when clicked in edit mode', () => {
    const onToggleStyle = vi.fn()
    const { container } = render(<ClockWidget clock={digitalClock} onToggleStyle={onToggleStyle} editMode />)
    fireEvent.click(container.querySelector('.clock-widget')!)
    expect(onToggleStyle).toHaveBeenCalledWith('abc')
  })

  it('does not call onToggleStyle when clicked outside edit mode', () => {
    const onToggleStyle = vi.fn()
    const { container } = render(<ClockWidget clock={digitalClock} onToggleStyle={onToggleStyle} />)
    fireEvent.click(container.querySelector('.clock-widget')!)
    expect(onToggleStyle).not.toHaveBeenCalled()
  })

  it('hides the date when showDate is false', () => {
    render(<ClockWidget clock={{ ...digitalClock, showDate: false }} onToggleStyle={() => {}} />)
    expect(document.querySelector('.clock-widget-date')).not.toBeInTheDocument()
  })

  it('formats the time in 12h with an AM/PM marker when timeFormat is 12h', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T14:00:00'))
    render(<ClockWidget clock={{ ...digitalClock, timeFormat: '12h' }} onToggleStyle={() => {}} />)
    expect(document.querySelector('.clock-widget-time')!.textContent).toMatch(/PM/i)
  })

  it('formats the time in 24h with no AM/PM marker when timeFormat is 24h', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T14:00:00'))
    render(<ClockWidget clock={{ ...digitalClock, timeFormat: '24h' }} onToggleStyle={() => {}} />)
    expect(document.querySelector('.clock-widget-time')!.textContent).not.toMatch(/[AP]M/i)
  })

  it('renders transparent when showBackground is false', () => {
    const { container } = render(
      <ClockWidget clock={{ ...digitalClock, showBackground: false }} onToggleStyle={() => {}} />
    )
    expect(container.querySelector('.clock-widget')).toHaveClass('transparent')
  })

  it('does not render transparent when showBackground is true', () => {
    const { container } = render(<ClockWidget clock={digitalClock} onToggleStyle={() => {}} />)
    expect(container.querySelector('.clock-widget')).not.toHaveClass('transparent')
  })

  it('updates the displayed time as the clock ticks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00'))
    render(<ClockWidget clock={digitalClock} onToggleStyle={() => {}} />)
    const before = document.querySelector('.clock-widget-time')!.textContent

    vi.setSystemTime(new Date('2026-01-01T10:01:00'))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const after = document.querySelector('.clock-widget-time')!.textContent
    expect(after).not.toBe(before)
  })
})
