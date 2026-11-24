import * as THREE from 'three';
import type { Scene3D } from './Scene3D';

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0); // straight to clip space, ignores camera
}`;

const frag = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform float uHorizon; // screen height (0 bottom .. 1 top) where the sky starts
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// stretched noise = long horizontal cloud streaks
float clouds(float x, float y, float drift) {
  return vnoise(vec2(x * 1.2 + drift, y * 16.0))
       + 0.5 * vnoise(vec2(x * 3.0 + drift * 2.0, y * 34.0));
}

void main() {
  vec3 paper = vec3(0.949, 0.910, 0.816);  // matches 0xf2e8d0
  vec3 haze  = vec3(0.86, 0.76, 0.58);     // dusty ochre at the top

  vec2 uv = vec2(vUv.x * uAspect, vUv.y);
  float t = clamp((vUv.y - uHorizon) / (1.0 - uHorizon), 0.0, 1.0);

  // Stepped gradient with wobbly, hand-brushed band edges
  float wob = (vnoise(uv * vec2(1.5, 6.0)) - 0.5) * 0.10
            + (vnoise(uv * vec2(6.0, 30.0)) - 0.5) * 0.03;
  float tb = floor(clamp(t + wob, 0.0, 1.0) * 5.0) / 5.0;
  vec3 color = mix(paper, haze, pow(tb, 1.4));

  // Clouds: light streaks with a darker underside
  float drift = uTime * 0.004;
  float th = 0.98;
  float cloud  = step(th, clouds(uv.x, vUv.y, drift)) * step(0.1, t);
  float above  = step(th, clouds(uv.x, vUv.y + 0.012, drift)) * step(0.1, t);
  float shadow = above * (1.0 - cloud);
  color = mix(color, haze * 0.92, shadow * 0.55);
  color = mix(color, paper * 1.02, cloud);

  // Washi paper: grain, crossing fibres, slow mottling
  vec2 fc = gl_FragCoord.xy;
  float grain  = hash(floor(fc * 0.75)) - 0.5;
  float fibreH = vnoise(fc * vec2(0.9, 0.04)) - 0.5;
  float fibreV = vnoise(fc * vec2(0.04, 0.9)) - 0.5;
  float mottle = vnoise(uv * 5.0) - 0.5;
  color += (grain * 0.6 + fibreH * 0.4 + fibreV * 0.25) * 0.05 + mottle * 0.03;

  // Aged edges
  float v = length((vUv - 0.5) * vec2(uAspect * 0.6, 1.0));
  color = mix(color, color * vec3(0.92, 0.88, 0.80), smoothstep(0.45, 1.1, v));

  gl_FragColor = vec4(color, 1.0);
}`;

export class Background {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(app: Scene3D) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uHorizon: { value: 0.6 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.mesh.frustumCulled = false; // vertices are in clip space, not world space
    this.mesh.renderOrder = -1000;   // draw before the water
    app.scene.add(this.mesh);

    app.onUpdate((_dt, t) => {
      this.material.uniforms.uTime.value = t;
      this.material.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    });
  }

  set horizon(v: number) {
    this.material.uniforms.uHorizon.value = v;
  }
}
