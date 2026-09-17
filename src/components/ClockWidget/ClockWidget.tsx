import { useEffect, useState } from 'react'
import type { Clock, ClockTimeFormat } from '../../lib/types'
import './ClockWidget.css'

const TICK_MS = 1000

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(id)
  }, [])
  return now
}

function DigitalFace({ now, timeFormat, showDate }: { now: Date; timeFormat: ClockTimeFormat; showDate: boolean }) {
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })
  const date = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="clock-widget-digital">
      <span className="clock-widget-time">{time}</span>
      {showDate && <span className="clock-widget-date">{date}</span>}
    </div>
  )
}

function AnalogFace({ now }: { now: Date }) {
  const hours = now.getHours() % 12
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  const hourAngle = hours * 30 + minutes * 0.5
  const minuteAngle = minutes * 6 + seconds * 0.1
  const secondAngle = seconds * 6

  return (
    <div className="clock-widget-analog">
      <svg viewBox="0 0 100 100" className="clock-widget-face" aria-hidden>
        <circle cx="50" cy="50" r="48" className="clock-widget-face-circle" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * 30
          return (
            <line
              key={i}
              x1="50"
              y1="6"
              x2="50"
              y2="12"
              className="clock-widget-tick"
              transform={`rotate(${angle} 50 50)`}
            />
          )
        })}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="26"
          className="clock-widget-hand clock-widget-hour-hand"
          transform={`rotate(${hourAngle} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="16"
          className="clock-widget-hand clock-widget-minute-hand"
          transform={`rotate(${minuteAngle} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="12"
          className="clock-widget-hand clock-widget-second-hand"
          transform={`rotate(${secondAngle} 50 50)`}
        />
        <circle cx="50" cy="50" r="3" className="clock-widget-hub" />
      </svg>
    </div>
  )
}

export function ClockWidget({
  clock,
  onToggleStyle,
  editMode = false,
}: {
  clock: Clock
  onToggleStyle: (id: string) => void
  editMode?: boolean
}) {
  const now = useNow()

  return (
    <div
      className={`clock-widget${editMode ? ' edit-mode' : ''}${clock.showBackground ? '' : ' transparent'}`}
      onClick={() => {
        if (editMode) onToggleStyle(clock.id)
      }}
    >
      {clock.style === 'digital' ? (
        <DigitalFace now={now} timeFormat={clock.timeFormat} showDate={clock.showDate} />
      ) : (
        <AnalogFace now={now} />
      )}
    </div>
  )
}
