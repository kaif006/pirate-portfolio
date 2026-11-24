import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from './Water';
import { Background } from './Background';
import { addIslands } from './Islands';

const PAPER = 0xf2e8d0;

function disposeMeshes(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      const meshMaterials = Array.isArray(obj.material) ? obj.material : [obj.material];
      meshMaterials.forEach((material) => materials.add(material));
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}

export class Scene3D {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private frameId = 0;
  private updaters: ((dt: number, t: number) => void)[] = [];
  private readonly water: Water;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, projectTrack: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.toneMapping = THREE.NoToneMapping; // flat, print-like colors
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.background = new THREE.Color(PAPER);
    // tommorows problem
    //this.scene.fog = new THREE.Fog(PAPER, 40, 120);

    this.camera.position.set(0, 6, 22);
    this.camera.lookAt(0, 2, -10);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(10, 20, 8);
    this.scene.add(sun);

    new Background(this);
    this.water = new Water(this);
    this.addBoat();
    addIslands(this, projectTrack);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.animate();
  }

  onUpdate(fn: (dt: number, t: number) => void) {
    this.updaters.push(fn);
  }

  private addBoat() {
    const boat = new THREE.Group();
    const heading = -Math.PI / 2;
    boat.position.set(0, 0, -9);
    boat.rotation.set(0, heading, 0, 'YXZ');
    this.scene.add(boat);

    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);
    const halfLength = 2.5;
    const halfWidth = 0.65;
    this.onUpdate((dt) => {
      const { x, z } = boat.position;
      const bow = this.water.heightAt(x + forwardX * halfLength, z + forwardZ * halfLength);
      const stern = this.water.heightAt(x - forwardX * halfLength, z - forwardZ * halfLength);
      const starboard = this.water.heightAt(x - forwardZ * halfWidth, z + forwardX * halfWidth);
      const port = this.water.heightAt(x + forwardZ * halfWidth, z - forwardX * halfWidth);
      const height = (bow + stern + starboard + port) / 4;
      const pitch = Math.atan2(stern - bow, 2 * halfLength);
      const roll = Math.atan2(port - starboard, 2 * halfWidth);
      const blend = 1 - Math.exp(-dt * 5);

      boat.position.y = THREE.MathUtils.lerp(boat.position.y, height, blend);
      boat.rotation.x = THREE.MathUtils.lerp(boat.rotation.x, pitch, blend);
      boat.rotation.z = THREE.MathUtils.lerp(boat.rotation.z, roll, blend);
    });

    new GLTFLoader().load(
      `${import.meta.env.BASE_URL}models/boat/scene.gltf`,
      ({ scene: model }) => {
        if (this.disposed) {
          disposeMeshes(model);
          return;
        }
        model.scale.setScalar(0.009);
        // Center the hull under the pivot and lower its painted waterline to the sea.
        model.position.set(0, 0, 0.25);
        boat.add(model);
      },
      undefined,
      (error) => {
        if (!this.disposed) console.error('Could not load the boat model', error);
      },
    );
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.zoom = Math.min(1, this.camera.aspect / 0.95);
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
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    this.water.dispose();
    this.updaters.length = 0;
    disposeMeshes(this.scene);
    this.renderer.dispose();
  }
}
