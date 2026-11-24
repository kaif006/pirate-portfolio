import * as THREE from 'three';
import type { Scene3D } from './Scene3D';

import vertexShader from './shaders/water.vert.glsl?raw';
import fragmentShader from './shaders/water.frag.glsl?raw';

function peaked(phase: number, shape: number) {
  return 2 * Math.exp(shape * (Math.sin(phase) - 1)) - 1;
}

function waveComponent(x: number, z: number, influenceX: number, influenceZ: number, amplitude: number) {
  const distance = Math.hypot(x * influenceX, z * influenceZ);
  const wave = 0.5 * (Math.cos(Math.min(distance, Math.PI)) + 1);
  return wave * wave * 2 * amplitude;
}

export class Water {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(scene3d: Scene3D) {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseEnergy: { value: 0 },
      },
    });

    const geometry = new THREE.PlaneGeometry(160, 160, 640, 640);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.material);
    scene3d.scene.add(this.mesh);

    // mouse interation
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0
    const ndc = new THREE.Vector2(0, 0);
    const hit = new THREE.Vector3();
    const target = new THREE.Vector2();
    const smoothed = new THREE.Vector2();
    const prev = new THREE.Vector2();
    let energy = 0;

    this.onPointerMove = (e) => {
      ndc.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('pointermove', this.onPointerMove);

    scene3d.onUpdate((dt, t) => {
      this.material.uniforms.uTime.value = t;

      raycaster.setFromCamera(ndc, scene3d.camera);
      // null when the ray misses the plane (cursor above the horizon),
      if (raycaster.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z);

      prev.copy(smoothed);
      smoothed.lerp(target, 1 - Math.exp(-dt * 8)); // frame-rate independent smoothing

      // faster mouse = stronger disturbance, with a gentle idle floor
      const speed = smoothed.distanceTo(prev) / Math.max(dt, 1e-4);
      const want = 0.25 + Math.min(speed * 0.12, 1.0);
      energy += (want - energy) * (1 - Math.exp(-dt * 4));

      this.material.uniforms.uMouse.value.copy(smoothed);
      this.material.uniforms.uMouseEnergy.value = energy;
    });
  }

  private readonly onPointerMove: (e: PointerEvent) => void;

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove);
  }

  // Match water.vert.glsl using the same frame's uniforms. The mesh only translates in Y.
  heightAt(x: number, z: number) {
    const t: number = this.material.uniforms.uTime.value;
    const mouse: THREE.Vector2 = this.material.uniforms.uMouse.value;
    const energy: number = this.material.uniforms.uMouseEnergy.value;

    const px = x + Math.sin(z * 1.7 + t * 0.8) * 0.35;
    const pz = z + Math.sin(x * 1.3 - t * 0.6) * 0.35;
    const phase = px * 0.5 + Math.sin(pz * 0.3 + t * 0.2) * 0.8 - t * 0.7;
    const waves = peaked(phase, 1.25) * 0.6
      + peaked(pz * 0.4 + px * 0.15 - t * 1.1, 1.5) * 0.25
      + peaked(px * 0.9 + pz * 0.7 - t * 1.5, 1.5) * 0.10
      + peaked((px * 0.7 + pz * 0.5) * 1.3 - t * 1.8, 1.5) * 0.18
      + peaked((px * -0.4 + pz * 0.9) * 1.8 + t * 1.4, 1.5) * 0.12;

    const bursts = waveComponent(x - Math.sin(t * 0.3) * 4, z - Math.cos(t * 0.2) * 5, 0.5, 0.2, 0.30)
      + waveComponent(x - Math.cos(t * 0.2) * 5, z - Math.sin(t * 0.25) * 4, 0.3, 0.5, 0.20)
      + waveComponent(x - Math.sin(t * 0.15 + 2) * 6, z - Math.cos(t * 0.3) * 4, 0.4, 0.3, 0.25);

    const distance = Math.hypot(x - mouse.x, z - mouse.y);
    const falloff = Math.exp(-distance * distance * 0.08);
    const rings = peaked(distance * 2.2 - t * 4, 1.25);
    const bump = Math.exp(-distance * distance * 0.6);
    const disturbance = (rings * 0.35 * falloff + bump * 0.4) * energy;

    return this.mesh.position.y + waves + bursts + disturbance;
  }
}
