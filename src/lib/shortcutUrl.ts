/**
 * Turns what a user typed into a shortcut's URL field into an absolute URL.
 * People mostly type a bare host ("github.com"), which as an <a href> is a
 * *relative* link — it resolved against the start page itself (e.g.
 * moz-extension://…/github.com) and opened an error page instead of the
 * site. Anything without an explicit "scheme://" (or mailto:) gets https://.
 */
export function normalizeShortcutUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return url
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) || /^mailto:/i.test(url)) return url
  return `https://${url.replace(/^\/+/, '')}`
}
