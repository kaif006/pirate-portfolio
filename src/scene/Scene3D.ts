import * as THREE from 'three';
import { Water } from './Water';

const PAPER = 0xf2e8d0;

export class Scene3D {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private frameId = 0;
  private updaters: ((dt: number, t: number) => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.toneMapping = THREE.NoToneMapping; // flat, print-like colors
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.background = new THREE.Color(PAPER);
    // dissable for debugging
    //this.scene.fog = new THREE.Fog(PAPER, 40, 120);

    this.camera.position.set(0, 14, 18);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 8);
    this.scene.add(sun);

    const test = new Water(this);
    test.mesh.position.y = 0;

    this.resize();
    window.addEventListener('resize', this.resize);
    this.animate();
  }

  /** Register a function that runs every frame (ship, water time, camera...). */
  onUpdate(fn: (dt: number, t: number) => void) {
    this.updaters.push(fn);
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false); // false: CSS controls the canvas size
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    for (const fn of this.updaters) fn(dt, t);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
  }
}
