export const MAX_LENSES = 16

export const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// Adapted from the user-supplied reference shader (a Shadertoy-style
// "liquid glass" lens: a rounded-rect mask built from a high power sum,
// magnified/refracted sampling of the background inside that mask, and a
// directional gradient highlight along its top/bottom edge). The single-
// lens reference is extended here to loop over up to MAX_LENSES lenses in
// one draw call — each widget/panel contributes one lens uniform slot
// instead of needing its own canvas and draw call, which is what makes
// this affordable at N widgets instead of O(N) WebGL contexts.
export const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 uResolution;
uniform sampler2D uBackground;
uniform int uLensCount;
uniform vec4 uLensRects[${MAX_LENSES}];

const float NUM_ZERO = 0.0;
const float NUM_ONE = 1.0;
const float NUM_TWO = 2.0;
const float POWER_EXPONENT = 6.0;
const float MASK_MULTIPLIER_1 = 10000.0;
const float MASK_MULTIPLIER_2 = 9500.0;
const float MASK_MULTIPLIER_3 = 11000.0;
const float LENS_MULTIPLIER = 5000.0;
const float MASK_STRENGTH_1 = 8.0;
const float MASK_STRENGTH_2 = 16.0;
const float MASK_STRENGTH_3 = 2.0;
const float MASK_THRESHOLD_1 = 0.95;
const float MASK_THRESHOLD_2 = 0.9;
const float MASK_THRESHOLD_3 = 1.5;
const float GRADIENT_RANGE = 0.2;
const float GRADIENT_OFFSET = 0.1;
const float GRADIENT_EXTREME = -1000.0;
const float LIGHTING_INTENSITY = 0.3;

vec4 sampleLens(vec2 fragPx, vec4 rect, vec2 resolution, sampler2D bg) {
  vec2 uv = fragPx / resolution;
  vec2 center = rect.xy / resolution;
  vec2 halfSize = max(rect.zw, vec2(1.0)) / resolution;

  vec2 m2 = (uv - center) / halfSize;
  float roundedBox = pow(abs(m2.x), POWER_EXPONENT) + pow(abs(m2.y), POWER_EXPONENT);
  float rb1 = clamp((NUM_ONE - roundedBox * MASK_MULTIPLIER_1 / 10000.0) * MASK_STRENGTH_1, NUM_ZERO, NUM_ONE);
  float rb2 = clamp((MASK_THRESHOLD_1 - roundedBox * MASK_MULTIPLIER_2 / 10000.0) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE) -
    clamp(pow(MASK_THRESHOLD_2 - roundedBox * MASK_MULTIPLIER_2 / 10000.0, NUM_ONE) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE);
  float rb3 = clamp((MASK_THRESHOLD_3 - roundedBox * MASK_MULTIPLIER_3 / 10000.0) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE) -
    clamp(pow(NUM_ONE - roundedBox * MASK_MULTIPLIER_3 / 10000.0, NUM_ONE) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE);

  float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1 + rb2);
  if (transition <= NUM_ZERO) return vec4(0.0);

  vec2 lensUv = center + m2 * halfSize * (NUM_ONE - roundedBox * LENS_MULTIPLIER / MASK_MULTIPLIER_1);
  vec4 sampled = texture2D(bg, lensUv);

  float gradient = clamp((clamp(m2.y, NUM_ZERO, GRADIENT_RANGE) + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE) +
    clamp((clamp(-m2.y, GRADIENT_EXTREME, GRADIENT_RANGE) * rb3 + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE);
  vec4 lighting = clamp(sampled + vec4(rb1) * gradient + vec4(rb2) * LIGHTING_INTENSITY, NUM_ZERO, NUM_ONE);

  return vec4(lighting.rgb, transition);
}

void main() {
  vec2 fragPx = gl_FragCoord.xy;
  vec4 result = vec4(0.0);

  for (int i = 0; i < ${MAX_LENSES}; i++) {
    if (i >= uLensCount) break;
    vec4 lens = sampleLens(fragPx, uLensRects[i], uResolution, uBackground);
    result = mix(result, vec4(lens.rgb, 1.0), lens.a);
  }

  gl_FragColor = result;
}
`
