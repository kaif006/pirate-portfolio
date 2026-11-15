varying vec2 vUv;
varying float vElevation;
varying float vWavePhase;
varying vec3 vPosition;

void main() {
    vec3 darkBlue = vec3(0.02, 0.08, 0.22);
    vec3 deepBlue = vec3(0.04, 0.16, 0.35);
    vec3 midBlue = vec3(0.05, 0.25, 0.48);
    vec3 lightBlue = vec3(0.15, 0.55, 0.70);
    vec3 foamWhite = vec3(0.92, 0.95, 0.85);

    float wave = sin(vWavePhase);

    float band1 = step(-0.3, wave);
    float band2 = step(0.3, wave);
    float band3 = step(0.75, wave);

    vec3 color = darkBlue;

    color = mix(color, deepBlue, band1);
    color = mix(color, midBlue, band2);
    color = mix(color, lightBlue, band3);

    float phase = fract(vWavePhase / 6.2831853);

    float foam1 = sin(vPosition.z * 2.0 + sin(vPosition.z * 0.5) * 2.0);
    float foam2 = sin(vPosition.z * 2.3 + sin(vPosition.z * 0.7) * 1.8 + 2.0);
    float foam3 = sin(vPosition.z * 1.7 + sin(vPosition.z * 0.4) * 2.5 + 4.0);

    float mask1 = smoothstep(0.1, 0.5, foam1);
    float mask2 = smoothstep(0.1, 0.5, foam2);
    float mask3 = smoothstep(0.1, 0.5, foam3);

    float width1 = 0.003 + 0.009 * mask1;
    float width2 = 0.003 + 0.009 * mask2;
    float width3 = 0.003 + 0.009 * mask3;

    float line1 = 1.0 - smoothstep(width1 * 0.7, width1, abs(phase - 0.18));
    float line2 = 1.0 - smoothstep(width2 * 0.7, width2, abs(phase - 0.24));
    float line3 = 1.0 - smoothstep(width3 * 0.7, width3, abs(phase - 0.30));

    float lines = max(line1 * mask1, max(line2 * mask2, line3 * mask3));

    color = mix(color, foamWhite, lines);

    gl_FragColor = vec4(color, 1.0);
}
