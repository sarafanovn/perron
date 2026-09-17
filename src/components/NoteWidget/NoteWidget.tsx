import type { Note } from '../../lib/types'
import './NoteWidget.css'

export function NoteWidget({
  note,
  onChange,
  editMode = false,
}: {
  note: Note
  onChange: (id: string, text: string) => void
  editMode?: boolean
}) {
  return (
    <div className={`note-widget${editMode ? ' edit-mode' : ''}`}>
      <textarea
        aria-label="Note text"
        placeholder="Type a note…"
        value={note.text}
        readOnly={editMode}
        onChange={(e) => onChange(note.id, e.target.value)}
      />
    </div>
  )
}
