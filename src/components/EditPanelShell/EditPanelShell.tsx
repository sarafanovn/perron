import { useRef, type ReactNode } from 'react'
import { useGlassLens } from '../../context/GlassLensContext'
import { usePresence } from '../../lib/usePresence'
import { Icon, type IconName } from '../Icon/Icon'
import './EditPanelShell.css'

export type EditPanelTab = 'appearance' | 'widgets'

interface TabDef {
  id: EditPanelTab
  label: string
  icon: IconName
}

const TABS: TabDef[] = [
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'widgets', label: 'Widgets', icon: 'plus' },
]

/**
 * One floating surface, one position, one entrance/exit animation, shared by
 * the top-level edit destinations (Appearance / Widgets) that previously
 * each rendered as an independently positioned, independently sized,
 * independently animated panel. Content stays owned by the caller
 * (children) — this shell only owns the shape, the tab bar, and presence.
 */
export function EditPanelShell({
  open,
  activeTab,
  onTabChange,
  onClose,
  children,
}: {
  open: boolean
  activeTab: EditPanelTab
  onTabChange: (tab: EditPanelTab) => void
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { shouldRender, closing, onAnimationEnd } = usePresence(open)
  useGlassLens(panelRef, 'rounded', shouldRender)

  if (!shouldRender) return null

  return (
    <div
      className={`edit-panel-shell${closing ? ' edit-panel-shell-closing' : ''}`}
      ref={panelRef}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="edit-panel-tabs" role="tablist" aria-label="Edit menu">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`edit-panel-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`edit-panel-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon name={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
        <button className="close-btn" data-tooltip="Close" aria-label="Close edit menu" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="edit-panel-content" role="tabpanel" aria-labelledby={`edit-panel-tab-${activeTab}`}>
        {children}
      </div>
    </div>
  )
}
