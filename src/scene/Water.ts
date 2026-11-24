import * as THREE from 'three';
import type { Scene3D } from './Scene3D';

import vertexShader from './shaders/water.vert.glsl?raw';
import fragmentShader from './shaders/water.frag.glsl?raw';

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

    window.addEventListener('pointermove', (e) => {
      ndc.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    });

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
}
