export const MAX_BACKGROUND_IMAGE_BYTES = 4_500_000

export const BACKGROUND_PRESETS: Array<{ id: string; label: string; css: string }> = [
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 'midnight', label: 'Midnight', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'graphite', label: 'Graphite', css: '#1d1d1f' },
  { id: 'snow', label: 'Snow', css: '#f5f5f7' },
]
