import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSettings } from '../../context/SettingsContext'
import { SEARCH_ENGINES } from '../../lib/searchEngines'
import { faviconUrlFor } from '../../lib/favicon'
import type { SearchEngineId } from '../../lib/types'
import './SearchWidget.css'

const ENGINE_IDS = Object.keys(SEARCH_ENGINES) as SearchEngineId[]

/**
 * Logo-button + dropdown replacing the old text <select> — shows the
 * current engine's favicon instead of its name, and opens a small menu of
 * every engine's logo on click. Closes on outside click or Escape, same as
 * a native select's own dismiss behavior.
 *
 * The menu is portaled to <body> and positioned under the trigger: inside
 * the widget, the search bar's own pill clip (overflow: hidden) cut it off
 * to a sliver just below the bar.
 */
function EngineMenu({ engine, onChange }: { engine: SearchEngineId; onChange: (id: SearchEngineId) => void }) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="search-engine-menu" ref={rootRef}>
      <button
        type="button"
        className="search-engine-trigger"
        aria-label={`Search engine: ${SEARCH_ENGINES[engine].label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          const rect = rootRef.current?.getBoundingClientRect()
          if (rect) setMenuPosition({ left: rect.left, top: rect.bottom + 8 })
          setOpen((v) => !v)
        }}
      >
        <img src={faviconUrlFor(SEARCH_ENGINES[engine].homepageUrl)} alt="" />
      </button>
      {open &&
        menuPosition &&
        createPortal(
        <ul
          ref={listRef}
          className="search-engine-list"
          role="listbox"
          aria-label="Search engine"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          {ENGINE_IDS.map((id) => (
            <li key={id}>
              <button
                type="button"
                role="option"
                aria-selected={id === engine}
                className={id === engine ? 'active' : ''}
                onClick={() => {
                  onChange(id)
                  setOpen(false)
                }}
              >
                <img src={faviconUrlFor(SEARCH_ENGINES[id].homepageUrl)} alt="" />
                <span>{SEARCH_ENGINES[id].label}</span>
              </button>
            </li>
          ))}
        </ul>,
          document.body
        )}
    </div>
  )
}

export function SearchWidget() {
  const { settings, update } = useSettings()
  const [query, setQuery] = useState('')
  const engine = settings.search.engine

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    window.location.assign(SEARCH_ENGINES[engine].buildUrl(trimmed))
  }

  function handleEngineChange(next: SearchEngineId) {
    update((current) => ({ ...current, search: { engine: next } }))
  }

  return (
    <form role="search" className="search-widget" onSubmit={handleSubmit}>
      <EngineMenu engine={engine} onChange={handleEngineChange} />
      <input
        type="text"
        placeholder="Search the web"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  )
}
