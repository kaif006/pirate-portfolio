import { useEffect, useRef } from 'react';
import { Scene3D } from './Scene3D';

export default function SceneCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene3d = new Scene3D(ref.current!);
    return () => scene3d.dispose(); // React dev mode mounts twice, so clean up
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
}
