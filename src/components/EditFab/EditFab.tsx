import './EditFab.css'

export type EditFabAction = 'appearance' | 'grid' | 'widgets'

/**
 * Single pencil FAB, bottom-right, replacing the old separate Edit/Done
 * toggle and Settings (⚙) buttons. Hovering or focusing it reveals a
 * vertical pill with 3 icons (appearance, grid, add widget); picking any of
 * them opens its panel and switches the grid into edit mode.
 */
export function EditFab({
  onSelect,
  onHover,
}: {
  onSelect: (action: EditFabAction) => void
  // Fired on hover/focus of the whole FAB area, before any option is picked
  // — lets the grid switch into edit mode (jiggle, resize handles, remove
  // badges) as soon as the pill is visible, not only once a panel opens.
  onHover: () => void
}) {
  return (
    <div className="edit-fab" onMouseEnter={onHover} onFocus={onHover}>
      <div className="edit-fab-pill">
        <button className="edit-fab-option" aria-label="Appearance" onClick={() => onSelect('appearance')}>
          🎨
        </button>
        <button className="edit-fab-option" aria-label="Grid" onClick={() => onSelect('grid')}>
          ▦
        </button>
        <button className="edit-fab-option" aria-label="Add widget" onClick={() => onSelect('widgets')}>
          ➕
        </button>
      </div>
      <button className="edit-fab-main" aria-label="Edit">
        ✎
      </button>
    </div>
  )
}
