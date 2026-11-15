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
      },
    });

    const geometry = new THREE.PlaneGeometry(
      20,
      20,
      128,
      128
    );

    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.material);

    scene3d.scene.add(this.mesh);

    scene3d.onUpdate((_dt, t) => {
      this.material.uniforms.uTime.value = t;
    });
  }
}
