const PATHS = {
  close: 'M5 5L15 15M15 5L5 15',
  edit: 'M12.5 3.5L16.5 7.5M2 18L2.8 14.3L13 4.1C13.6 3.5 14.5 3.5 15.1 4.1L15.9 4.9C16.5 5.5 16.5 6.4 15.9 7L5.7 17.2L2 18Z',
  grid: 'M3 3H9V9H3V3Z M11 3H17V9H11V3Z M3 11H9V17H3V11Z M11 11H17V17H11V11Z',
  plus: 'M10 4V16M4 10H16',
} as const

export type IconName = 'close' | 'edit' | 'palette' | 'grid' | 'plus'

/**
 * Shared minimal line-icon set (stroke-based, currentColor) replacing the
 * emoji/text glyphs (✕ ✎ 🎨 ▦ ➕) that used to stand in for these actions —
 * keeps every button's icon the same visual weight and style regardless of
 * font/emoji rendering differences across platforms.
 */
export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  if (name === 'palette') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
        {/* Palette blob (circle pinched toward a rounded paint-well notch)
            with 3 paint-dot holes cut via mask, plus a brush made of a
            straight capsule handle and a rounded (not pointed) bristle tip —
            built from plain arc/circle/capsule primitives, not a bitmap
            trace, so every curve stays clean instead of jittery. */}
        <mask id="icon-palette-dots">
          <rect width="20" height="20" fill="white" />
          <circle cx="5.6" cy="8.6" r="1.15" fill="black" />
          <circle cx="6" cy="11.8" r="1.15" fill="black" />
          <circle cx="8.6" cy="6.4" r="1.15" fill="black" />
        </mask>
        <path
          fill="currentColor"
          mask="url(#icon-palette-dots)"
          d="M8.5 3C5 3 2.2 5.7 2.2 9C2.2 12.3 5 15 8.5 15C9.2 15 9.7 14.4 9.7 13.8C9.7 13.5 9.6 13.2 9.4 13C9.2 12.8 9.1 12.5 9.1 12.2C9.1 11.5 9.7 11 10.4 11H11.6C13.5 11 15 9.6 15 7.8C15 5.1 12 3 8.5 3Z"
        />
        <rect x="-0.9" y="-0.9" width="1.8" height="7.5" rx="0.9" fill="currentColor" transform="translate(13.4 17.4) rotate(-45)" />
        <ellipse cx="15.6" cy="4.4" rx="2.1" ry="2.7" fill="currentColor" transform="rotate(-45 15.6 4.4)" />
      </svg>
    )
  }
  const filled = name === 'grid'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
