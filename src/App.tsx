import { useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import './App.css'

function EditModeToggle() {
  const { isEditMode, setIsEditMode } = useSettings()
  return (
    <button
      className="edit-mode-toggle"
      aria-label={isEditMode ? 'Done editing' : 'Edit widgets'}
      onClick={() => setIsEditMode(!isEditMode)}
    >
      {isEditMode ? 'Done' : 'Edit'}
    </button>
  )
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <SettingsProvider>
      <div className="app-root">
        <WidgetGrid />
        <EditModeToggle />
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
