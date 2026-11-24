uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseEnergy;

varying float vElevation;
varying float vWavePhase;
varying vec3 vPosition;
varying vec3 vWorldPosition;

float peaked(float p, float k) 
{
    return 2.0 * exp(k * (sin(p) - 1.0)) - 1.0;
}

float mouseDisturbance(vec2 xz) 
{
    float d = distance(xz, uMouse);
    float falloff = exp(-d * d * 0.08);                 // ring reach (~3.5 units)
    float rings = peaked(d * 2.2 - uTime * 4.0, 1.25);  // outward-moving crests
    float bump = exp(-d * d * 0.6);                     // local swell under the cursor
    return (rings * 0.35 * falloff + bump * 0.4) * uMouseEnergy;
}

float waveComponent(vec2 pos, vec2 center, vec2 influence, float amplitude) 
{
    vec2 offset = (pos - center) * influence;
    float d = length(offset);
    float wave = 0.5 * (cos(min(d, 3.14159265)) + 1.0);
    return wave * wave * 2.0 * amplitude;
}

void main() 
{
    vec3 pos = position;

    vec2 p = pos.xz + vec2(sin(pos.z * 1.7 + uTime * 0.8), sin(pos.x * 1.3 - uTime * 0.6)) * 0.35;

    float phase1 = p.x * 0.5 + sin(p.y * 0.3 + uTime * 0.2) * 0.8 - uTime * 0.7;
    float wave1 = peaked(phase1, 1.25) * 0.6;

    float wave2 = peaked(p.y * 0.4 + p.x * 0.15 - uTime * 1.1, 1.5) * 0.25;
    float wave3 = peaked(p.x * 0.9 + p.y * 0.7 - uTime * 1.5, 1.5) * 0.10;

    float wave4 = peaked(dot(p, vec2(0.7, 0.5)) * 1.3 - uTime * 1.8, 1.5) * 0.18;
    float wave5 = peaked(dot(p, vec2(-0.4, 0.9)) * 1.8 + uTime * 1.4, 1.5) * 0.12;

    vec2 center1 = vec2(sin(uTime * 0.3) * 4.0, cos(uTime * 0.2) * 5.0);
    vec2 center2 = vec2(cos(uTime * 0.2) * 5.0, sin(uTime * 0.25) * 4.0);
    vec2 center3 = vec2(sin(uTime * 0.15 + 2.0) * 6.0, cos(uTime * 0.3) * 4.0);

    float burst1 = waveComponent(pos.xz, center1, vec2(0.5, 0.2), 0.30);
    float burst2 = waveComponent(pos.xz, center2, vec2(0.3, 0.5), 0.20);
    float burst3 = waveComponent(pos.xz, center3, vec2(0.4, 0.3), 0.25);

    float elevation = wave1 + wave2 + wave3 + wave4 + wave5 + burst1 + burst2 + burst3;
    elevation += mouseDisturbance(pos.xz);
    pos.y += elevation;

    vElevation = elevation;
    vWavePhase = phase1;
    vPosition = position;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
