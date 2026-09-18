// Neither vanta nor the old three.js version it requires (0.134, per
// vanta's README — @types/three's available range starts much later and
// would mismatch this runtime) ship type declarations. AnimatedBackground
// only passes the THREE module through to Vanta as an opaque namespace
// object, so a full type surface isn't needed here.
declare module 'three' {
  const namespace: unknown
  export = namespace
  export as namespace THREE
}

declare module 'vanta/dist/vanta.fog.min' {
  export interface VantaFogOptions {
    el: HTMLElement | string
    THREE?: unknown
    [key: string]: unknown
  }
  export interface VantaFogEffect {
    setOptions(options: Record<string, unknown>): void
    destroy(): void
  }
  // Declared as `default` for editor/type-check purposes, but vanta's UMD
  // build has no __esModule marker — see the runtime unwrap in
  // AnimatedBackground.tsx, which doesn't actually trust this shape as-is.
  export default function FOG(options: VantaFogOptions): VantaFogEffect
}
