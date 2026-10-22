import { Component, type ReactNode } from 'react'
import { clearSettings } from '../../lib/storage'
import './ErrorBoundary.css'

/**
 * Last line of defense for a render error. Without it React unmounts the
 * whole tree and leaves a blank page — and since settings are reloaded on
 * every new tab, an error caused by saved data would blank every new tab
 * with no way back short of clearing site data by hand.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <h1>Something went wrong</h1>
        <p>Perron hit an error while drawing the page.</p>
        <pre>{error.message}</pre>
        <div className="error-boundary-actions">
          <button type="button" onClick={() => location.reload()}>
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              clearSettings()
              location.reload()
            }}
          >
            Reset all settings
          </button>
        </div>
      </div>
    )
  }
}
