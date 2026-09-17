import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { AnimatedBackground } from './AnimatedBackground'
import type { AnimatedBackgroundSettings } from '../../lib/types'

const SETTINGS: AnimatedBackgroundSettings = {
  colors: ['#ff6a88', '#7b6cf6'],
  grain: 35,
  speed: 30,
  detail: 40,
}

afterEach(cleanup)

describe('AnimatedBackground', () => {
  it('renders a full-viewport canvas', () => {
    const { container } = render(<AnimatedBackground settings={SETTINGS} />)
    const canvas = container.querySelector('canvas.animated-background')
    expect(canvas).not.toBeNull()
  })

  it('does not throw when the environment has no WebGL support (e.g. jsdom)', () => {
    // jsdom's canvas.getContext('webgl') returns null, so this exercises the
    // createGradientRenderer-returned-null / early-return path in the mount
    // effect rather than an actual render loop.
    expect(() => render(<AnimatedBackground settings={SETTINGS} />)).not.toThrow()
  })
})
