import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { GlassLensProvider } from '../../context/GlassLensContext'
import { GlassLensBackground } from './GlassLensBackground'

afterEach(cleanup)

describe('GlassLensBackground', () => {
  it('renders a full-viewport canvas', () => {
    const { container } = render(
      <GlassLensProvider>
        <GlassLensBackground background={{ type: 'solid', value: '#ff0000' }} vantaCanvas={null} />
      </GlassLensProvider>
    )
    expect(container.querySelector('canvas.glass-lens-background')).not.toBeNull()
  })

  it('does not throw when the environment has no WebGL support (e.g. jsdom)', () => {
    expect(() =>
      render(
        <GlassLensProvider>
          <GlassLensBackground background={{ type: 'gradient', value: 'sunset' }} vantaCanvas={null} />
        </GlassLensProvider>
      )
    ).not.toThrow()
  })
})
