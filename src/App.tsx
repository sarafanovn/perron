import { useState } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import './App.css'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <SettingsProvider>
      <div className="app-root">
        <WidgetGrid />
        <button
          className="settings-toggle"
          aria-label="Open settings"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  )
}
