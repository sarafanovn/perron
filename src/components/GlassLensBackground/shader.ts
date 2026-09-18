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
//
// The reference's mask math (MASK_MULTIPLIER_1 = 10000.0 and friends) was
// tuned for one hardcoded lens size in full-resolution-relative units —
// those constants don't transfer to N differently-sized lenses each
// normalized to their own [-1,1] box, so the mask here is rederived
// directly in that normalized space instead of copying magic numbers that
// assumed a different scale.
export const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 uResolution;
uniform sampler2D uBackground;
uniform int uLensCount;
uniform vec4 uLensRects[${MAX_LENSES}];

// How far past the lens edge (in the same normalized [-1,1] units) the
// smoothstep mask transition spans — larger reads as a softer, more
// translucent lens edge; smaller reads as a crisper cutout.
const float EDGE_SOFTNESS = 0.35;
// How strongly the sampled background is pulled toward the lens center
// near the middle of the lens — the "magnifying glass" bulge. 0 means no
// magnification (a plain rounded-rect crop); the reference shader's
// analogous constant produced a subtle, not extreme, bulge.
const float MAGNIFICATION = 0.4;
const float GRADIENT_RANGE = 0.35;
const float HIGHLIGHT_INTENSITY = 0.22;
const float SHADE_INTENSITY = 0.1;

vec4 sampleLens(vec2 fragPx, vec4 rect, vec2 resolution, sampler2D bg) {
  vec2 center = rect.xy;
  vec2 halfSize = max(rect.zw, vec2(1.0));
  vec2 m2 = (fragPx - center) / halfSize;

  // Cheap axis-aligned bounding-box reject before the expensive pow()/
  // texture2D work below — the vast majority of a lens's uLensRects
  // bounding area is empty screen space, so most (lens, pixel) pairs across
  // the whole loop never need the full mask/sample computation at all.
  vec2 absM2 = abs(m2);
  if (absM2.x > 1.0 || absM2.y > 1.0) return vec4(0.0);

  // x^6 via multiplication (x^2, then squared, then one more multiply)
  // instead of pow(x, 6.0) — GLSL's general pow() is typically implemented
  // as exp2(y * log2(x)), notably more expensive per-call than a fixed
  // small integer power computed directly, and this runs twice per lens
  // per covered pixel.
  vec2 sq = absM2 * absM2;
  vec2 sixth = sq * sq * sq;
  float roundedBox = sixth.x + sixth.y;
  // roundedBox == 1.0 at the box edge (since |m2.x|=1 or |m2.y|=1 alone
  // already gives 1), so the smoothstep transition band straddles 1.0.
  float transition = 1.0 - smoothstep(1.0 - EDGE_SOFTNESS, 1.0, roundedBox);
  if (transition <= 0.0) return vec4(0.0);

  vec2 lensOffsetPx = m2 * halfSize * (1.0 - MAGNIFICATION * (1.0 - clamp(roundedBox, 0.0, 1.0)));
  vec2 lensUv = (center + lensOffsetPx) / resolution;
  vec4 sampled = texture2D(bg, lensUv);

  // A soft highlight along the lens's top edge and a soft shade along its
  // bottom edge — the directional cue that reads as a curved glass surface
  // catching light from above, matching the reference shader's intent.
  float topHighlight = smoothstep(1.0 - GRADIENT_RANGE, 1.0, -m2.y) * HIGHLIGHT_INTENSITY;
  float bottomShade = smoothstep(1.0 - GRADIENT_RANGE, 1.0, m2.y) * SHADE_INTENSITY;
  vec3 lit = clamp(sampled.rgb + vec3(topHighlight) - vec3(bottomShade), 0.0, 1.0);

  return vec4(lit, transition);
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
