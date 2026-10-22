import { useEffect, useRef, useState } from 'react'
import { TRANSLATE_LANGUAGES, translateText, TranslateRequestError } from '../../lib/translateApi'
import type { Translator } from '../../lib/types'
import './TranslatorWidget.css'

const TRANSLATE_DEBOUNCE_MS = 500

export function TranslatorWidget({
  translator,
  onChange,
  editMode = false,
  colSpan = 2,
}: {
  translator: Translator
  onChange: (id: string, patch: Partial<Omit<Translator, 'id'>>) => void
  editMode?: boolean
  colSpan?: number
}) {
  // At the widget's smallest width, full language names ("English",
  // "Russian") overflow the select — show the 3-letter code instead. Wider
  // sizes have room for the full name, which reads better.
  const compact = colSpan < 3
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks whether a still-in-flight request belongs to the current
  // sourceText/langs, so a stale response that resolves after the user has
  // already changed the input again can't overwrite the newer state — the
  // debounce alone only prevents overlapping *requests* being started, not
  // an in-flight one finishing late relative to a newer one.
  const requestIdRef = useRef(0)
  // The saved translatedText already belongs to the saved sourceText, so
  // there's nothing to fetch on mount — re-translating it on every new tab
  // only burned through MyMemory's small anonymous daily quota.
  const isMountRef = useRef(true)

  useEffect(() => {
    const isMount = isMountRef.current
    isMountRef.current = false
    if (isMount && translator.translatedText) return
    if (!translator.sourceText.trim()) {
      requestIdRef.current += 1
      onChange(translator.id, { translatedText: '' })
      setStatus('idle')
      return
    }
    setStatus('loading')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const requestId = ++requestIdRef.current
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await translateText(translator.sourceText, translator.sourceLang, translator.targetLang)
        if (requestIdRef.current !== requestId) return
        onChange(translator.id, { translatedText: result })
        setStatus('idle')
      } catch (err) {
        if (requestIdRef.current !== requestId) return
        setErrorMessage(err instanceof TranslateRequestError ? err.message : "Couldn't translate.")
        setStatus('error')
      }
    }, TRANSLATE_DEBOUNCE_MS)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translator.sourceText, translator.sourceLang, translator.targetLang])

  function swapLanguages() {
    onChange(translator.id, {
      sourceLang: translator.targetLang,
      targetLang: translator.sourceLang,
      sourceText: translator.translatedText,
      translatedText: translator.sourceText,
    })
  }

  return (
    <div className="translator-widget">
      <div className="translator-langs">
        <select
          aria-label="Source language"
          value={translator.sourceLang}
          disabled={editMode}
          onChange={(e) => onChange(translator.id, { sourceLang: e.target.value })}
        >
          {TRANSLATE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {compact ? lang.short : lang.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="swap-btn"
          aria-label="Swap languages"
          disabled={editMode}
          onClick={swapLanguages}
        >
          ⇄
        </button>
        <select
          aria-label="Target language"
          value={translator.targetLang}
          disabled={editMode}
          onChange={(e) => onChange(translator.id, { targetLang: e.target.value })}
        >
          {TRANSLATE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {compact ? lang.short : lang.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        aria-label="Text to translate"
        placeholder="Enter text"
        value={translator.sourceText}
        readOnly={editMode}
        onChange={(e) => onChange(translator.id, { sourceText: e.target.value })}
      />
      <div
        className={`translator-result${status === 'loading' ? ' translator-result-loading' : ''}`}
        aria-label="Translation result"
        aria-busy={status === 'loading'}
      >
        {status === 'error' ? (errorMessage ?? "Couldn't translate.") : translator.translatedText}
        {status === 'loading' && <span className="translator-spinner" aria-hidden />}
      </div>
    </div>
  )
}
