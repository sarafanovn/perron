import { normalizeShortcutUrl } from './shortcutUrl'

export function faviconUrlFor(siteUrl: string): string {
  let host: string
  try {
    host = new URL(normalizeShortcutUrl(siteUrl)).hostname
  } catch {
    // Unparseable input must not throw here: this runs during render, and a
    // throw would take down the whole page on every load.
    host = siteUrl
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
}
