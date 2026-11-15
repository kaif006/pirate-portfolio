import SceneCanvas from './scene/SceneCanvas';

export default function App() {
  return (
    <>
      <SceneCanvas />
      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* tall scrolling content and overlays go here */}
      </main>
    </>
  );
}
