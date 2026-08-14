import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import Resume from './ui/Resume'
import Works from './ui/Works'
import LoadingScreen from './ui/LoadingScreen'
import { useStore } from './store'
import { getResumeDownloadUrl } from './data/resumeDownload'

type Lang = 'en' | 'zh'

const COPY = {
  en: {
    title: 'About Eric',
    paragraphs: ["I'm Eric Zhang — a Computer Science student and builder exploring AI, full-stack engineering, and game development. I enjoy turning ambitious ideas into playful, useful experiences."],
  },
  zh: {
    title: '关于 Eric',
    paragraphs: ['我是 Eric Zhang，一名计算机科学学生和创造者，正在探索 AI、全栈工程与游戏开发。我喜欢把有野心的想法做成有趣、好用的体验。'],
  },
}

function Backdrop() {
  const setActive = useStore((state) => state.setActive)
  return <mesh position={[0, 0, -40]} onClick={() => setActive(null)}><planeGeometry args={[600, 300]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
}

function Hero({ lang, cueOpacity }: { lang: Lang; cueOpacity: MotionValue<number> }) {
  const { title, paragraphs } = COPY[lang]
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'start start'] })
  const blur = useTransform(scrollYProgress, [0, 0.5], ['blur(0px)', 'blur(16px)'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -96])
  const bodyY = useTransform(scrollYProgress, [0, 1], [0, -52])
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ['0.01em', '0.42em'])
  return <section className="hero"><motion.div className="about" lang={lang} ref={ref} style={{ filter: blur, opacity }}><div className="about-intro"><motion.h1 className="about-title" style={{ y: titleY, letterSpacing }}>{title}</motion.h1>{paragraphs.map((paragraph) => <motion.p key={paragraph} className="about-body" style={{ y: bodyY }}>{paragraph}</motion.p>)}</div></motion.div><motion.div className="scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true"><span className="scroll-cue-label">{lang === 'en' ? 'SCROLL' : '向下滚动'}</span><span className="scroll-cue-track"><span className="scroll-cue-dot" /></span></motion.div></section>
}

function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  return <button className="lang-toggle" onClick={onToggle} aria-label="Switch language">{lang === 'en' ? 'EN' : '中文'}</button>
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const resumeUrl = getResumeDownloadUrl()
  const worksRef = useRef(null)
  const { scrollY } = useScroll()
  const { scrollYProgress: worksProgress } = useScroll({ target: worksRef, offset: ['start end', 'start center'] })
  const fogBg = useTransform(worksProgress, [0, 1], ['rgba(8, 11, 18, 0)', 'rgba(8, 11, 18, 0.41)'])
  const scrimOpacity = useTransform(scrollY, [0, 520], [0, 0.4])
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0])
  const railOpacity = useTransform(scrollY, [window.innerHeight * 0.5, window.innerHeight * 1.1], [0, 1])
  const chromeOpacity = useTransform(scrollY, [0, 280], [1, 0])
  return <><LoadingScreen /><div className="scene-bg"><Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [0, 5, 19], fov: 39, near: 0.1, far: 500 }} gl={{ antialias: false, stencil: false, depth: true, toneMapping: THREE.ACESFilmicToneMapping }}><color attach="background" args={['#f3c5d0']} /><Suspense fallback={null}><Backdrop /><Scene /></Suspense></Canvas></div><motion.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" /><motion.div className="stage-fog" style={{ background: fogBg }} aria-hidden="true" /><motion.div className="glass-rail" style={{ opacity: railOpacity }} aria-hidden="true" />{resumeUrl && <a className="resume-download" href={resumeUrl} aria-label="Download Eric Zhang's resume">{lang === 'en' ? 'Download Resume' : 'Download CV'}</a>}<LangToggle lang={lang} onToggle={() => setLang((current) => current === 'en' ? 'zh' : 'en')} /><motion.div className="hero-chrome" style={{ opacity: chromeOpacity }} aria-hidden="true"><div className="hero-frame" /><span className="hero-mark tl">+</span><span className="hero-mark tr">+</span><span className="hero-mark bl">+</span><span className="hero-mark br">+</span><div className="hero-meta hm-tl"><span className="hm-name">Yuhao “Eric” Zhang</span><span>Computer Science · McMaster University</span></div><div className="hero-meta hm-tr">Eric Zhang · Portfolio</div><div className="hero-meta hm-bl">AI · Build · Play</div><div className="hero-meta hm-right">Hamilton · Ontario</div></motion.div><NoiseOverlay /><main className="content"><Hero lang={lang} cueOpacity={cueOpacity} /><Resume lang={lang} /><Works lang={lang} innerRef={worksRef} /></main></>
}
