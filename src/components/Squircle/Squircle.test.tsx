import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { Squircle } from './Squircle'
import { GlassLensProvider, useGlassLensRegistry } from '../../context/GlassLensContext'

function LensCount({ onCount }: { onCount: (n: number) => void }) {
  const { getSnapshot } = useGlassLensRegistry()
  useEffect(() => {
    onCount(getSnapshot().length)
  })
  return null
}

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

describe('Squircle', () => {
  it('renders its children', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { getByText } = render(
      <Squircle>
        <span>content</span>
      </Squircle>
    )
    expect(getByText('content')).toBeInTheDocument()
  })

  it('applies a clip-path style once size is measured for the squircle shape', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { container } = render(
      <Squircle>
        <span>content</span>
      </Squircle>
    )
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.clipPath).toContain('path(')
  })

  it('applies a pill border-radius instead of clip-path for the stadium shape', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { container } = render(
      <Squircle shape="stadium">
        <span>content</span>
      </Squircle>
    )
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.borderRadius).toBe('9999px')
    expect(wrapper.style.overflow).toBe('hidden')
    expect(wrapper.style.clipPath).toBe('')
  })

  it('applies the widget-radius border-radius instead of clip-path for the rounded shape', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { container } = render(
      <Squircle shape="rounded">
        <span>content</span>
      </Squircle>
    )
    const wrapper = container.querySelector('.squircle-wrapper') as HTMLElement
    expect(wrapper.style.borderRadius).toBe('var(--radius-widget)')
    expect(wrapper.style.overflow).toBe('hidden')
    expect(wrapper.style.clipPath).toBe('')
  })

  it('registers itself as a glass lens while mounted', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    let count = -1
    const { unmount } = render(
      <GlassLensProvider>
        <Squircle shape="rounded">
          <div>content</div>
        </Squircle>
        <LensCount onCount={(n) => (count = n)} />
      </GlassLensProvider>
    )
    expect(count).toBe(1)
    unmount()
  })
})
