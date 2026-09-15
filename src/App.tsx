import { useState } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <SettingsProvider>
      <div className="app-root" style={{ background: 'var(--page-background)', minHeight: '100vh' }}>
        <button
          aria-label="Open settings"
          onClick={() => setSettingsOpen(true)}
          style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}
        >
          ⚙
        </button>
        <WidgetGrid />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  )
}
