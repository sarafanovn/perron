import { SettingsProvider } from './context/SettingsContext'

export default function App() {
  return (
    <SettingsProvider>
      <div className="app-root">Perron</div>
    </SettingsProvider>
  )
}
