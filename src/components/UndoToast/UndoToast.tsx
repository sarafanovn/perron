import './UndoToast.css'

/**
 * Bottom-center toast offering to reverse the last destructive action
 * (currently: widget removal). Purely presentational — the caller owns the
 * timeout and the snapshot to restore; this just renders the message/button
 * and forwards the click.
 */
export function UndoToast({ message, onUndo }: { message: string; onUndo: () => void }) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button type="button" className="undo-toast-btn" onClick={onUndo}>
        Undo
      </button>
    </div>
  )
}
