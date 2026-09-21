import { useRef } from 'react'
import { Icon } from '../Icon/Icon'
import { useGlassLens } from '../../context/GlassLensContext'
import './EditFab.css'

/**
 * Single pencil FAB, bottom-right. Clicking it is the only entry point into
 * edit mode, which opens EditPanelShell as a full-height drawer — the FAB
 * itself no longer picks a destination (that's the shell's own tab bar
 * now). The same button becomes a "Done" check while edit mode is active,
 * so leaving edit mode has an explicit affordance instead of relying only
 * on clicking the empty grid background.
 */
export function EditFab({ editMode, onToggle }: { editMode: boolean; onToggle: () => void }) {
  const mainRef = useRef<HTMLButtonElement>(null)
  useGlassLens(mainRef, 'squircle', true)

  return (
    <button
      className="edit-fab-main"
      data-tooltip={editMode ? 'Done' : 'Edit'}
      aria-label={editMode ? 'Done editing' : 'Edit'}
      ref={mainRef}
      onClick={onToggle}
    >
      <Icon name={editMode ? 'done' : 'edit'} />
    </button>
  )
}
