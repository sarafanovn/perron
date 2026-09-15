export function faviconUrlFor(siteUrl: string): string {
  let host: string
  try {
    host = new URL(siteUrl).hostname
  } catch {
    host = new URL(`https://${siteUrl}`).hostname
  }
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
}
