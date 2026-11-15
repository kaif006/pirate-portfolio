uniform float uTime;

varying vec2 vUv;
varying float vElevation;
varying float vWavePhase;
varying vec3 vPosition;
varying vec3 vWorldPosition;

float waveComponent(vec2 pos, vec2 center, vec2 influence, float amplitude) {
    vec2 offset = (pos - center) * influence;
    float distanceToCenter = length(offset);
    float wave = cos(min(distanceToCenter, 3.14159265)) + 1.0;

    return wave * amplitude;
}

void main() {
    vUv = uv;

    vec3 pos = position;

    float phase1 = pos.x * 0.5 + sin(pos.z * 0.3 + uTime * 0.2) * 0.8 - uTime * 0.7;
    float wave1 = sin(phase1) * 0.6;
    float wave2 = sin(pos.z * 0.4 + pos.x * 0.15 - uTime * 1.1) * 0.25;
    float wave3 = sin(pos.x * 0.9 + pos.z * 0.7 - uTime * 1.5) * 0.08;

    vec2 center1 = vec2(sin(uTime * 0.3) * 4.0, cos(uTime * 0.2) * 5.0);
    vec2 center2 = vec2(cos(uTime * 0.2) * 5.0, sin(uTime * 0.25) * 4.0);
    vec2 center3 = vec2(sin(uTime * 0.15 + 2.0) * 6.0, cos(uTime * 0.3) * 4.0);

    float burst1 = waveComponent(pos.xz, center1, vec2(0.5, 0.2), 0.35);
    float burst2 = waveComponent(pos.xz, center2, vec2(0.3, 0.5), 0.25);
    float burst3 = waveComponent(pos.xz, center3, vec2(0.4, 0.3), 0.30);

    float elevation = wave1 + wave2 + wave3 + burst1 + burst2 + burst3;

    pos.y += elevation;

    vElevation = elevation;
    vWavePhase = phase1;
    vPosition = position;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
