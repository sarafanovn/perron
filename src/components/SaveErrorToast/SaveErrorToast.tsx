import { useSettings } from '../../context/SettingsContext'
import './SaveErrorToast.css'

/**
 * Surfaces settings.saveError app-wide, not just on the Appearance tab where
 * the error was previously only rendered — every mutation (drag, resize,
 * note edit, shortcut save, widget add/remove, ...) goes through the same
 * saveSettings() call and can fail the same way (storage quota exceeded,
 * private-browsing storage blocked), so the failure needs to be visible
 * regardless of which panel, or none, is open when it happens.
 */
export function SaveErrorToast() {
  const { saveError } = useSettings()
  if (!saveError) return null

  return (
    <div className="save-error-toast" role="alert">
      Couldn't save your changes. {saveError}
    </div>
  )
}
