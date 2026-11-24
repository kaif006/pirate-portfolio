// Content for the five project islands, in the order the ship visits them.
// Edit the text, colors and links freely; the 3D scene reads from this file.

export type ProjectPhoto = { src: string; alt: string }

export type Project = {
  id: string
  order: number
  title: string
  subtitle: string
  date: string
  tech: string[]
  summary: string
  highlights: string[]
  /** Island theme: base color used for the low-poly island materials. */
  theme: { name: string; color: string }
  /** Looping clips placed in /public/media (WebM and MP4 for browser support). */
  media: { webm: string; mp4: string; poster?: string }[]
  photos?: ProjectPhoto[]
  links: { label: string; url: string }[]
}

export const projects: Project[] = [
  {
    id: 'spitfin',
    order: 1,
    title: 'Spitfin',
    subtitle: 'Real-time multiplayer game (AI-assisted)',
    date: 'Oct 2026',
    tech: ['TypeScript', 'Three.js', 'Node.js', 'WebSockets', 'PostgreSQL', 'Redis'],
    summary:
      'A 2 to 4 player browser game with a server-authoritative 30 Hz simulation, built with LLM assistance and reviewed through type checking and a 400+ test suite.',
    highlights: [
      'Client-side prediction with reconciliation and snapshot interpolation',
      'One deterministic simulation shared by server and client',
      'Allocation-free frame loop and instanced scenery in one draw call',
    ],
    theme: { name: 'green', color: '#4f8a5b' },
    media: [{ webm: '/media/spitfin.webm', mp4: '/media/spitfin.mp4', poster: '/media/spitfin.webp' }],
    photos: [
      { src: '/media/spitfin.webp', alt: 'Spitfin match preview' },
      { src: '/media/spitfin-match.webp', alt: 'Overhead view of Spitfin’s forest arena' },
    ],
    links: [], // TODO: add { label: 'Source', url: '...' }
  },
  {
    id: 'harsh-dunes',
    order: 2,
    title: 'Harsh Dunes',
    subtitle: '3D narrative adventure',
    date: 'Nov 2025',
    tech: ['Unity', 'C#'],
    summary:
      'A narrative adventure with a finite-state-machine character controller and an event-driven dialogue system.',
    highlights: [
      'FSM separates locomotion, combat, stealth and aerial states',
      'Dialogue triggers independent of gameplay code',
      'Layered animation state machines and blend trees for combat',
    ],
    theme: { name: 'burnt orange desert', color: '#c8651b' },
    media: [{ webm: '/media/harsh-dunes.webm', mp4: '/media/harsh-dunes.mp4' }],
    links: [],
  },
  {
    id: 'ragdoll-party',
    order: 3,
    title: 'Ragdoll Party Game',
    subtitle: 'Local multiplayer party game',
    date: 'Apr 2026',
    tech: ['Unreal Engine 5', 'C++', 'Blueprints'],
    summary:
      'A local multiplayer course project with active ragdoll characters, a combo-based combat system and a full round-flow game loop.',
    highlights: [
      'Active ragdolls that react to physics while staying controllable',
      'Round flow, player management and win conditions',
      'Combos and physics-based attacks',
    ],
    theme: { name: 'rocky', color: '#7d7a78' },
    media: [{ webm: '/media/ragdoll-party.webm', mp4: '/media/ragdoll-party.mp4', poster: '/media/ragdoll-party.webp' }],
    photos: [
      { src: '/media/ragdoll-party.webp', alt: 'Ragdoll Party Game preview' },
      { src: '/media/ragdoll-arena.webp', alt: 'The low-poly arena in the Unreal project' },
    ],
    links: [],
  },
  {
    id: 'tiptoe-thief',
    order: 4,
    title: 'Tiptoe Thief',
    subtitle: 'Global Game Jam Runner-Up',
    date: 'Feb 2026',
    tech: ['Unity', 'C#'],
    summary:
      'A stealth game made in 48 hours by Team Untitled, where sneaking beats running, with a custom CCTV post-processing look.',
    highlights: [
      'Runner-Up at the Global Game Jam',
      'Dedicated sneak state and no default running',
      'Custom CCTV-style post-process effect',
    ],
    theme: { name: 'urban', color: '#4a5568' },
    media: [{ webm: '/media/tiptoe-thief.webm', mp4: '/media/tiptoe-thief.mp4', poster: '/media/tiptoe-thief.webp' }],
    photos: [
      { src: '/media/tiptoe-thief.webp', alt: 'Tiptoe Thief project thumbnail' },
      { src: '/media/tiptoe-living-room.webp', alt: 'CCTV view of the thief in the living room' },
      { src: '/media/tiptoe-bedroom.webp', alt: 'CCTV view of the thief in a bedroom' },
    ],
    links: [{ label: 'Play on itch.io', url: 'https://kaif006.itch.io' }],
  },
  {
    id: 'comic-fight',
    order: 5,
    title: 'Comic Fight',
    subtitle: '2.5D fighting game',
    date: 'Oct 2025',
    tech: ['Unity', 'C#', 'HLSL'],
    summary:
      'A 2.5D fighting game with a custom toon shader that combines Sobel outlines and cel shading, plus combo and hitbox systems.',
    highlights: [
      'Custom toon shader: Sobel edges plus cel shading',
      'Animation-triggered hitboxes',
      'Combo system with cooldowns',
    ],
    theme: { name: 'pale lemon mesa', color: '#e8d77a' },
    media: [{ webm: '/media/comic-fight.webm', mp4: '/media/comic-fight.mp4' }],
    links: [],
  },
]
