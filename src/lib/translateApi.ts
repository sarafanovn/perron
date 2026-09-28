export interface TranslateLanguage {
  code: string
  label: string
  // 3-letter abbreviation (not strict ISO 639-2 — just short and
  // recognizable) shown instead of the full label in the translator
  // widget's small size, where "English"/"Russian" would overflow.
  short: string
}

// MyMemory's free anonymous tier (no API key) covers this common set well;
// listing them explicitly (rather than a long ISO-639 table) keeps the
// language pickers short and relevant.
export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  { code: 'en', label: 'English', short: 'ENG' },
  { code: 'ru', label: 'Russian', short: 'RUS' },
  { code: 'es', label: 'Spanish', short: 'ESP' },
  { code: 'de', label: 'German', short: 'DEU' },
  { code: 'fr', label: 'French', short: 'FRA' },
  { code: 'it', label: 'Italian', short: 'ITA' },
  { code: 'pt', label: 'Portuguese', short: 'POR' },
  { code: 'zh', label: 'Chinese', short: 'ZHO' },
  { code: 'ja', label: 'Japanese', short: 'JPN' },
  { code: 'ko', label: 'Korean', short: 'KOR' },
  { code: 'tr', label: 'Turkish', short: 'TUR' },
  { code: 'ar', label: 'Arabic', short: 'ARA' },
  { code: 'fi', label: 'Finnish', short: 'FIN' },
]

// Actionable, cause-specific messages — MyMemory's free anonymous tier (see
// the module comment above) rate-limits fairly aggressively, so a 429 here
// is a routine occurrence, not an edge case, and deserves its own message.
export class TranslateRequestError extends Error {}

export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TranslateRequestError('The request timed out. Try again.')
    }
    throw new TranslateRequestError(
      navigator.onLine === false ? "You're offline. Reconnect and try again." : "Couldn't reach the translation service."
    )
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    if (res.status === 429) throw new TranslateRequestError('Too many translations right now. Try again in a minute.')
    throw new TranslateRequestError(`Translation failed (${res.status}).`)
  }
  const json = await res.json()
  const translated = json?.responseData?.translatedText
  if (typeof translated !== 'string') throw new TranslateRequestError("Couldn't translate that text.")
  return translated
}
