import { useRef, useState, type FormEvent } from 'react'
import { Icon } from '../Icon/Icon'
import { useGlassLens } from '../../context/GlassLensContext'
import { usePresence } from '../../lib/usePresence'
import type { Clock, Shortcut } from '../../lib/types'
import './WidgetStylePanel.css'

interface BaseProps {
  open: boolean
  anchor: { x: number; y: number }
  onClose: () => void
}

export type StyleTarget =
  | { kind: 'weather'; dynamicBackground: boolean; onToggleDynamicBackground: (value: boolean) => void }
  | { kind: 'clock'; clock: Clock; onUpdate: (patch: Partial<Omit<Clock, 'id'>>) => void }
  | { kind: 'shortcut'; shortcut: Shortcut; onSave: (details: { label: string; url: string }) => void }

/**
 * Small popover anchored near the widget's style-edit badge (not a fixed
 * corner panel like Appearance/Grid/Widgets) so it's unambiguous which
 * widget it's editing when several are on screen. Content is entirely
 * determined by `target.kind` — one shared shell (close button, frosted
 * surface) instead of a separate floating panel component per widget type.
 */
export function WidgetStylePanel({ open, anchor, onClose, target }: BaseProps & { target: StyleTarget }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { shouldRender, closing, onAnimationEnd } = usePresence(open)
  useGlassLens(panelRef, 'rounded', shouldRender)

  if (!shouldRender) return null

  return (
    <div
      className={`widget-style-panel${closing ? ' widget-style-panel-closing' : ''}`}
      style={{ left: anchor.x, top: anchor.y }}
      ref={panelRef}
      onAnimationEnd={onAnimationEnd}
    >
      <button className="close-btn" data-tooltip="Close" aria-label="Close style editor" onClick={onClose}>
        <Icon name="close" size={16} />
      </button>
      {target.kind === 'weather' && <WeatherStyleFields target={target} />}
      {target.kind === 'clock' && <ClockStyleFields target={target} />}
      {target.kind === 'shortcut' && <ShortcutStyleFields target={target} onClose={onClose} />}
    </div>
  )
}

function WeatherStyleFields({ target }: { target: Extract<StyleTarget, { kind: 'weather' }> }) {
  return (
    <div>
      <h4>Weather style</h4>
      <label className="widget-style-checkbox">
        <input
          type="checkbox"
          checked={target.dynamicBackground}
          onChange={(e) => target.onToggleDynamicBackground(e.target.checked)}
        />
        Dynamic weather background
      </label>
    </div>
  )
}

function ClockStyleFields({ target }: { target: Extract<StyleTarget, { kind: 'clock' }> }) {
  const { clock, onUpdate } = target
  return (
    <div className="widget-style-fields">
      <h4>Clock style</h4>
      <div className="segmented-control" role="group" aria-label="Clock face">
        <button
          type="button"
          className={clock.style === 'digital' ? 'active' : ''}
          onClick={() => onUpdate({ style: 'digital' })}
        >
          Digital
        </button>
        <button
          type="button"
          className={clock.style === 'analog' ? 'active' : ''}
          onClick={() => onUpdate({ style: 'analog' })}
        >
          Analog
        </button>
      </div>

      {clock.style === 'digital' && (
        <>
          <div className="segmented-control" role="group" aria-label="Time format">
            <button
              type="button"
              className={clock.timeFormat === '24h' ? 'active' : ''}
              onClick={() => onUpdate({ timeFormat: '24h' })}
            >
              24h
            </button>
            <button
              type="button"
              className={clock.timeFormat === '12h' ? 'active' : ''}
              onClick={() => onUpdate({ timeFormat: '12h' })}
            >
              12h
            </button>
          </div>
          <label className="widget-style-checkbox">
            <input
              type="checkbox"
              checked={clock.showDate}
              onChange={(e) => onUpdate({ showDate: e.target.checked })}
            />
            Show date
          </label>
        </>
      )}

      <label className="widget-style-checkbox">
        <input
          type="checkbox"
          checked={clock.showBackground}
          onChange={(e) => onUpdate({ showBackground: e.target.checked })}
        />
        Show background
      </label>
    </div>
  )
}

function ShortcutStyleFields({
  target,
  onClose,
}: {
  target: Extract<StyleTarget, { kind: 'shortcut' }>
  onClose: () => void
}) {
  const [label, setLabel] = useState(target.shortcut.label)
  const [url, setUrl] = useState(target.shortcut.url)

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    target.onSave({ label: label.trim(), url: url.trim() })
    onClose()
  }

  return (
    <form onSubmit={handleSave}>
      <h4>Shortcut</h4>
      <input aria-label="Label" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input aria-label="URL" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  )
}
