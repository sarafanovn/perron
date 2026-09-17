import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { WidgetPreview } from './WidgetPreview'

// jsdom has no layout engine, so the no-op global ResizeObserver stub (see
// setupTests.ts) never reports a size — this test needs one that actually
// fires, to see a real clip-path computed.
class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(_target: Element) {
    this.callback(
      [{ contentRect: { width: 120, height: 120 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    )
  }
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WidgetPreview', () => {
  it('renders a squircle shape for a 1x1 widget', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { container } = render(<WidgetPreview widgetId="shortcut" colSpan={1} rowSpan={1} />)
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.clipPath).toContain('path(')
  })

  it('renders a stadium shape for search regardless of size', () => {
    const { container } = render(<WidgetPreview widgetId="search" colSpan={4} rowSpan={1} />)
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.borderRadius).toBe('9999px')
  })

  it('renders a rounded shape for a widget larger than 1x1', () => {
    const { container } = render(<WidgetPreview widgetId="weather" colSpan={2} rowSpan={2} />)
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.borderRadius).toBe('var(--radius-widget)')
  })

  it('sizes the preview box in proportion to colSpan/rowSpan', () => {
    const { container } = render(<WidgetPreview widgetId="translator" colSpan={2} rowSpan={4} />)
    const preview = container.querySelector('.widget-preview') as HTMLElement
    const width = parseFloat(preview.style.width)
    const height = parseFloat(preview.style.height)
    // A 2x4 widget should be noticeably taller than wide — roughly double,
    // modulo the gap between cells not scaling linearly with span count.
    expect(height).toBeGreaterThan(width * 1.5)
  })

  it('scales down widgets uniformly so their relative real sizes are preserved', () => {
    const search = render(<WidgetPreview widgetId="search" colSpan={4} rowSpan={1} />)
    const shortcut = render(<WidgetPreview widgetId="shortcut" colSpan={1} rowSpan={1} />)
    const searchPreview = search.container.querySelector('.widget-preview') as HTMLElement
    const shortcutPreview = shortcut.container.querySelector('.widget-preview') as HTMLElement
    const searchWidth = parseFloat(searchPreview.style.width)
    const shortcutWidth = parseFloat(shortcutPreview.style.width)
    // search spans 4 cols + 3 gaps, shortcut spans 1 col — search should be
    // meaningfully wider, not squashed to the same card width.
    expect(searchWidth).toBeGreaterThan(shortcutWidth * 2)
  })

  it('renders sample content for each widget type without throwing', () => {
    const widgetIds: Array<'search' | 'weather' | 'shortcut' | 'note' | 'translator'> = [
      'search',
      'weather',
      'shortcut',
      'note',
      'translator',
    ]
    for (const widgetId of widgetIds) {
      const { container } = render(<WidgetPreview widgetId={widgetId} colSpan={2} rowSpan={2} />)
      expect(container.querySelector('.widget-preview')).toBeInTheDocument()
    }
  })
})
