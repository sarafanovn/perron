import { SettingsProvider } from './context/SettingsContext'
import { WidgetGrid } from './components/WidgetGrid/WidgetGrid'

export default function App() {
  return (
    <SettingsProvider>
      <div className="app-root" style={{ background: 'var(--page-background)', minHeight: '100vh' }}>
        <WidgetGrid />
      </div>
    </SettingsProvider>
  )
}
