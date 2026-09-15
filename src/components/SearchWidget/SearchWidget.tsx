import { useState, type FormEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { SEARCH_ENGINES } from '../../lib/searchEngines'
import type { SearchEngineId } from '../../lib/types'
import './SearchWidget.css'

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
      <select
        aria-label="Search engine"
        value={engine}
        onChange={(e) => handleEngineChange(e.target.value as SearchEngineId)}
      >
        {Object.entries(SEARCH_ENGINES).map(([id, def]) => (
          <option key={id} value={id}>
            {def.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search the web"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  )
}
