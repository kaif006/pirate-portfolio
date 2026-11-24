import * as THREE from 'three';
import { projects } from '../data/projects';
import type { Scene3D } from './Scene3D';

const DEPTH = -19;
const STOP_X = -7.5;
const ISLAND_RADIUS = 2.2;
const ISLAND_WIDTH_SCALE = 4;
const ISLAND_HEIGHT_SCALE = 2;
const ISLAND_DEPTH_SCALE = 3.5;
const ISLAND_FOOTPRINT_RADIUS = ISLAND_RADIUS * 1.3 * ISLAND_WIDTH_SCALE;

const SEGMENTS = 28;

const profiles = [
  { peak: 1.55, stretch: 0.87, beach: 0.74, cliff: '#685548' },
  { peak: 1.14, stretch: 0.69, beach: 0.67, cliff: '#a56c49' },
  { peak: 2.05, stretch: 0.79, beach: 0.87, cliff: '#53575b' },
  { peak: 1.48, stretch: 0.91, beach: 0.82, cliff: '#565d63' },
  { peak: 1.78, stretch: 0.73, beach: 0.78, cliff: '#a77a54' },
];

function createTerrain(theme: string, index: number) {
  const { peak, stretch, beach, cliff } = profiles[index % profiles.length];
  const phase = index * 2.17;
  const shelves = [
    { radius: 1, y: -1.2, relief: 0.12, color: '#76614a' },
    { radius: 0.96, y: 0.22, relief: 0.16, color: '#c3a576' },
    { radius: beach, y: 0.42, relief: 0.24, color: '#ddbd83' },
    { radius: beach * 0.88, y: 0.55, relief: 0.53, color: cliff },
    { radius: 0.45, y: 0.68, relief: 0.83, color: theme },
    { radius: 0.21, y: 0.76, relief: 1, color: theme },
  ];

  const rings = shelves.map((shelf, ringIndex) =>
    Array.from({ length: SEGMENTS }, (_, segment) => {
      const angle = segment / SEGMENTS * Math.PI * 2 + (ringIndex % 2) * 0.07;
      const coast = 1 + 0.12 * Math.sin(3 * angle + phase)
        + 0.08 * Math.cos(5 * angle - phase) + 0.05 * Math.sin(9 * angle + phase);
      const ridge = 0.48 + 0.29 * Math.cos(angle + phase)
        + 0.19 * Math.sin(3 * angle - phase) + 0.08 * Math.cos(7 * angle);
      const radius = ISLAND_RADIUS * shelf.radius * coast;
      const inland = 1 - shelf.radius;

      return new THREE.Vector3(
        radius * Math.cos(angle) + inland * 0.46 * Math.cos(phase),
        shelf.y + shelf.relief * ridge * peak,
        radius * Math.sin(angle) * stretch + inland * 0.34 * Math.sin(phase),
      );
    }),
  );

  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  function triangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, tint: string, shade: number) {
    color.set(tint).multiplyScalar(shade);
    for (const point of [a, b, c]) {
      positions.push(point.x, point.y, point.z);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let ring = 0; ring < rings.length - 1; ring++) {
    const outer = rings[ring];
    const inner = rings[ring + 1];
    const tint = shelves[ring].color;
    for (let segment = 0; segment < SEGMENTS; segment++) {
      const next = (segment + 1) % SEGMENTS;
      const shade = 0.94 + 0.08 * Math.sin(segment * 4.27 + ring * 2.91 + phase);
      triangle(outer[segment], inner[segment], outer[next], tint, shade);
      triangle(outer[next], inner[segment], inner[next], tint, shade + 0.045);
    }
  }

  const summit = new THREE.Vector3(0.46 * Math.cos(phase), 0.8 + peak * 0.57, 0.34 * Math.sin(phase));
  const top = rings[rings.length - 1];
  for (let segment = 0; segment < SEGMENTS; segment++) {
    triangle(top[segment], summit, top[(segment + 1) % SEGMENTS], theme, 1.02);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return { geometry, cliff, beachEdge: rings[2], ridgeEdge: rings[4] };
}

const ARRIVAL_END = 0.35;
const DEPARTURE_START = 0.65;

export function addIslands(app: Scene3D, projectTrack: HTMLElement) {
  const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
  });
  const rockGeometry = new THREE.DodecahedronGeometry(1);
  const islands = projects.map((project, index) => {
    const island = new THREE.Group();
    island.position.z = DEPTH;
    island.rotation.y = index * 0.73;
    island.scale.set(ISLAND_WIDTH_SCALE, ISLAND_HEIGHT_SCALE, ISLAND_DEPTH_SCALE);
    island.visible = false;

    const { geometry, cliff, beachEdge, ridgeEdge } = createTerrain(project.theme.color, index);
    island.add(new THREE.Mesh(geometry, terrainMaterial));

    const rockMaterial = new THREE.MeshStandardMaterial({ color: cliff, flatShading: true, roughness: 1 });
    for (let rockIndex = 0; rockIndex < 8; rockIndex++) {
      const edge = rockIndex < 5 ? beachEdge : ridgeEdge;
      const anchor = edge[(rockIndex * 5 + index * 3) % SEGMENTS];
      const size = 0.13 + ((rockIndex * 3 + index) % 7) * 0.043;
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.copy(anchor).multiply(new THREE.Vector3(1.03, 1, 1.03));
      rock.scale.set(size * 1.25, size * 0.82, size * 0.91);
      rock.rotation.set(rockIndex * 0.48, rockIndex * 0.82, index * 0.4);
      island.add(rock);
    }

    app.scene.add(island);
    return island;
  });

  const cameraSpace = new THREE.Vector3();
  const projectStops = Array.from(projectTrack.children);
  let stoppedIndex = -1;
  app.onUpdate(() => {
    const { top, height } = projectTrack.getBoundingClientRect();
    const progress = height > 0 ? -top / height * islands.length : 0;
    const index = Math.floor(progress);
    const phase = progress - index;
    const isStopped = index >= 0 && index < islands.length && phase >= ARRIVAL_END && phase <= DEPARTURE_START;
    const nextStoppedIndex = isStopped ? index : -1;
    if (nextStoppedIndex !== stoppedIndex) {
      projectStops[stoppedIndex]?.removeAttribute('data-island-stopped');
      projectStops[nextStoppedIndex]?.setAttribute('data-island-stopped', '');
      stoppedIndex = nextStoppedIndex;
    }

    cameraSpace.set(0, 0, DEPTH).applyMatrix4(app.camera.matrixWorldInverse);
    const halfViewWidth = (-cameraSpace.z + ISLAND_FOOTPRINT_RADIUS)
      * Math.tan(THREE.MathUtils.degToRad(app.camera.getEffectiveFOV() / 2))
      * app.camera.aspect;
    const offscreenX = halfViewWidth + ISLAND_FOOTPRINT_RADIUS;

    islands.forEach((island, index) => {
      const local = progress - index;
      island.visible = local > 0 && local < 1;
      if (!island.visible) return;

      const arrival = THREE.MathUtils.smoothstep(local, 0, ARRIVAL_END);
      const departure = THREE.MathUtils.smoothstep(local, DEPARTURE_START, 1);
      island.position.x = THREE.MathUtils.lerp(-offscreenX, STOP_X, arrival)
        + (offscreenX - STOP_X) * departure;
    });
  });
}
