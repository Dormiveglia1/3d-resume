import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FOCUS_POINTS } from '../data/focusPoints'
import { loadResumeEntries, type Lang, type ResumeEntry } from '../data/resumeContent'

const EASE = [0.22, 1, 0.36, 1]
const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } }
const itemV = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } }
function field(entry: ResumeEntry, name: 'period' | 'place' | 'role' | 'points', lang: Lang) { return entry[`${name}_${lang}` as keyof ResumeEntry] as string | string[] }
function Entry({ entry, index, lang }: { entry: ResumeEntry; index: number; lang: Lang }) {
  const points = field(entry, 'points', lang) as string[]
  return <motion.div className="tl-entry" data-point={FOCUS_POINTS[index]} variants={containerV} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-12% 0px -12% 0px' }}><motion.span className="tl-dot" variants={itemV} /><div className="tl-body"><motion.div className="tl-period" variants={itemV}>{field(entry, 'period', lang)}</motion.div><motion.div className="tl-head" variants={itemV}><h3 className="tl-place">{field(entry, 'place', lang)}</h3></motion.div>{Boolean(field(entry, 'role', lang)) && <motion.div className="tl-role" variants={itemV}>{field(entry, 'role', lang)}</motion.div>}{points.length > 0 && <motion.ul className="tl-points" variants={itemV}>{points.map((point, i) => <li key={i}>{point}</li>)}</motion.ul>}</div></motion.div>
}
export default function Resume({ lang }: { lang: Lang }) {
  const [entries, setEntries] = useState<ResumeEntry[]>([])
  useEffect(() => { loadResumeEntries().then(setEntries) }, [])
  return <section className="resume" lang={lang}><motion.h2 className="resume-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>Résumé</motion.h2><div className="timeline">{entries.map((entry, index) => <Entry key={entry.id} entry={entry} index={index} lang={lang} />)}</div></section>
}
