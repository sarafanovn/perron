import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { AnimatedBackground } from './AnimatedBackground'
import type { AnimatedBackgroundSettings } from '../../lib/types'

const SETTINGS: AnimatedBackgroundSettings = {
  baseColor: '#ffebeb',
  lowlightColor: '#2d00ff',
  midtoneColor: '#ff1f00',
  highlightColor: '#ffc300',
  speed: 30,
  zoom: 40,
  blurFactor: 60,
}

afterEach(cleanup)

describe('AnimatedBackground', () => {
  it('renders a full-viewport host element for the Vanta effect', () => {
    const { container } = render(<AnimatedBackground settings={SETTINGS} />)
    expect(container.querySelector('.animated-background')).not.toBeNull()
  })

  it('does not throw when the environment has no WebGL support (e.g. jsdom)', () => {
    // jsdom's canvas.getContext('webgl') returns null, so Vanta/three.js's
    // own WebGLRenderer setup fails internally — this exercises that
    // fallback path rather than an actual render loop.
    expect(() => render(<AnimatedBackground settings={SETTINGS} />)).not.toThrow()
  })
})
