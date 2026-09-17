import { useEffect, useRef, useState } from 'react'
import { TRANSLATE_LANGUAGES, translateText } from '../../lib/translateApi'
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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!translator.sourceText.trim()) {
      onChange(translator.id, { translatedText: '' })
      setStatus('idle')
      return
    }
    setStatus('loading')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await translateText(translator.sourceText, translator.sourceLang, translator.targetLang)
        onChange(translator.id, { translatedText: result })
        setStatus('idle')
      } catch {
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
      <div className="translator-result" aria-label="Translation result">
        {status === 'error' ? "Couldn't translate." : translator.translatedText}
      </div>
    </div>
  )
}
