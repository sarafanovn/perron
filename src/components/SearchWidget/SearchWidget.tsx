import { useEffect, useRef, useState, type FormEvent } from 'react'
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
 */
function EngineMenu({ engine, onChange }: { engine: SearchEngineId; onChange: (id: SearchEngineId) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
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
        onClick={() => setOpen((v) => !v)}
      >
        <img src={faviconUrlFor(SEARCH_ENGINES[engine].homepageUrl)} alt="" />
      </button>
      {open && (
        <ul className="search-engine-list" role="listbox" aria-label="Search engine">
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
        </ul>
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
