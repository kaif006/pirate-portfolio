import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from './Water';
import { Background } from './Background';
import { addIslands } from './Islands';

const PAPER = 0xf2e8d0;
const BOAT_Z = -9;

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
  private chatOpen = false;
  private cameraBlend = 0;
  private onWaverClick?: (event: MouseEvent) => void;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(canvas: HTMLCanvasElement, projectTrack: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.toneMapping = THREE.NoToneMapping; // flat, print-like colors
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.background = new THREE.Color(PAPER);
    // tommorows problem
    //this.scene.fog = new THREE.Fog(PAPER, 40, 120);

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

  setChatOpen(open: boolean) {
    this.chatOpen = open;
  }

  private addBoat() {
    const boat = new THREE.Group();
    const heading = -Math.PI / 2;
    boat.position.set(0, 0, BOAT_Z);
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

    const loader = new GLTFLoader();
    loader.load(
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
        this.addWaver(boat, loader);
      },
      undefined,
      (error) => {
        if (!this.disposed) console.error('Could not load the boat model', error);
      },
    );
  }

  private addWaver(boat: THREE.Group, loader: GLTFLoader) {
    loader.load(
      `${import.meta.env.BASE_URL}models/straw-hat-waver.glb`,
      ({ scene: waver, animations }) => {
        if (this.disposed) {
          disposeMeshes(waver);
          return;
        }

        // Boat-local coordinates keep the character planted as the hull rocks.
        waver.position.set(0.07, 0.18, -1.6);
        waver.rotation.y = Math.PI / 2;
        waver.scale.setScalar(0.58);
        boat.add(waver);

        const wave = animations[0];
        if (wave) {
          const mixer = new THREE.AnimationMixer(waver);
          const action = mixer.clipAction(wave).setLoop(THREE.LoopOnce, 1);
          const raycaster = new THREE.Raycaster();
          const pointer = new THREE.Vector2();
          const characterMeshes = new Set<THREE.Object3D>();
          waver.traverse((object) => {
            if (object instanceof THREE.Mesh) characterMeshes.add(object);
          });

          // The canvas lets pointer events pass through to the portfolio UI.
          this.onWaverClick = (event) => {
            if (event.detail === 0 || event.defaultPrevented) return;
            if (event.target instanceof Element && event.target.closest(
              'a, button, input, textarea, select, label, summary, video, [role="button"], [contenteditable], .paper-panel, .project-photos',
            )) return;

            const bounds = this.renderer.domElement.getBoundingClientRect();
            pointer.set(
              ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
              1 - ((event.clientY - bounds.top) / bounds.height) * 2,
            );
            boat.updateMatrixWorld(true);
            raycaster.setFromCamera(pointer, this.camera);
            const hit = raycaster.intersectObject(boat)[0];
            if (hit && characterMeshes.has(hit.object)) action.reset().play();
          };
          window.addEventListener('click', this.onWaverClick);
          this.onUpdate((dt) => mixer.update(dt));
        }
      },
      undefined,
      (error) => {
        if (!this.disposed) console.error('Could not load the straw-hat character', error);
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
    this.frameCamera();
  };

  private frameCamera() {
    const narrow = window.innerWidth <= 760;
    const blend = this.cameraBlend;
    this.camera.position.set(
      0,
      THREE.MathUtils.lerp(6, 4.8, blend),
      THREE.MathUtils.lerp(22, narrow ? 10 : 8, blend),
    );
    // Leave the boat visible beside the panel on wide screens and above it on narrow screens.
    this.camera.lookAt(
      narrow ? 0 : 0.35 * blend,
      THREE.MathUtils.lerp(2, narrow ? -5 : 0.65, blend),
      THREE.MathUtils.lerp(-10, BOAT_Z, blend),
    );
    this.camera.updateMatrixWorld();
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    const target = this.chatOpen ? 1 : 0;
    if (this.cameraBlend !== target) {
      const next = THREE.MathUtils.damp(this.cameraBlend, target, 5, dt);
      this.cameraBlend = this.reducedMotion.matches || Math.abs(target - next) < 0.001 ? target : next;
      this.frameCamera();
    }
    for (const fn of this.updaters) fn(dt, t);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    if (this.onWaverClick) window.removeEventListener('click', this.onWaverClick);
    this.water.dispose();
    this.updaters.length = 0;
    disposeMeshes(this.scene);
    this.renderer.dispose();
  }
}
