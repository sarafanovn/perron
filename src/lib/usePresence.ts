import { useEffect, useRef, useState } from 'react'

/**
 * Keeps a component mounted for one extra animation cycle after `open`
 * turns false, so its CSS can play a closing animation instead of
 * disappearing instantly (the previous `if (!open) return null` pattern).
 * The caller applies a `-out` class while `closing` is true and removes the
 * node once `onAnimationEnd` fires; `shouldRender` gates the JSX.
 */
export function usePresence(open: boolean): { shouldRender: boolean; closing: boolean; onAnimationEnd: () => void } {
  const [shouldRender, setShouldRender] = useState(open)
  const [closing, setClosing] = useState(false)
  const wasOpen = useRef(open)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setClosing(false)
    } else if (wasOpen.current) {
      setClosing(true)
    }
    wasOpen.current = open
  }, [open])

  function onAnimationEnd() {
    if (!open) {
      setShouldRender(false)
      setClosing(false)
    }
  }

  return { shouldRender, closing, onAnimationEnd }
}
