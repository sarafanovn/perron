import { useState } from 'react'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { GlassLensProvider } from './context/GlassLensContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'
import { AppearancePanel } from './components/AppearancePanel/AppearancePanel'
import { WidgetPickerPanel } from './components/WidgetPickerPanel/WidgetPickerPanel'
import { EditPanelShell, type EditPanelTab } from './components/EditPanelShell/EditPanelShell'
import { EditFab } from './components/EditFab/EditFab'
import { AnimatedBackground } from './components/AnimatedBackground/AnimatedBackground'
import { GlassLensBackground } from './components/GlassLensBackground/GlassLensBackground'
import { parseAnimatedBackground } from './lib/backgroundPresets'
import './App.css'

function EditControls() {
  const { isEditMode, setIsEditMode } = useSettings()
  // The shell's open state IS edit mode now — there's no separate pill to
  // pick a destination first. Only the tab selection persists independently,
  // so re-entering edit mode comes back to whichever tab was last viewed.
  const [activeTab, setActiveTab] = useState<EditPanelTab>('appearance')

  function handleFabToggle() {
    setIsEditMode(!isEditMode)
  }

  return (
    <>
      <EditFab editMode={isEditMode} onToggle={handleFabToggle} />
      <EditPanelShell
        open={isEditMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setIsEditMode(false)}
      >
        {activeTab === 'appearance' && <AppearancePanel />}
        {activeTab === 'widgets' && <WidgetPickerPanel />}
      </EditPanelShell>
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
