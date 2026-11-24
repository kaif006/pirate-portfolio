import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Scene3D } from './Scene3D';

type SceneCanvasProps = {
  projectTrack: RefObject<HTMLDivElement | null>;
  chatOpen: boolean;
};

export default function SceneCanvas({ projectTrack, chatOpen }: SceneCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene3D | null>(null);

  useEffect(() => {
    if (!ref.current || !projectTrack.current) return;
    const scene3d = new Scene3D(ref.current, projectTrack.current);
    sceneRef.current = scene3d;
    return () => {
      scene3d.dispose();
      sceneRef.current = null;
    };
  }, [projectTrack]);

  useEffect(() => {
    sceneRef.current?.setChatOpen(chatOpen);
  }, [chatOpen, projectTrack]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
