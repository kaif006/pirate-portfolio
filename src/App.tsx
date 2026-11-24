import { useRef, useState } from 'react';
import SceneCanvas from './scene/SceneCanvas';
import ContactForm from './ContactForm';
import ProjectPhotos from './ProjectPhotos';
import PortfolioChat from './PortfolioChat';
import { projects } from './data/projects';
import './App.css';

const skills = [
  { title: 'Languages', items: ['C#', 'C++', 'TypeScript', 'JavaScript', 'Python', 'SQL'] },
  { title: 'Games & graphics', items: ['Unity', 'Unreal Engine 5', 'Three.js', 'OpenGL', 'GLSL'] },
  { title: 'Web & backend', items: ['React', 'Django', 'Node.js', 'PostgreSQL', 'WebSockets'] },
  { title: 'Architecture', items: ['State machines', 'Event-driven systems', 'Deterministic simulation', 'Multiplayer networking'] },
];

export default function App() {
  const projectTrack = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <SceneCanvas projectTrack={projectTrack} chatOpen={chatOpen} />
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="wordmark" href="#about">doofenschmirtz evil inc<span>.</span></a>
        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#reel">Reel</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main">
        <section className="intro content-width" id="about" aria-labelledby="about-title">
          <div className="intro-copy">
            <p className="section-label">About me</p>
            <h1 id="about-title">M<span>.</span>Kaif</h1>
            <div className="intro-bio">
              <p className="intro-role">Game developer &amp; software engineer</p>
              <p>I’m a fourth-year computer science student in Karachi, Pakistan. I build games and software with an interest in graphics programming, multiplayer systems, and software architecture.</p>
              <a className="ink-button" href="#projects">Explore my work <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section className="paper-panel content-width" id="skills" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills &amp; technologies</h2>
          <div className="skills-grid">
            {skills.map(({ title, items }) => (
              <div className="skill-group" key={title}>
                <h3>{title}</h3>
                <ul className="tag-list" aria-label={title}>
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="paper-panel content-width project-reel" id="reel" aria-labelledby="reel-title">
          <h2 id="reel-title">Projects reel</h2>
          <video
            controls
            playsInline
            preload="none"
            width={1280}
            height={720}
            poster={`${import.meta.env.BASE_URL}media/projects-reel-poster.webp`}
            aria-labelledby="reel-title"
          >
            <source src={`${import.meta.env.BASE_URL}media/projects-reel-720p.mp4`} type="video/mp4" />
            <a href={`${import.meta.env.BASE_URL}media/projects-reel-720p.mp4`}>Download the projects reel</a>
          </video>
        </section>

        <section className="project-gallery" id="projects" aria-labelledby="projects-title">
          <div className="paper-panel content-width gallery-intro">
            <h2 id="projects-title">Projects &amp; achievements</h2>
            <p>Scroll past five islands to explore the projects, or jump to one below.</p>
            <ul className="project-links">
              {projects.map((project) => (
                <li key={project.id}>
                  <a href={`#${project.id}`}><span style={{ background: project.theme.color }} aria-hidden="true" />{project.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="content-width" ref={projectTrack}>
            {projects.map((project) => (
              <div className="project-stop" key={project.id}>
                <span className="project-anchor" id={project.id} />
                <div className="project-display">
                  <article className="project-card paper-panel" aria-labelledby={`${project.id}-title`} style={{ borderTopColor: project.theme.color }}>
                    <p className="section-label">{project.date}</p>
                    <h3 id={`${project.id}-title`}>{project.title}</h3>
                    <p className="project-subtitle">{project.subtitle}</p>
                    <p>{project.summary}</p>
                    <ul className="project-highlights">
                      {project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                    </ul>
                    <ul className="tag-list" aria-label="Technologies">
                      {project.tech.map((technology) => <li key={technology}>{technology}</li>)}
                    </ul>
                    {project.links.map(({ label, url }) => (
                      <a className="project-link" key={url} href={url}>{label} <span aria-hidden="true">↗</span></a>
                    ))}
                  </article>
                  {!!project.photos?.length && (
                    <ProjectPhotos title={project.title} photos={project.photos} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="paper-panel content-width" id="experience" aria-labelledby="experience-title">
          <h2 id="experience-title">Education &amp; experience</h2>
          <div className="experience-grid">
            <article className="experience-entry">
              <p className="section-label">Expected 2027</p>
              <h3>BS Computer Science</h3>
              <p className="entry-place">NED University of Engineering &amp; Technology</p>
              <p>Coursework includes data structures and algorithms, object-oriented programming, and computer graphics.</p>
            </article>
            <article className="experience-entry">
              <p className="section-label">February–March 2026</p>
              <h3>IT Department Intern</h3>
              <p className="entry-place">Karachi Development Authority</p>
              <p>Identified manual steps in the data pipeline and assisted with network maintenance, troubleshooting, and documentation.</p>
            </article>
            <article className="experience-entry">
              <p className="section-label">July 2025</p>
              <h3>Software Engineering Intern</h3>
              <p className="entry-place">NED University BCIT Department</p>
              <p>Built a Django backend and React frontend for an inventory system that tracks university resources.</p>
            </article>
          </div>
        </section>

        <section className="paper-panel content-width contact-panel" id="contact" aria-labelledby="contact-title">
          <div>
            <h2 id="contact-title">Contact</h2>
            <p>Have a project in mind? Send me a message or reach me directly.</p>
            <a className="contact-email" href="mailto:kaifjallalani@gmail.com">kaifjallalani@gmail.com</a>
            <ul className="contact-links">
              <li><a href="https://github.com/kaif006">GitHub</a></li>
              <li><a href="https://www.linkedin.com/in/kaif-j/">LinkedIn</a></li>
              <li><a href="https://kaif006.itch.io/">itch.io</a></li>
            </ul>
          </div>
          <ContactForm />
        </section>
      </main>

      <footer className="site-footer">
        <span>Muhammad Kaif</span>
        <span><a href="https://sketchfab.com/3d-models/gislinge-viking-boat-01098ad7973647a9b558f41d2ebc5193">Gislinge Viking Boat</a> by Opus Poly · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
        <span>Wave math inspired by <a href="https://www.youtube.com/watch?v=PH9q0HNBjT4">Acerola’s How Games Fake Water</a></span>
        <span>Water shader inspiration from <a href="https://cardadfar.github.io/japanese_water_shader/images/paper.pdf">Japanese-Style Toon-Based Water Shader</a> by Oscar Dadfar and Joel Welling</span>
        <span>Wave contour lines inspired by <a href="https://www.shadertoy.com/view/lltBWM">Contour lines on Shadertoy</a> by 8x</span>
      </footer>
      <PortfolioChat open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
