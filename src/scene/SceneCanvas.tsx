import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Scene3D } from './Scene3D';

export default function SceneCanvas({ projectTrack }: { projectTrack: RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !projectTrack.current) return;
    const scene3d = new Scene3D(ref.current, projectTrack.current);
    return () => scene3d.dispose(); // React dev mode mounts twice, so clean up
  }, [projectTrack]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
