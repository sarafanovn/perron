import { useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { AppearancePanel } from './components/AppearancePanel/AppearancePanel'
import { GridPanel } from './components/GridPanel/GridPanel'
import { WidgetPickerPanel } from './components/WidgetPickerPanel/WidgetPickerPanel'
import { EditFab, type EditFabAction } from './components/EditFab/EditFab'
import { AnimatedBackground } from './components/AnimatedBackground/AnimatedBackground'
import { GlassFilter } from './components/GlassFilter/GlassFilter'
import { parseAnimatedBackground } from './lib/backgroundPresets'
import './App.css'

function EditControls() {
  const { setIsEditMode } = useSettings()
  const [openPanel, setOpenPanel] = useState<EditFabAction | null>(null)

  function handleSelect(action: EditFabAction) {
    setIsEditMode(true)
    setOpenPanel(action)
  }

  function closePanel() {
    setOpenPanel(null)
  }

  return (
    <>
      <EditFab onSelect={handleSelect} onHover={() => setIsEditMode(true)} />
      <AppearancePanel open={openPanel === 'appearance'} onClose={closePanel} />
      <GridPanel open={openPanel === 'grid'} onClose={closePanel} />
      <WidgetPickerPanel open={openPanel === 'widgets'} onClose={closePanel} />
    </>
  )
}

function AppRootBackground() {
  const { settings } = useSettings()
  const { background } = settings.theme
  if (background.type !== 'animated') return null
  return <AnimatedBackground settings={parseAnimatedBackground(background.value)} />
}

export default function App() {
  return (
    <SettingsProvider>
      <div className="app-root">
        <GlassFilter />
        <AppRootBackground />
        <WidgetGrid />
        <EditControls />
      </div>
    </SettingsProvider>
  )
}
