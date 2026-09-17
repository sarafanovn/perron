/**
 * Derives a shortcut's default label from its URL's hostname, stripping a
 * leading "www." (e.g. "https://www.github.com/foo" -> "github.com").
 * Returns an empty string for an unparseable URL, so callers can fall back
 * to leaving the label untouched.
 */
export function labelFromUrl(url: string): string {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    try {
      host = new URL(`https://${url}`).hostname
    } catch {
      return ''
    }
  }
  return host.replace(/^www\./, '')
}
