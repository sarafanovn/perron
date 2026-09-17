export const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// A grainy, drifting gradient in the style of iOS/macOS wallpaper
// generators: 2-4 colors blended across the screen by a fractal Brownian
// motion (fBm) noise field, with a film-grain layer added on top. Every
// tunable knob (grain/speed/detail) maps to exactly one uniform, so
// AnimatedBackground only has to translate 0-100 slider values into the
// ranges the shader expects — the actual "look" lives entirely here.
export const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uGrain;
uniform float uDetail;
uniform int uColorCount;
uniform vec3 uColors[4];

// Standard hash/value-noise/fBm trio — cheap enough for a full-screen
// fragment shader at 60fps, and the visible "look" only needs smooth
// continuous noise, not a particular high-quality algorithm like Perlin.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * valueNoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Cheap pseudo-random grain: a fresh hash per pixel per frame (uTime
// perturbs the input) reads as film grain rather than a fixed dither
// pattern, without needing a texture upload.
float grainNoise(vec2 p, float time) {
  return hash(p + time);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 aspectUv = vec2(uv.x * uResolution.x / uResolution.y, uv.y);

  // uDetail scales spatial frequency: low values -> a few large soft
  // regions, high values -> many small intricate ones.
  vec2 noiseCoord = aspectUv * uDetail + vec2(uTime * 0.05, uTime * 0.03);
  // fbm's own output only spans roughly [0.15, 0.6] (five octaves at
  // halving amplitude bias it toward the middle), so each blend weight is
  // independently renormalized to the full [0,1] range before use — a
  // fixed threshold band otherwise clips most of the signal to one end and
  // a single color swamps the whole screen.
  float n1 = fbm(noiseCoord);
  float n2 = fbm(noiseCoord + vec2(5.2, 1.3) + uTime * 0.02);
  float n3 = fbm(noiseCoord + vec2(-3.1, 8.7) + uTime * 0.015);
  float w1 = smoothstep(0.0, 1.0, (n1 - 0.15) / 0.45);
  float w2 = smoothstep(0.0, 1.0, (n2 - 0.15) / 0.45);
  float w3 = smoothstep(0.0, 1.0, (n3 - 0.15) / 0.45);

  // Blend across however many colors were actually provided (2-4) using
  // independent noise fields as blend weights, so the palette always reads
  // as continuous drifting regions rather than hard bands or one color
  // dominating the frame.
  vec3 color = uColors[0];
  if (uColorCount >= 2) color = mix(color, uColors[1], w1);
  if (uColorCount >= 3) color = mix(color, uColors[2], w2);
  if (uColorCount >= 4) color = mix(color, uColors[3], w3);

  float grain = (grainNoise(gl_FragCoord.xy, uTime * 60.0) - 0.5) * (uGrain / 100.0) * 0.35;
  color += grain;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
