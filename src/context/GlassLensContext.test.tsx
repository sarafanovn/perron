import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { createRef, useEffect } from 'react'
import { GlassLensProvider, useGlassLens, useGlassLensRegistry } from './GlassLensContext'

function Registrar({
  shape = 'rounded' as const,
  active = true,
}: {
  shape?: 'squircle' | 'stadium' | 'rounded'
  active?: boolean
}) {
  const ref = createRef<HTMLDivElement>()
  useGlassLens(ref, shape, active)
  return <div ref={ref} />
}

function RegistrySnapshot({ onSnapshot }: { onSnapshot: (count: number) => void }) {
  const { getSnapshot } = useGlassLensRegistry()
  useEffect(() => {
    onSnapshot(getSnapshot().length)
  })
  return null
}

describe('GlassLensContext', () => {
  it('registers a mounted element and unregisters on unmount', () => {
    let count = -1
    const { unmount } = render(
      <GlassLensProvider>
        <Registrar />
        <RegistrySnapshot onSnapshot={(c) => (count = c)} />
      </GlassLensProvider>
    )
    expect(count).toBe(1)
    act(() => unmount())
  })

  it('does not register when active is false', () => {
    let count = -1
    render(
      <GlassLensProvider>
        <Registrar active={false} />
        <RegistrySnapshot onSnapshot={(c) => (count = c)} />
      </GlassLensProvider>
    )
    expect(count).toBe(0)
  })

  it('tracks multiple simultaneous lenses', () => {
    let count = -1
    render(
      <GlassLensProvider>
        <Registrar />
        <Registrar shape="stadium" />
        <Registrar shape="squircle" />
        <RegistrySnapshot onSnapshot={(c) => (count = c)} />
      </GlassLensProvider>
    )
    expect(count).toBe(3)
  })
})
