import type { AnimatedBackgroundSettings } from './types'

export const BACKGROUND_PRESETS: Array<{ id: string; label: string; css: string }> = [
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 'midnight', label: 'Midnight', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'graphite', label: 'Graphite', css: '#1d1d1f' },
  { id: 'snow', label: 'Snow', css: '#f5f5f7' },
]

export const DEFAULT_ANIMATED_BACKGROUND: AnimatedBackgroundSettings = {
  baseColor: '#ffebeb',
  lowlightColor: '#2d00ff',
  midtoneColor: '#ff1f00',
  highlightColor: '#ffc300',
  speed: 30,
  zoom: 40,
  blurFactor: 60,
}

/**
 * Parses theme.background.value for an 'animated' background, which stores
 * JSON.stringify(AnimatedBackgroundSettings) rather than a CSS string.
 * Falls back to the default on missing/corrupted data (e.g. an older
 * version's settings, or a value edited outside the app) instead of
 * throwing, since a bad animated-background config shouldn't break the
 * whole page.
 */
export function parseAnimatedBackground(value: string): AnimatedBackgroundSettings {
  try {
    const parsed = JSON.parse(value)
    if (
      typeof parsed.baseColor !== 'string' ||
      typeof parsed.lowlightColor !== 'string' ||
      typeof parsed.midtoneColor !== 'string' ||
      typeof parsed.highlightColor !== 'string' ||
      typeof parsed.speed !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      typeof parsed.blurFactor !== 'number'
    ) {
      return DEFAULT_ANIMATED_BACKGROUND
    }
    return parsed as AnimatedBackgroundSettings
  } catch {
    return DEFAULT_ANIMATED_BACKGROUND
  }
}
