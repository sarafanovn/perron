import { useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { GlassLensProvider } from './context/GlassLensContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { AppearancePanel } from './components/AppearancePanel/AppearancePanel'
import { GridPanel } from './components/GridPanel/GridPanel'
import { WidgetPickerPanel } from './components/WidgetPickerPanel/WidgetPickerPanel'
import { EditFab, type EditFabAction } from './components/EditFab/EditFab'
import { AnimatedBackground } from './components/AnimatedBackground/AnimatedBackground'
import { GlassLensBackground } from './components/GlassLensBackground/GlassLensBackground'
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

function AppBackgroundLayers() {
  const { settings } = useSettings()
  const { background } = settings.theme
  const [vantaCanvas, setVantaCanvas] = useState<HTMLCanvasElement | null>(null)

  return (
    <>
      {background.type === 'animated' && (
        <AnimatedBackground settings={parseAnimatedBackground(background.value)} onCanvasReady={setVantaCanvas} />
      )}
      {settings.theme.style === 'glass' && <GlassLensBackground background={background} vantaCanvas={vantaCanvas} />}
    </>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <GlassLensProvider>
        <div className="app-root">
          <AppBackgroundLayers />
          <WidgetGrid />
          <EditControls />
        </div>
      </GlassLensProvider>
    </SettingsProvider>
  )
}
