import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'

export type LensShape = 'squircle' | 'stadium' | 'rounded'

export interface GlassLensHandle {
  id: number
  element: HTMLElement
  shape: LensShape
}

interface GlassLensRegistryValue {
  register: (element: HTMLElement, shape: LensShape) => number
  unregister: (id: number) => void
  getSnapshot: () => GlassLensHandle[]
}

const GlassLensRegistryContext = createContext<GlassLensRegistryValue | null>(null)

/**
 * Registration lives in a plain Map inside a ref, not React state — the
 * render loop in GlassLensBackground reads getSnapshot() once per animation
 * frame, and a widget mounting/unmounting (or dragging, which changes its
 * DOM rect but not its identity) must never itself trigger a React
 * re-render of the whole app just to keep the lens list in sync.
 */
export function GlassLensProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef(new Map<number, GlassLensHandle>())
  const nextIdRef = useRef(0)

  const value = useRef<GlassLensRegistryValue>({
    register: (element, shape) => {
      const id = nextIdRef.current++
      registryRef.current.set(id, { id, element, shape })
      return id
    },
    unregister: (id) => {
      registryRef.current.delete(id)
    },
    getSnapshot: () => Array.from(registryRef.current.values()),
  }).current

  return <GlassLensRegistryContext.Provider value={value}>{children}</GlassLensRegistryContext.Provider>
}

export function useGlassLens(elementRef: RefObject<HTMLElement | null>, shape: LensShape, active: boolean): void {
  const registry = useContext(GlassLensRegistryContext)

  useEffect(() => {
    if (!active || !registry) return
    const element = elementRef.current
    if (!element) return
    const id = registry.register(element, shape)
    return () => registry.unregister(id)
  }, [registry, elementRef, shape, active])
}

export function useGlassLensRegistry(): { getSnapshot: () => GlassLensHandle[] } {
  const registry = useContext(GlassLensRegistryContext)
  if (!registry) throw new Error('useGlassLensRegistry must be used within a GlassLensProvider')
  return { getSnapshot: registry.getSnapshot }
}
