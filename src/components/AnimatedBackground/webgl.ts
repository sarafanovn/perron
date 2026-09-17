import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from './shader'
import type { AnimatedBackgroundSettings } from '../../lib/types'

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }
  return shader
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = parseInt(normalized.length === 3 ? normalized.replace(/./g, (c) => c + c) : normalized, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

interface Uniforms {
  resolution: WebGLUniformLocation | null
  time: WebGLUniformLocation | null
  grain: WebGLUniformLocation | null
  detail: WebGLUniformLocation | null
  colorCount: WebGLUniformLocation | null
  colors: WebGLUniformLocation | null
}

export interface GradientRenderer {
  render(elapsedSeconds: number, settings: AnimatedBackgroundSettings, width: number, height: number): void
  dispose(): void
}

/**
 * Compiles the grainy-gradient shader once and returns a render() function
 * that redraws it for the current time/settings/canvas size. Kept separate
 * from the React component so the WebGL setup — the part actually worth
 * getting wrong carefully — can be reasoned about (and unit-tested for its
 * pure pieces, like hexToRgb) without a component lifecycle around it.
 */
export function createGradientRenderer(canvas: HTMLCanvasElement): GradientRenderer | null {
  const maybeGl = canvas.getContext('webgl')
  if (!maybeGl) return null
  const gl: WebGLRenderingContext = maybeGl

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create WebGL program')
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`)
  }

  // A single full-screen triangle (covers the viewport, cheaper than two
  // triangles for a quad) — the fragment shader does all the actual work.
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  const uniforms: Uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    grain: gl.getUniformLocation(program, 'uGrain'),
    detail: gl.getUniformLocation(program, 'uDetail'),
    colorCount: gl.getUniformLocation(program, 'uColorCount'),
    colors: gl.getUniformLocation(program, 'uColors'),
  }

  gl.useProgram(program)

  function render(elapsedSeconds: number, settings: AnimatedBackgroundSettings, width: number, height: number) {
    gl.viewport(0, 0, width, height)
    gl.uniform2f(uniforms.resolution, width, height)
    // speed is 0-100; scale down so the default (30) reads as a slow,
    // ambient drift rather than a fast strobe.
    gl.uniform1f(uniforms.time, elapsedSeconds * (settings.speed / 100) * 2)
    gl.uniform1f(uniforms.grain, settings.grain)
    // detail is 0-100; map to a noise frequency range that stays visually
    // meaningful at both ends (too low reads as a flat color, too high as
    // uniform static).
    gl.uniform1f(uniforms.detail, 0.5 + (settings.detail / 100) * 3.5)

    const colors = settings.colors.slice(0, 4)
    gl.uniform1i(uniforms.colorCount, colors.length)
    const flatColors = new Float32Array(12)
    colors.forEach((hex, i) => {
      const [r, g, b] = hexToRgb(hex)
      flatColors[i * 3] = r
      flatColors[i * 3 + 1] = g
      flatColors[i * 3 + 2] = b
    })
    gl.uniform3fv(uniforms.colors, flatColors)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function dispose() {
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    gl.deleteBuffer(positionBuffer)
  }

  return { render, dispose }
}

export { hexToRgb }
