import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranslatorWidget } from './TranslatorWidget'
import type { Translator } from '../../lib/types'

const translator: Translator = {
  id: 'abc',
  sourceLang: 'en',
  targetLang: 'fr',
  sourceText: '',
  translatedText: '',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TranslatorWidget', () => {
  it('renders language selects and the text input', () => {
    render(<TranslatorWidget translator={translator} onChange={() => {}} />)
    expect(screen.getByLabelText('Source language')).toHaveValue('en')
    expect(screen.getByLabelText('Target language')).toHaveValue('fr')
    expect(screen.getByLabelText('Text to translate')).toHaveValue('')
  })

  it('calls onChange with sourceText as the user types', () => {
    const onChange = vi.fn()
    render(<TranslatorWidget translator={translator} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Text to translate'), { target: { value: 'Hello' } })
    expect(onChange).toHaveBeenCalledWith('abc', { sourceText: 'Hello' })
  })

  it('translates the source text after the debounce delay and reports the result via onChange', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ responseData: { translatedText: 'Bonjour' } }),
      })
    )
    const onChange = vi.fn()
    render(<TranslatorWidget translator={{ ...translator, sourceText: 'Hello' }} onChange={onChange} />)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('abc', { translatedText: 'Bonjour' })
    })
  })

  it('swaps source/target languages and text when the swap button is clicked', () => {
    const onChange = vi.fn()
    render(
      <TranslatorWidget
        translator={{ ...translator, sourceText: 'Hello', translatedText: 'Bonjour' }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByLabelText('Swap languages'))
    expect(onChange).toHaveBeenCalledWith('abc', {
      sourceLang: 'fr',
      targetLang: 'en',
      sourceText: 'Bonjour',
      translatedText: 'Hello',
    })
  })

  it('shows abbreviated 3-letter language codes at the smallest width', () => {
    render(<TranslatorWidget translator={translator} onChange={() => {}} colSpan={2} />)
    expect(screen.getAllByText('ENG').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FRA').length).toBeGreaterThan(0)
    expect(screen.queryByText('English')).not.toBeInTheDocument()
  })

  it('shows full language names at wider widths', () => {
    render(<TranslatorWidget translator={translator} onChange={() => {}} colSpan={4} />)
    expect(screen.getAllByText('English').length).toBeGreaterThan(0)
    expect(screen.getAllByText('French').length).toBeGreaterThan(0)
    expect(screen.queryByText('ENG')).not.toBeInTheDocument()
  })
})
