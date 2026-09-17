import { useSettings } from '../../context/SettingsContext'
import './GridPanel.css'

const MIN_COLUMNS = 4
const MAX_COLUMNS = 24
const MIN_ROWS = 3
const MAX_ROWS = 16

export function GridPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, saveError, setIsAdjustingGrid, pingGridAdjustment } = useSettings()

  if (!open) return null

  function setColumns(value: number) {
    update((current) => ({ ...current, grid: { ...current.grid, columns: value } }))
    pingGridAdjustment()
  }

  function setRows(value: number) {
    update((current) => ({ ...current, grid: { ...current.grid, rows: value } }))
    pingGridAdjustment()
  }

  return (
    <div className="grid-panel">
      <button className="close-btn" aria-label="Close grid settings" onClick={onClose}>
        ✕
      </button>

      <div>
        <h3>Grid density</h3>
        <label>
          Columns: {settings.grid.columns}
          <input
            aria-label="Columns"
            type="range"
            min={MIN_COLUMNS}
            max={MAX_COLUMNS}
            value={settings.grid.columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            onMouseDown={() => setIsAdjustingGrid(true)}
            onTouchStart={() => setIsAdjustingGrid(true)}
          />
        </label>
        <label>
          Rows: {settings.grid.rows}
          <input
            aria-label="Rows"
            type="range"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={settings.grid.rows}
            onChange={(e) => setRows(Number(e.target.value))}
            onMouseDown={() => setIsAdjustingGrid(true)}
            onTouchStart={() => setIsAdjustingGrid(true)}
          />
        </label>
      </div>

      {saveError && <p role="alert">Couldn't save: {saveError}</p>}
    </div>
  )
}
