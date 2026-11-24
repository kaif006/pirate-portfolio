import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ProjectPhoto } from './data/projects';

export default function ProjectPhotos({ title, photos }: { title: string; photos: ProjectPhoto[] }) {
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  const count = photos.length;
  const url = (src: string) => `${import.meta.env.BASE_URL}${src.slice(1)}`;

  function move(step: number) {
    setIndex(current => (current + step + count) % count);
  }

  function handleArrow(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  }

  return (
    <section className="project-photos" aria-label={`${title} photos`} onKeyDown={handleArrow}>
      <div className="project-photo-stage">
        <img src={url(photo.src)} alt={photo.alt} />
      </div>
      <nav className="project-photo-controls" aria-label="Photo navigation">
        <button type="button" className="photo-arrow" aria-label="Previous photo" onClick={() => move(-1)}>←</button>
        <div className="project-thumbnails">
          {photos.map((item, photoIndex) => (
            <button
              type="button"
              key={item.src}
              aria-label={`Photo ${photoIndex + 1}: ${item.alt}`}
              aria-pressed={index === photoIndex}
              onClick={() => setIndex(photoIndex)}
            >
              <img src={url(item.src)} alt="" />
            </button>
          ))}
        </div>
        <button type="button" className="photo-arrow" aria-label="Next photo" onClick={() => move(1)}>→</button>
      </nav>
      <p className="photo-count" aria-live="polite">{index + 1} / {count}</p>
    </section>
  );
}
