import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

gsap.registerPlugin(ScrollTrigger)

/* ── helpers ──────────────────────────────────────────── */
const reveal = (el, vars = {}) =>
  gsap.fromTo(el,
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }, ...vars }
  )

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
function Navbar() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: -70, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 }
    )
  }, [])

  return (
    <nav ref={ref} className="navbar">
      <div className="section-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#111', letterSpacing: '-0.01em' }}>StudyGenie</span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 36 }}>
          {[
            { name: 'Features', href: '#features' },
            { name: 'How it Works', href: '#how-it-works' },
            { name: 'View', href: '#cta' }
          ].map(l => (
            <a key={l.name} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: '#666', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#111'}
              onMouseLeave={e => e.target.style.color = '#666'}>
              {l.name}
            </a>
          ))}
        </div>

        {/* CTA: GitHub Star Button */}
        <div>
          <a
            href="https://github.com/Rounak87/Study-Genie"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lime"
            style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>★ Star</span>
          </a>
        </div>
      </div>
    </nav>
  )
}

const WORDS = ['Anything.', 'DBMS.', 'DSA.', 'Computer Networks.']

function Typewriter() {
  const [wordIndex, setWordIndex] = React.useState(0)
  const [currentText, setCurrentText] = React.useState('')
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    const fullWord = WORDS[wordIndex] || WORDS[0]
    const delay = isDeleting ? 50 : 110

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1))
        if (currentText === fullWord) {
          setIsDeleting(true)
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1))
        if (currentText === '') {
          setIsDeleting(false)
          setWordIndex((prev) => (prev + 1) % WORDS.length)
        }
      }
    }, currentText === fullWord && !isDeleting ? 2500 : (currentText === '' && isDeleting ? 500 : delay))

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, wordIndex])

  return <span style={{ borderRight: '3px solid #7c3aed', paddingRight: '4px' }}>{currentText}</span>
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function Hero() {
  const headRef = useRef(null)
  const subRef = useRef(null)
  const ctaRef = useRef(null)
  const lottieRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.25 })
    tl.fromTo(headRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' })
      .fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .fromTo(lottieRef.current, { x: 60, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.9')
  }, [])

  return (
    <section className="hero-section section-wrap">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

        {/* Left */}
        <div>
          <h1 ref={headRef} style={{ fontSize: 'clamp(2.8rem, 5vw, 4.2rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#111', marginBottom: 24 }}>
            Upload. Learn.<br />
            Master<br />
            <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              <Typewriter />
            </span>
          </h1>

          <p ref={subRef} style={{ fontSize: 17, color: '#666', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            StudyGenie transforms your notes, PDFs, and slides into smart study materials — summaries, flashcards, quizzes, and personalized AI roadmaps. Built for students who want to learn smarter.
          </p>

          <div ref={ctaRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <a
              href="https://github.com/Rounak87/Study-Genie"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dark"
              style={{ padding: '14px 28px', fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
            >
              <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>View on GitHub</span>
            </a>
          </div>
        </div>

        {/* Right — Lottie + Floating elements */}
        <div ref={lottieRef} className="lottie-wrap float-1">
          <div className="lottie-bg" />
          
          {/* Floating Badges */}
          <div className="floating-tag float-2" style={{ top: '10%', left: '-5%', borderColor: 'rgba(124,58,237,0.15)' }}>
            <span style={{ fontSize: 16 }}>📝</span>
            <span>AI Summaries</span>
          </div>
          <div className="floating-tag float-3" style={{ top: '20%', right: '-5%', borderColor: 'rgba(200,230,76,0.2)' }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span>Flashcards</span>
          </div>
          <div className="floating-tag float-1" style={{ bottom: '15%', left: '-8%', borderColor: 'rgba(124,58,237,0.15)' }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <span>LSTM Analytics</span>
          </div>
          <div className="floating-tag float-2" style={{ bottom: '10%', right: '-2%', borderColor: 'rgba(6,182,212,0.15)' }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span>Gemini Tutor</span>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(200,230,76,0.08))', borderRadius: 28, padding: 8, position: 'relative', zIndex: 1, width: '100%' }}>
            <DotLottieReact src="/exams.lottie" loop autoplay style={{ width: '100%', height: 'auto', maxWidth: 520 }} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════ */
const STATS = [
  { n: '50K+', l: 'Active Students' },
  { n: '1M+', l: 'Study Materials Created' },
  { n: '95%', l: 'Quiz Success Rate' },
  { n: '24/7', l: 'AI Support Available' },
]

function Stats() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.to(ref.current.querySelectorAll('.stat-card'),
      { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } }
    )
  }, [])
  return (
    <section style={{ padding: '0 32px 40px' }}>
      <div ref={ref} className="section-wrap stats-grid" style={{ padding: 0 }}>
        {STATS.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-num">{s.n}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   TECH MARQUEE
═══════════════════════════════════════════════════════ */
const TECHS = [
  ['React 19', '#61dafb'], ['Node.js', '#68a063'], ['MongoDB Atlas', '#00ed64'],
  ['Google Gemini AI', '#4285f4'], ['PyTorch LSTM', '#ee4c2c'], ['FastAPI', '#009688'],
  ['Cloudflare R2', '#f6821f'], ['Redis / BullMQ', '#dc382d'],
]
const TECHS2 = [...TECHS, ...TECHS]

function TechStrip() {
  return (
    <section className="marquee-outer" style={{ marginBottom: 40 }}>
      <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 24 }}>
        Built with world-class technology
      </p>
      <div style={{ overflow: 'hidden' }}>
        <div className="marquee-inner">
          {TECHS2.map((t, i) => (
            <div key={i} className="tech-chip">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t[1], flexShrink: 0 }} />
              {t[0]}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   FEATURES GRID
═══════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: '📤', bg: '#eef2ff', title: 'Smart Document Upload', desc: 'Upload PDFs, images, and handwritten notes. Our OCR engine extracts text automatically.' },
  { icon: '✨', bg: '#f0fdf4', title: 'AI Study Guide', desc: 'Get personalized summaries, flashcards, and quizzes generated instantly from your content.' },
  { icon: '🤖', bg: '#fff7ed', title: 'AI Tutor Chat', desc: 'Ask any question about your material and get context-aware answers powered by Gemini AI.' },
  { icon: '🧠', bg: '#fdf4ff', title: 'Deep Knowledge Tracing', desc: 'Our LSTM model tracks your quiz performance and predicts mastery level — then adapts your path.' },
  { icon: '🗺️', bg: '#eff6ff', title: 'Adaptive Roadmaps', desc: 'Visual topic trees that track your progress, show what\'s next, and adjust as you learn.' },
  { icon: '🔬', bg: '#f0fdf4', title: 'Science Simulations', desc: 'Learn Physics, Chemistry, and Maths through interactive simulations embedded in the app.' },
]

function Features() {
  const titleRef = useRef(null)
  const gridRef = useRef(null)

  useEffect(() => {
    reveal(titleRef.current)
    gsap.to(gridRef.current.querySelectorAll('.feat-card'), {
      y: 0, opacity: 1, duration: 0.75, stagger: { amount: 0.5, from: 'start' }, ease: 'power3.out',
      scrollTrigger: { trigger: gridRef.current, start: 'top 85%' }
    })
  }, [])

  return (
    <section id="features" style={{ padding: '40px 0' }}>
      <div className="section-wrap">
        <div ref={titleRef} className="scroll-hidden" style={{ marginBottom: 56 }}>
          <span className="badge" style={{ marginBottom: 16 }}>🎯 Core Features</span>
          <h2 className="h2" style={{ marginTop: 10 }}>
            Everything you need<br />
            <span className="muted">to learn smarter.</span>
          </h2>
          <p style={{ marginTop: 16, fontSize: 16, color: '#777', maxWidth: 460, lineHeight: 1.7 }}>
            One platform. Every tool a student needs — from raw notes to mastery.
          </p>
        </div>

        <div ref={gridRef} className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card">
              <div className="feat-icon" style={{ background: f.bg }}>{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS — immersive scroll pinning stack
═══════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: '01 / 04', label: 'STEP 1 · UPLOAD', emoji: '📁',
    gradA: '#7c3aed', gradB: '#4c1d95',
    title: 'Upload Your Materials', accent: 'Start in Seconds',
    desc: 'Drag and drop any PDF, image, or text file. The system extracts text and stores it securely in Cloudflare R2.',
    bullets: ['PDF, PNG, JPG, TXT supported', 'Server-side OCR for handwritten notes', 'Stored securely in Cloudflare R2'],
  },
  {
    num: '02 / 04', label: 'STEP 2 · GENERATE', emoji: '⚡',
    gradA: '#2563eb', gradB: '#1e3a8a',
    title: 'AI Creates Study Materials', accent: 'Instantly, Automatically',
    desc: 'Google Gemini AI reads your document and generates a complete study kit — summary, flashcards, and a quiz.',
    bullets: ['Detailed / Concise / Bullets summary mode', 'Flip-card flashcards for every key concept', 'Quiz questions with instant feedback'],
  },
  {
    num: '03 / 04', label: 'STEP 3 · QUIZ', emoji: '🧠',
    gradA: '#059669', gradB: '#064e3b',
    title: 'Take the Adaptive Quiz', accent: 'Your Performance Matters',
    desc: 'Our LSTM model tracks correctness, time, and hints to gauge your mastery after each quiz attempt.',
    bullets: ['LSTM model trained on 10K+ interactions', 'Mastery probability score (0–100%)', 'Recommended difficulty: Easy / Medium / Hard'],
  },
  {
    num: '04 / 04', label: 'STEP 4 · GROW', emoji: '🚀',
    gradA: '#dc2626', gradB: '#7f1d1d',
    title: 'Get Your Learning Path', accent: 'Personalized Next Steps',
    desc: 'The AI combines your quiz score with the LSTM prediction to give you a step-by-step personalized plan.',
    bullets: ['Advance / Review Fundamentals / Practice More', 'Detailed action plan with next topics', 'Re-take quiz to track progress'],
  },
]



const UploadArt = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    {/* Card 1 */}
    <div className="float-1" style={{ width: 72, height: 96, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, transform: 'rotate(-10deg) translateX(-14px)', position: 'absolute', display: 'flex', flexDirection: 'column', padding: 10, gap: 5 }}>
      <div style={{ width: '40%', height: 2, background: 'rgba(255,255,255,0.25)', borderRadius: 4 }} />
      <div style={{ width: '80%', height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 4 }} />
      <div style={{ width: '60%', height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 4 }} />
    </div>
    {/* Card 2 */}
    <div className="float-2" style={{ width: 72, height: 96, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, transform: 'rotate(6deg) translateY(-4px)', position: 'absolute', display: 'flex', flexDirection: 'column', padding: 10, gap: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}>
      <div style={{ margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
)

const GenerateArt = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div className="float-1" style={{ width: 90, height: 90, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="float-2" style={{ width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 80%)', filter: 'blur(3px)' }} />
      <div className="float-3" style={{ position: 'absolute', width: 5, height: 5, background: '#fff', borderRadius: '50%', top: '20%', left: '30%' }} />
      <div className="float-1" style={{ position: 'absolute', width: 4, height: 4, background: '#fff', borderRadius: '50%', bottom: '25%', right: '20%' }} />
      <div className="float-2" style={{ position: 'absolute', width: 4, height: 4, background: '#fff', borderRadius: '50%', bottom: '40%', left: '15%' }} />
    </div>
  </div>
)

const QuizArt = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div className="float-1" style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="90" height="90" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#fff" strokeWidth="1.8" strokeDasharray="75, 100" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>85%</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>mastery</span>
      </div>
    </div>
  </div>
)

const GrowArt = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div className="float-1" style={{ width: 100, height: 70, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 70" fill="none">
        <path d="M10 60 L40 42 L68 22 L92 10" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M10 60 L40 42 L68 22 L92 10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="60" r="3" fill="#fff" />
        <circle cx="40" cy="42" r="3" fill="#fff" />
        <circle cx="68" cy="22" r="3" fill="#fff" />
        <circle cx="92" cy="10" r="4.5" fill="#c8e64c" />
      </svg>
    </div>
  </div>
)

function HowItWorks() {
  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const trackRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    reveal(titleRef.current)

    const mm = gsap.matchMedia()
    mm.add('(min-width: 769px)', () => {
      const cards = cardsRef.current.filter(Boolean)
      if (cards.length === 0) return

      // Set initial states
      cards.forEach((card, idx) => {
        if (idx > 0) {
          gsap.set(card, { yPercent: 110, scale: 0.98 })
        }
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=1500px', // Faster scroll stack speed
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      })

      cards.forEach((card, idx) => {
        if (idx === 0) return

        // Animate out previous card slightly
        tl.to(cards[idx - 1], {
          scale: 0.96,
          opacity: 0.65,
          yPercent: 0, // Keep in place (no upward shift) to avoid title overlaps
          duration: 1,
          ease: 'power1.inOut'
        }, `step-${idx}`)

        // Animate in current card
        tl.to(card, {
          yPercent: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power2.out'
        }, `step-${idx}`)
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="how-it-works" ref={containerRef} className="steps-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="section-wrap" style={{ maxWidth: '1280px', width: '100%' }}>
        <div ref={titleRef} className="scroll-hidden" style={{ marginBottom: 24, textAlign: 'center' }}>
          <span className="badge" style={{ marginBottom: 8 }}>📋 Four Steps</span>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#111' }}>
            Four Steps. <span style={{ color: '#888', fontWeight: 500 }}>Infinite Possibilities.</span>
          </h2>
        </div>

        <div ref={trackRef} className="steps-track">
          {STEPS.map((s, i) => (
            <div
              key={i}
              ref={el => cardsRef.current[i] = el}
              className="step-card"
              style={{ zIndex: i + 1 }}
            >
              {/* Visual panel with mesh pattern and animated glow */}
              <div className="step-visual" style={{ background: `linear-gradient(135deg, ${s.gradA}, ${s.gradB})`, position: 'relative', overflow: 'hidden' }}>
                <div className="visual-grid-overlay" />
                <div className="visual-glow-orb" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 2 }}>
                  <span className="step-label">{s.label}</span>
                  <span className="step-num">{s.num}</span>
                </div>
                
                {/* Minimalist abstract vector line art */}
                <div style={{ width: '100%', height: '140px', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i === 0 && <UploadArt />}
                  {i === 1 && <GenerateArt />}
                  {i === 2 && <QuizArt />}
                  {i === 3 && <GrowArt />}
                </div>

                <div className="step-url" style={{ position: 'relative', zIndex: 2 }}>studygenie.ai/learn</div>
              </div>

              {/* Content panel */}
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <div className="step-accent">{s.accent}</div>
                <div className="step-desc">{s.desc}</div>
                <ul className="step-bullets">
                  {s.bullets.map((b, j) => (
                    <li key={j}>
                      <span className="bullet-dot">●</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   LOTTIE SPOTLIGHT
═══════════════════════════════════════════════════════ */
function Spotlight() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current.querySelector('.spot-left'),
      { x: -60, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 78%' } }
    )
    gsap.fromTo(ref.current.querySelector('.spot-right'),
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 78%' } }
    )
  }, [])

  return (
    <section style={{ padding: '40px 0 80px' }}>
      <div className="section-wrap">
        <div ref={ref} className="spotlight-grid">
          <div className="spot-left spotlight-text">
            <span className="badge" style={{ marginBottom: 20 }}>🎓 Smart Learning</span>
            <h2 className="h2" style={{ marginTop: 10, marginBottom: 20 }}>
              Prepare smarter,<br />
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>not harder.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.75, marginBottom: 28 }}>
              StudyGenie's deep learning engine understands how you learn — tracking every quiz attempt, hint, and time taken to give you the most effective study path.
            </p>
            {[
              ['🔍', 'Upload any document — PDF, image, or handwritten note'],
              ['⚡', 'AI generates study materials in under 10 seconds'],
              ['📊', 'LSTM model adapts your roadmap to your performance'],
            ].map(([icon, text], i) => (
              <div key={i} className="checklist-item">
                <span className="checklist-icon">{icon}</span>
                <span className="checklist-text">{text}</span>
              </div>
            ))}
            <button className="btn-lime" style={{ marginTop: 28 }}>Try it Free →</button>
          </div>

          <div className="spot-right spotlight-lottie">
            <div className="float-1" style={{ width: '100%', maxWidth: 380, filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.15))' }}>
              <DotLottieReact src="/exams.lottie" loop autoplay style={{ width: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'B.Tech Student, IIT Delhi', av: '#7c3aed', stars: 5, text: 'I uploaded my entire semester\'s notes and StudyGenie generated flashcards in minutes. The adaptive quiz showed exactly where I was struggling.' },
  { name: 'Arjun Mehta', role: 'CA Aspirant', av: '#16a34a', stars: 5, text: 'The AI tutor is incredible. I ask questions about my material and get accurate, context-aware answers. It\'s like having a personal teacher available 24/7.' },
  { name: 'Aisha Khan', role: 'UPSC Preparation', av: '#ea580c', stars: 5, text: 'The personalized learning roadmap completely changed how I study. After each quiz, the AI tells me exactly what to review and what to advance on. My efficiency tripled.' },
]

function Testimonials() {
  const gridRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    reveal(titleRef.current)
    gsap.to(gridRef.current.querySelectorAll('.testi-card'), {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: gridRef.current, start: 'top 86%' }
    })
  }, [])

  return (
    <section style={{ padding: '80px 0' }}>
      <div className="section-wrap">
        <div ref={titleRef} className="scroll-hidden" style={{ marginBottom: 56, textAlign: 'center' }}>
          <span className="badge" style={{ marginBottom: 16 }}>💬 Student Stories</span>
          <h2 className="h2" style={{ marginTop: 10 }}>
            Real students,<br />
            <span className="muted">real results.</span>
          </h2>
        </div>

        <div ref={gridRef} className="testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">{'★'.repeat(t.stars)}</div>
              <p className="testi-text">"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="testi-avatar" style={{ background: t.av }}>{t.name[0]}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   CTA
═══════════════════════════════════════════════════════ */
function CTA() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: 60, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%' } }
    )
  }, [])

  return (
    <section id="cta" style={{ padding: '80px 0 120px' }}>
      <div className="section-wrap">
        <div ref={ref} className="cta-box">
          <div className="cta-blob" style={{ top: '-40px', left: '10%', width: 260, height: 260, background: 'rgba(124,58,237,0.22)' }} />
          <div className="cta-blob" style={{ bottom: '-40px', right: '10%', width: 220, height: 220, background: 'rgba(200,230,76,0.1)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="badge" style={{ marginBottom: 20, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: '#c8e64c' }}>🚀 Free to Start</span>
            <h2 className="cta-title" style={{ marginTop: 10 }}>
              Start your AI learning<br />
              journey <span style={{ color: '#c8e64c' }}>today.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
              Join 50,000+ students using StudyGenie to study faster, score higher, and master any subject with the power of AI.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/Rounak87/Study-Genie"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lime"
                style={{ fontSize: 16, padding: '16px 36px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
              >
                <svg role="img" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="footer">
      <div className="section-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>StudyGenie</span>
          <span style={{ color: '#aaa', fontSize: 13, marginLeft: 16 }}>© 2025 All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Features', 'How it Works', 'Privacy', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#111'}
              onMouseLeave={e => e.target.style.color = '#888'}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════ */
export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f4ee' }}>
      <Navbar />
      <Hero />
      
      {/* Curved Wrapper Container for Features, Steps & Spotlight */}
      <div className="curved-wrapper" style={{ marginTop: 0 }}>
        <TechStrip />
        <Features />
        <HowItWorks />
        <Spotlight />
      </div>

      <CTA />
      <Footer />
    </div>
  )
}