import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE, MAX_LENSES } from './shader'
import type { LensShape } from '../../context/GlassLensContext'

export interface ResolvedLens {
  x: number
  y: number
  width: number
  height: number
  shape: LensShape
}

export interface LensRenderer {
  // forceTextureUpload should be true whenever the background is
  // 'animated' (its canvas element's *contents* change every frame even
  // though the element reference stays the same), and can be false for a
  // static gradient/solid/image background — render() then skips the
  // texImage2D upload once the same source has already been uploaded,
  // since re-uploading an unchanged full-resolution RGBA texture to the
  // GPU 60 times a second was pure waste with no visual benefit.
  render(
    lenses: ResolvedLens[],
    backgroundSource: TexImageSource,
    canvasWidth: number,
    canvasHeight: number,
    forceTextureUpload: boolean
  ): void
  dispose(): void
}

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

/**
 * Flattens each lens's top-left/size rect into the shader's center+half-size
 * uniform layout (cheaper for the shader to consume per-pixel than
 * re-deriving center from top-left every sample) and pads/truncates to
 * exactly MAX_LENSES * 4 floats, since uLensRects is a fixed-size array
 * uniform — WebGL1 has no dynamically-sized uniform arrays.
 */
export function packLensRects(lenses: ResolvedLens[]): Float32Array {
  const out = new Float32Array(MAX_LENSES * 4)
  const count = Math.min(lenses.length, MAX_LENSES)
  for (let i = 0; i < count; i++) {
    const lens = lenses[i]
    out[i * 4] = lens.x + lens.width / 2
    out[i * 4 + 1] = lens.y + lens.height / 2
    out[i * 4 + 2] = lens.width / 2
    out[i * 4 + 3] = lens.height / 2
  }
  return out
}

export function createLensRenderer(canvas: HTMLCanvasElement): LensRenderer | null {
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

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    background: gl.getUniformLocation(program, 'uBackground'),
    lensCount: gl.getUniformLocation(program, 'uLensCount'),
    lensRects: gl.getUniformLocation(program, 'uLensRects'),
  }

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.useProgram(program)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  let lastUploadedSource: TexImageSource | null = null

  function render(
    lenses: ResolvedLens[],
    backgroundSource: TexImageSource,
    width: number,
    height: number,
    forceTextureUpload: boolean
  ) {
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.uniform2f(uniforms.resolution, width, height)
    gl.uniform1i(uniforms.lensCount, Math.min(lenses.length, MAX_LENSES))
    gl.uniform4fv(uniforms.lensRects, packLensRects(lenses))

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    if (forceTextureUpload || backgroundSource !== lastUploadedSource) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundSource)
      lastUploadedSource = backgroundSource
    }
    gl.uniform1i(uniforms.background, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function dispose() {
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    gl.deleteBuffer(positionBuffer)
    gl.deleteTexture(texture)
  }

  return { render, dispose }
}
