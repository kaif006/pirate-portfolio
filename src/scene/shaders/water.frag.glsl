uniform float uTime;

varying float vElevation;
varying float vWavePhase;
varying vec3 vPosition;
varying vec3 vWorldPosition;

const vec3  LIGHT_DIR      = vec3(0.4, 0.8, 0.5);
const float FOAM_HEIGHT = 0.8;
const float LINE_DENSITY   = 5.5;
const float GRAIN_AMOUNT   = 0.02;

float hash(vec2 p) 
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) 
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() 
{
    vec3 ink       = vec3(0.02, 0.07, 0.19);
    vec3 darkBlue  = vec3(0.03, 0.12, 0.30);
    vec3 deepBlue  = vec3(0.05, 0.22, 0.43);
    vec3 midBlue   = vec3(0.12, 0.40, 0.60);
    vec3 lightBlue = vec3(0.35, 0.65, 0.76);
    vec3 foamWhite = vec3(0.95, 0.93, 0.84);
    vec3 paper     = vec3(0.91, 0.86, 0.72);

    vec3 N = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    vec3 V = normalize(cameraPosition - vWorldPosition);
    if (dot(N, V) < 0.0) N = -N;
    float diffuse = dot(N, normalize(LIGHT_DIR));

    float tone = sin(vWavePhase) * 0.30 + (vElevation - 0.4) * 0.35 + diffuse * 0.30;

    vec3 color = ink;
    color = mix(color, darkBlue,  step(-0.35, tone));
    color = mix(color, deepBlue,  step(-0.05, tone));
    color = mix(color, midBlue,   step( 0.25, tone));
    color = mix(color, lightBlue, step( 0.55, tone));

    float t  = tone * LINE_DENSITY + (vnoise(vPosition.xz * 0.8) - 0.5) * 0.6;
    float f  = fract(t);
    float fw = fwidth(t);
    float contour = 1.0 - smoothstep(fw * 0.8, fw * 1.8, f);
    color = mix(color, ink, contour * 0.55 * step(-0.35, tone));

    //faom
    float n = vnoise(vPosition.xz * vec2(1.6, 3.2) + vec2(uTime * 0.15, 0.0))
            + 0.5 * vnoise(vPosition.xz * vec2(3.5, 7.0));
    float h = vElevation + (n - 0.75) * 0.45;
    float foam = step(FOAM_HEIGHT, h);
    float ring = step(FOAM_HEIGHT - 0.07, h) - foam;

    color = mix(color, ink, ring);
    color = mix(color, foamWhite * mix(0.85, 1.0, step(0.25, tone)), foam);

    //foam dot things
    vec2 g = vPosition.xz * 6.0;
    vec2 cell = floor(g);
    float r = hash(cell);
    float dotShape = step(length(fract(g) - 0.5), 0.18 * r);
    float dotZone  = step(FOAM_HEIGHT - 0.55, h) * (1.0 - step(FOAM_HEIGHT - 0.07, h));
    color = mix(color, foamWhite, dotShape * step(0.6, r) * dotZone);

    //fog
    float dist = distance(cameraPosition, vWorldPosition);
    float fade = floor(smoothstep(30.0, 50.0, dist) * 4.0) / 4.0;
    color = mix(color, paper, fade);

    //noise
    float grain = hash(floor(gl_FragCoord.xy * 0.75)) - 0.5;
    float fibre = vnoise(gl_FragCoord.xy * vec2(0.9, 0.04)) - 0.5;
    color += (grain * 0.6 + fibre * 0.4) * GRAIN_AMOUNT;

    gl_FragColor = vec4(color, 1.0);
}
