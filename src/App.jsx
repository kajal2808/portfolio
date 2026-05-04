import { useState, useEffect, useRef, lazy, Suspense } from "react";

// ─── Inline styles (CSS-in-JS via style tag injection) ───────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0b;
    --surface: #9b9bc9;
    --border: #1e1e24;
    --accent: #c8f135;
    --accent2: #7b61ff;
    --text: #e8e8ef;
    --muted: #6b6b7a;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-display);
    overflow-x: hidden;
    cursor: none;
  }

  ::selection { background: var(--accent); color: #000; }

  /* Custom cursor */
  .cursor {
    width: 12px; height: 12px;
    background: var(--accent);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.15s ease, opacity 0.2s;
    transform: translate(-50%, -50%);
  }
  .cursor-ring {
    width: 36px; height: 36px;
    border: 1.5px solid var(--accent);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9998;
    transition: left 0.08s ease, top 0.08s ease, transform 0.15s ease;
    transform: translate(-50%, -50%);
    opacity: 0.5;
  }
  .cursor.hover { transform: translate(-50%, -50%) scale(2.5); background: var(--accent2); }
  .cursor-ring.hover { transform: translate(-50%, -50%) scale(1.4); border-color: var(--accent2); opacity: 1; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

  /* Nav */
  nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 1.4rem 3rem;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid transparent;
    transition: border-color 0.3s, background 0.3s, backdrop-filter 0.3s;
  }
  nav.scrolled {
    background: rgba(10,10,11,0.85);
    backdrop-filter: blur(20px);
    border-color: var(--border);
  }
  .nav-logo {
    font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em;
    color: var(--text);
    text-decoration: none;
  }
  .nav-logo span { color: var(--accent); }
  .nav-links { display: flex; gap: 2.5rem; list-style: none; }
  .nav-links a {
    font-size: 0.78rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
    position: relative;
  }
  .nav-links a::after {
    content: ''; position: absolute; bottom: -4px; left: 0;
    width: 0; height: 1px; background: var(--accent);
    transition: width 0.25s ease;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-links a:hover::after { width: 100%; }

  /* Mobile nav toggle */
  .nav-toggle { display: none; background: none; border: none; cursor: none; flex-direction: column; gap: 5px; }
  .nav-toggle span { display: block; width: 22px; height: 2px; background: var(--text); transition: all 0.3s; }
  @media (max-width: 768px) {
    nav { padding: 1.2rem 1.5rem; }
    .nav-links { display: none; }
    .nav-links.open {
      display: flex; flex-direction: column; gap: 1.5rem;
      position: fixed; inset: 0; background: var(--bg);
      align-items: center; justify-content: center;
      font-size: 1.4rem;
    }
    .nav-toggle { display: flex; }
  }

  /* Hero */
  .hero {
    min-height: 100vh;
    display: flex; align-items: center;
    padding: 6rem 3rem 4rem;
    position: relative; overflow: hidden;
  }
  @media (max-width: 768px) { .hero { padding: 5rem 1.5rem 3rem; } }
  .hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.4;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  }
  .hero-glow {
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(200,241,53,0.07) 0%, transparent 70%);
    top: 10%; left: 50%; transform: translateX(-50%);
    pointer-events: none;
  }
  .hero-content { position: relative; max-width: 900px; }
  .hero-eyebrow {
    font-family: var(--font-mono); font-size: 0.75rem;
    color: var(--accent); letter-spacing: 0.2em;
    text-transform: uppercase; margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 0.8rem;
  }
  .hero-eyebrow::before {
    content: ''; display: inline-block;
    width: 32px; height: 1px; background: var(--accent);
  }
  .hero-name {
    font-size: clamp(3.5rem, 10vw, 8rem);
    font-weight: 800; line-height: 0.92;
    letter-spacing: -0.04em;
    margin-bottom: 1.5rem;
  }
  .hero-name .line2 { color: transparent; -webkit-text-stroke: 1px rgba(232,232,239,0.3); }
  .hero-role {
    font-size: clamp(1rem, 2.5vw, 1.3rem);
    color: var(--muted); max-width: 480px;
    line-height: 1.7; margin-bottom: 3rem;
    font-weight: 400;
  }
  .hero-cta {
    display: flex; gap: 1rem; flex-wrap: wrap;
  }
  .btn-primary {
    padding: 0.9rem 2rem;
    background: var(--accent); color: #000;
    font-family: var(--font-display); font-weight: 700;
    font-size: 0.85rem; letter-spacing: 0.08em;
    text-transform: uppercase; border: none;
    cursor: none; text-decoration: none;
    display: inline-flex; align-items: center; gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  }
  .btn-primary:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 var(--accent2); }
  .btn-outline {
    padding: 0.9rem 2rem;
    background: transparent; color: var(--text);
    font-family: var(--font-display); font-weight: 600;
    font-size: 0.85rem; letter-spacing: 0.08em;
    text-transform: uppercase; border: 1px solid var(--border);
    cursor: none; text-decoration: none;
    display: inline-flex; align-items: center; gap: 0.5rem;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); background: rgba(200,241,53,0.04); }

  .hero-stats {
    display: flex; gap: 3rem; margin-top: 5rem;
    border-top: 1px solid var(--border); padding-top: 2.5rem;
    flex-wrap: wrap;
  }
  .stat-val { font-size: 2.2rem; font-weight: 800; color: var(--accent); }
  .stat-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 0.2rem; }

  /* Section base */
  section { padding: 8rem 3rem; }
  @media (max-width: 768px) { section { padding: 5rem 1.5rem; } }
  .section-tag {
    font-family: var(--font-mono); font-size: 0.7rem;
    color: var(--accent); letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 0.8rem;
    display: flex; align-items: center; gap: 0.6rem;
  }
  .section-tag::before { content: '//'; opacity: 0.5; }
  .section-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800; letter-spacing: -0.03em;
    line-height: 1.05; margin-bottom: 1.5rem;
  }
  .section-divider {
    width: 48px; height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    margin-bottom: 3rem;
  }

  /* About */
  .about-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; max-width: 1100px; }
  @media (max-width: 900px) { .about-inner { grid-template-columns: 1fr; gap: 3rem; } }
  .about-img-wrap {
    position: relative; aspect-ratio: 3/4;
    max-height: 500px;
  }
  .about-img-bg {
    position: absolute; inset: 12px 0 0 12px;
    border: 1px solid var(--accent); opacity: 0.4;
    border-radius: 2px;
  }
  .about-img-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, var(--surface) 0%, #1a1a22 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 5rem; border-radius: 2px;
    border: 1px solid var(--border);
    position: relative; z-index: 1;
  }
  .about-img-tag {
    position: absolute; bottom: -16px; right: -16px;
    background: var(--accent); color: #000;
    font-family: var(--font-mono); font-size: 0.7rem;
    padding: 0.5rem 1rem; font-weight: 500; z-index: 2;
  }
  .about-text p { color: var(--muted); line-height: 1.9; margin-bottom: 1.2rem; font-size: 0.95rem; }
  .about-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 2rem; }
  .chip {
    padding: 0.35rem 0.9rem;
    border: 1px solid var(--border);
    font-family: var(--font-mono); font-size: 0.7rem;
    color: var(--muted); letter-spacing: 0.05em;
    border-radius: 2px; transition: border-color 0.2s, color 0.2s;
  }
  .chip:hover { border-color: var(--accent); color: var(--accent); }

  /* Projects */
  .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5px; margin-top: 1rem; }
  .project-card {
    background: var(--surface);
    padding: 2.5rem;
    border: 1px solid var(--border);
    position: relative; overflow: hidden;
    transition: border-color 0.3s, transform 0.3s;
    cursor: none;
  }
  .project-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(200,241,53,0.03) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .project-card:hover { border-color: rgba(200,241,53,0.3); transform: translateY(-3px); }
  .project-card:hover::before { opacity: 1; }
  .project-num {
    font-family: var(--font-mono); font-size: 0.65rem;
    color: var(--accent); letter-spacing: 0.1em; margin-bottom: 1.2rem;
  }
  .project-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.8rem; }
  .project-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.7; margin-bottom: 1.5rem; }
  .project-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 2rem; }
  .project-tag {
    padding: 0.2rem 0.6rem; background: rgba(200,241,53,0.07);
    color: var(--accent); font-family: var(--font-mono);
    font-size: 0.65rem; border-radius: 2px; letter-spacing: 0.05em;
  }
  .project-links { display: flex; gap: 1rem; }
  .project-link {
    font-family: var(--font-mono); font-size: 0.7rem;
    color: var(--muted); text-decoration: none;
    letter-spacing: 0.08em;
    transition: color 0.2s;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .project-link:hover { color: var(--accent); }

  /* Featured project */
  .project-card.featured {
    grid-column: 1 / -1;
    display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;
  }
  @media (max-width: 768px) { .project-card.featured { grid-template-columns: 1fr; } }
  .featured-visual {
    aspect-ratio: 16/9; background: linear-gradient(135deg, #0f0f18 0%, #1a1a2e 50%, #0f0f18 100%);
    border-radius: 2px; overflow: hidden; position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  .featured-visual .mock-browser {
    width: 90%; height: 80%; background: var(--bg);
    border-radius: 4px; border: 1px solid var(--border);
    overflow: hidden;
  }
  .mock-browser-bar {
    height: 22px; background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 5px; padding: 0 10px;
  }
  .mock-dot { width: 6px; height: 6px; border-radius: 50%; }
  .mock-content { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
  .mock-line { height: 6px; background: var(--border); border-radius: 3px; }

  /* Skills */
  .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
  .skill-category {
    background: var(--surface); border: 1px solid var(--border);
    padding: 2rem; border-radius: 2px; transition: border-color 0.3s;
  }
  .skill-category:hover { border-color: rgba(200,241,53,0.25); }
  .skill-cat-icon { font-size: 1.8rem; margin-bottom: 1rem; }
  .skill-cat-name { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.2rem; }
  .skill-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .skill-item {
    font-family: var(--font-mono); font-size: 0.72rem;
    color: var(--muted); padding: 0.3rem 0.7rem;
    border: 1px solid var(--border); border-radius: 2px;
    transition: all 0.2s;
  }
  .skill-item:hover { border-color: var(--accent2); color: #a89dff; }

  /* Skills bars */
  .skill-bars { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 3rem; }
  .skill-bar-row { display: flex; align-items: center; gap: 1rem; }
  .skill-bar-name { font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted); width: 100px; flex-shrink: 0; }
  .skill-bar-track { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .skill-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 2px;
    transform: scaleX(0); transform-origin: left;
    transition: transform 1.2s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .skill-bar-fill.animated { transform: sc(1); }
  .skill-bar-pct { font-family: var(--font-mono); font-size: 0.65rem; color: var(--accent); width: 32px; text-align: right; }

  /* Resume */
  .resume-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; max-width: 1000px; }
  @media (max-width: 768px) { .resume-inner { grid-template-columns: 1fr; gap: 3rem; } }
  .timeline { position: relative; }
  .timeline::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 1px; background: var(--border);
  }
  .timeline-item { padding-left: 2rem; position: relative; margin-bottom: 2.5rem; }
  .timeline-item::before {
    content: ''; position: absolute; left: -4px; top: 6px;
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--accent); border: 2px solid var(--bg);
  }
  .timeline-period { font-family: var(--font-mono); font-size: 0.65rem; color: var(--accent); letter-spacing: 0.1em; margin-bottom: 0.4rem; }
  .timeline-role { font-weight: 700; font-size: 1rem; margin-bottom: 0.2rem; }
  .timeline-company { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.8rem; }
  .timeline-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.7; }
  .resume-cta { margin-top: 4rem; }

  /* Contact */
  .contact-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; max-width: 1000px; align-items: start; }
  @media (max-width: 768px) { .contact-inner { grid-template-columns: 1fr; gap: 3rem; } }
  .contact-info p { color: var(--muted); line-height: 1.8; font-size: 0.9rem; margin-bottom: 2rem; }
  .contact-links { display: flex; flex-direction: column; gap: 1rem; }
  .contact-link-row {
    display: flex; align-items: center; gap: 1rem;
    padding: 1rem 1.2rem; border: 1px solid var(--border);
    text-decoration: none; color: var(--text);
    transition: border-color 0.2s, transform 0.2s;
    border-radius: 2px;
  }
  .contact-link-row:hover { border-color: var(--accent); transform: translateX(4px); }
  .contact-link-icon { font-size: 1.1rem; }
  .contact-link-label { font-size: 0.8rem; font-weight: 600; }
  .contact-link-sub { font-family: var(--font-mono); font-size: 0.65rem; color: var(--muted); }
  .contact-form { display: flex; flex-direction: column; gap: 1.2rem; }
  .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .form-label { font-family: var(--font-mono); font-size: 0.65rem; color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase; }
  .form-input, .form-textarea {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-family: var(--font-display); font-size: 0.9rem;
    padding: 0.8rem 1rem; outline: none; border-radius: 2px;
    transition: border-color 0.2s;
  }
  .form-input:focus, .form-textarea:focus { border-color: var(--accent); }
  .form-textarea { resize: vertical; min-height: 120px; }
  .form-status { font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent); }

  /* Footer */
  footer {
    padding: 3rem; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-wrap: gap;
    gap: 1rem;
  }
  .footer-copy { font-family: var(--font-mono); font-size: 0.65rem; color: var(--muted); }
  .footer-back {
    font-family: var(--font-mono); font-size: 0.65rem; color: var(--muted);
    text-decoration: none; letter-spacing: 0.1em;
    transition: color 0.2s;
  }
  .footer-back:hover { color: var(--accent); }

  /* Fade-in animation */
  .fade-up {
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }
  .fade-up:nth-child(2) { transition-delay: 0.1s; }
  .fade-up:nth-child(3) { transition-delay: 0.2s; }
  .fade-up:nth-child(4) { transition-delay: 0.3s; }

  @media (max-width: 768px) {
    footer { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
  }
`;

// ─── Data ────────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    featured: true,
    num: "00",
    title: "NeuralCanvas — AI Art Platform",
    desc: "A full-stack generative art platform where users craft, share, and remix AI-generated visuals. Built with real-time collaboration and a custom prompt engineering toolkit.",
    tags: ["React", "Node.js", "WebSockets", "Stable Diffusion API", "PostgreSQL"],
    github: "#",
    live: "#",
  },
  {
    num: "01",
    title: "Orbit — Task Intelligence",
    desc: "Smart project management tool that uses ML to predict task durations, surface blockers, and auto-prioritize backlogs across teams.",
    tags: ["Next.js", "Python", "scikit-learn", "Supabase"],
    github: "#",
    live: "#",
  },
  {
    num: "02",
    title: "Seismic — Design System",
    desc: "A comprehensive, accessible component library with 60+ components, dark/light themes, and full Figma token sync.",
    tags: ["React", "TypeScript", "Storybook", "CSS Variables"],
    github: "#",
    live: "#",
  },
  {
    num: "03",
    title: "Ledge — Finance Tracker",
    desc: "Personal finance dashboard with bank sync, spending intelligence, and beautiful data visualisations built with D3.",
    tags: ["React", "D3.js", "Plaid API", "Express"],
    github: "#",
    live: "#",
  },
];

const SKILL_CATEGORIES = [
  { icon: "⚡", name: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "D3.js", "Vue 3"] },
  { icon: "🛠", name: "Backend", items: ["Node.js", "Express", "Python", "FastAPI", "GraphQL", "REST APIs", "WebSockets"] },
  { icon: "🗄", name: "Data & DB", items: ["PostgreSQL", "MongoDB", "Redis", "Supabase", "Prisma", "SQL", "Vector DBs"] },
  { icon: "🚀", name: "DevOps & Tools", items: ["Docker", "CI/CD", "AWS", "Vercel", "Git", "Webpack", "Vite"] },
];

const SKILL_BARS = [
  { name: "React / TS", pct: 95 },
  { name: "Node.js", pct: 88 },
  { name: "Python", pct: 80 },
  { name: "UI / UX", pct: 85 },
  { name: "DevOps", pct: 72 },
];

const EXPERIENCE = [
  { period: "2022 – Present", role: "Senior Frontend Engineer", company: "Moonbeam Labs", desc: "Lead the frontend architecture for a B2B SaaS product serving 40k+ users. Reduced bundle size 60% and improved Lighthouse score from 54 → 96." },
  { period: "2020 – 2022", role: "Full-Stack Developer", company: "Hive Creative", desc: "Built end-to-end features for 12 client products spanning e-commerce, fintech, and media. Owned CI/CD pipelines and code review culture." },
  { period: "2018 – 2020", role: "Frontend Developer", company: "Pixelcraft Studio", desc: "Developed interactive campaigns for Fortune 500 brands. Specialised in WebGL experiences and performance-critical animations." },
];

const EDUCATION = [
  { period: "2014 – 2018", role: "B.Sc. Computer Science", company: "University of Technology", desc: "Graduated with First Class Honours. Thesis: 'Adaptive UI Generation using Reinforcement Learning.'" },
  { period: "2023", role: "AWS Certified Developer", company: "Amazon Web Services", desc: "Associate-level certification covering cloud architecture, serverless, and deployment best practices." },
  { period: "2022", role: "Meta Frontend Developer", company: "Coursera / Meta", desc: "Professional certificate covering advanced React patterns, accessibility, and performance optimisation." },
];

// ─── Utility hooks ─────────────────────────────────────────────────────────
function useIntersection(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

// ─── Components ──────────────────────────────────────────────────────────────
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const onMove = (e) => {
      if (dotRef.current) { dotRef.current.style.left = e.clientX + "px"; dotRef.current.style.top = e.clientY + "px"; }
      if (ringRef.current) { ringRef.current.style.left = e.clientX + "px"; ringRef.current.style.top = e.clientY + "px"; }
    };
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("a,button,.project-card,.skill-item,.chip,.contact-link-row").forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <>
      <div ref={dotRef} className={`cursor${hovered ? " hover" : ""}`} />
      <div ref={ringRef} className={`cursor-ring${hovered ? " hover" : ""}`} />
    </>
  );
}

function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = ["about", "projects", "skills", "resume", "contact"];
  return (
    <nav className={scrolled ? "scrolled" : ""}>
      <a className="nav-logo" href="#hero">Kajal<span>.</span>dev</a>
      <ul className={`nav-links${open ? " open" : ""}`}>
        {links.map(l => (
          <li key={l}><a href={`#${l}`} onClick={() => setOpen(false)}>{l}</a></li>
        ))}
      </ul>
      <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
    </nav>
  );
}

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-content">
        <div className="hero-eyebrow">Available for work · Remote</div>
        <h1 className="hero-name">
          <div>Kajal</div>
          <div className="line2">Mudaliar</div>
        </h1>
        <p className="hero-role">
          Full-Stack Engineer crafting performant, beautiful digital products.
          Passionate about design systems, AI interfaces, and the open web.
        </p>
        <div className="hero-cta">
          <a href="#projects" className="btn-primary">View Projects ↗</a>
          <a href="#contact" className="btn-outline">Get in Touch</a>
        </div>
        <div className="hero-stats">
          {[["6+", "Years XP"], ["40+", "Projects"], ["12", "Happy Clients"], ["100%", "Remote"]].map(([v, l]) => (
            <div key={l}>
              <div className="stat-val">{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <section id="about" ref={ref}>
      <div className={`fade-up${visible ? " visible" : ""}`}>
        <div className="section-tag">About Me</div>
        <h2 className="section-title">Designer who codes.<br />Engineer who designs.</h2>
        <div className="section-divider" />
      </div>
      <div className="about-inner">
        <div className={`fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.15s" }}>
          <div className="about-img-wrap">
            <div className="about-img-bg" />
            <div className="about-img-placeholder">👨‍💻</div>
            <div className="about-img-tag">Open to opportunities</div>
          </div>
        </div>
        <div className={`about-text fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.25s" }}>
          <p>
            Hey! I'm Kajal — a full-stack engineer with 6 years of experience building products people actually love to use. I bridge the gap between engineering rigour and design sensibility.
          </p>
          <p>
            My sweet spot is React ecosystems, node backends, and anything that requires making complex data feel simple and beautiful. I care deeply about performance, accessibility, and code that future-me won't hate.
          </p>
          <p>
            When not shipping features, I'm contributing to open source, writing on my technical blog, or experimenting with generative art and creative coding.
          </p>
          <div className="about-chips">
            {["TypeScript", "React", "Node.js", "Python", "AWS", "Open Source", "Creative Coding", "Accessibility"].map(t => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <section id="projects" ref={ref} style={{ background: "linear-gradient(180deg, var(--bg) 0%, #0c0c10 100%)" }}>
      <div className={`fade-up${visible ? " visible" : ""}`}>
        <div className="section-tag">Work</div>
        <h2 className="section-title">Selected Projects</h2>
        <div className="section-divider" />
      </div>
      <div className="projects-grid">
        {PROJECTS.map((p, i) => (
          <div key={p.num} className={`project-card fade-up${visible ? " visible" : ""}${p.featured ? " featured" : ""}`} style={{ transitionDelay: `${i * 0.1}s` }}>
            {p.featured && (
              <div className="featured-visual">
                <div className="mock-browser">
                  <div className="mock-browser-bar">
                    <div className="mock-dot" style={{ background: "#ff5f57" }} />
                    <div className="mock-dot" style={{ background: "#febc2e" }} />
                    <div className="mock-dot" style={{ background: "#28c840" }} />
                  </div>
                  <div className="mock-content">
                    {[85, 60, 75, 40, 90, 55].map((w, j) => (
                      <div key={j} className="mock-line" style={{ width: `${w}%`, opacity: 0.4 + j * 0.08 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="project-num">Project {p.num}</div>
              <div className="project-title">{p.title}</div>
              <div className="project-desc">{p.desc}</div>
              <div className="project-tags">{p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}</div>
              <div className="project-links">
                <a href={p.github} className="project-link">⌥ GitHub</a>
                <a href={p.live} className="project-link">↗ Live Demo</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skills() {
  const ref = useRef(null);
  const barsRef = useRef(null);
  const visible = useIntersection(ref);
  const barsVisible = useIntersection(barsRef);
  return (
    <section id="skills" ref={ref}>
      <div className={`fade-up${visible ? " visible" : ""}`}>
        <div className="section-tag">Expertise</div>
        <h2 className="section-title">Skills & Tools</h2>
        <div className="section-divider" />
      </div>
      <div className="skills-grid">
        {SKILL_CATEGORIES.map((cat, i) => (
          <div key={cat.name} className={`skill-category fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: `${i * 0.1}s` }}>
            <div className="skill-cat-icon">{cat.icon}</div>
            <div className="skill-cat-name">{cat.name}</div>
            <div className="skill-list">
              {cat.items.map(s => <span key={s} className="skill-item">{s}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div className="skill-bars" ref={barsRef}>
        {SKILL_BARS.map((s, i) => (
          <div key={s.name} className="skill-bar-row">
            <span className="skill-bar-name">{s.name}</span>
            <div className="skill-bar-track">
              <div
                className={`skill-bar-fill${barsVisible ? " animated" : ""}`}
                style={{ width: `${s.pct}%`, transitionDelay: `${i * 0.12}s` }}
              />
            </div>
            <span className="skill-bar-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Resume() {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <section id="resume" ref={ref} style={{ background: "var(--surface)" }}>
      <div className={`fade-up${visible ? " visible" : ""}`}>
        <div className="section-tag">Résumé</div>
        <h2 className="section-title">Experience &<br />Education</h2>
        <div className="section-divider" />
      </div>
      <div className="resume-inner">
        <div className={`fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.1s" }}>
          <div className="section-tag" style={{ marginBottom: "1.5rem" }}>Work History</div>
          <div className="timeline">
            {EXPERIENCE.map(e => (
              <div key={e.role} className="timeline-item">
                <div className="timeline-period">{e.period}</div>
                <div className="timeline-role">{e.role}</div>
                <div className="timeline-company">{e.company}</div>
                <div className="timeline-desc">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
          <div className="section-tag" style={{ marginBottom: "1.5rem" }}>Education</div>
          <div className="timeline">
            {EDUCATION.map(e => (
              <div key={e.role} className="timeline-item">
                <div className="timeline-period">{e.period}</div>
                <div className="timeline-role">{e.role}</div>
                <div className="timeline-company">{e.company}</div>
                <div className="timeline-desc">{e.desc}</div>
              </div>
            ))}
          </div>
          <div className="resume-cta">
            <a href="#" className="btn-primary">Download CV ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const handleSubmit = () => {
    setStatus("Message sent! I'll reply within 24hrs ✓");
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setStatus(""), 4000);
  };
  return (
    <section id="contact" ref={ref}>
      <div className={`fade-up${visible ? " visible" : ""}`}>
        <div className="section-tag">Get in Touch</div>
        <h2 className="section-title">Let's Build<br />Something Great</h2>
        <div className="section-divider" />
      </div>
      <div className="contact-inner">
        <div className={`contact-info fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.1s" }}>
          <p>I'm currently open to full-time roles and interesting freelance projects. If you have an idea you want to bring to life, let's talk.</p>
          <div className="contact-links">
            {[
              { icon: "📧", label: "Email", sub: "Kajalmudaliar@gmail.com", href: "mailto:Kajalmudaliar@gmail.com" },
              { icon: "💼", label: "LinkedIn", sub: "/in/kajalmudaliar", href: "#" },
              { icon: "🐙", label: "GitHub", sub: "kajal2808", href: "#" },
              { icon: "🐦", label: "Twitter", sub: "@kajalm", href: "#" },
            ].map(l => (
              <a key={l.label} href={l.href} className="contact-link-row">
                <span className="contact-link-icon">{l.icon}</span>
                <div>
                  <div className="contact-link-label">{l.label}</div>
                  <div className="contact-link-sub">{l.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className={`contact-form fade-up${visible ? " visible" : ""}`} style={{ transitionDelay: "0.2s" }}>
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" type="email" />
          </div>
          <div className="form-field">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell me about your project..." />
          </div>
          {status && <div className="form-status">{status}</div>}
          <button className="btn-primary" onClick={handleSubmit} style={{ alignSelf: "flex-start" }}>Send Message →</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <span className="footer-copy">© 2025 Kajal Mudaliar — Built with React + ❤️</span>
      <a href="#hero" className="footer-back">↑ Back to top</a>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return (
    <>
      <Cursor />
      <Nav />
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Resume />
      <Contact />
      <Footer />
    </>
  );
}
