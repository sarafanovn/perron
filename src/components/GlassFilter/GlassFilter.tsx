/**
 * Defines the SVG displacement filter that gives the Glass style its
 * refractive "Liquid Glass" look (see --surface-filter in tokens.css, which
 * references this by #glass-distortion). Rendered once, hidden, since a
 * single <filter> definition is reused by every surface's backdrop-filter —
 * it produces no visible output of its own.
 */
export function GlassFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="glass-distortion">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
