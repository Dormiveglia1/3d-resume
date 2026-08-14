import { type FormEvent, useEffect, useState } from 'react'
import { FALLBACK_RESUME, type ResumeEntry } from './data/resumeContent'
import { fallbackWorksForAdmin, loadWorksForAdmin, type ManagedWorkItem, type ManagedWorkSection } from './data/worksContent'
import { supabase, supabaseEnabled } from './lib/supabase'

const focusKeys = ['focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5']
const emptySection = (i: number): ManagedWorkSection => ({ id: crypto.randomUUID(), no: `${i + 1}`.padStart(2, '0'), sort_order: i + 1, title: '', tagline: '', footer: '', coverUrl: '', awards: [], published: true, items: [], title_en: '', title_zh: '', tagline_en: '', tagline_zh: '', footer_en: '', footer_zh: '' })
const emptyWork = (sectionId: string, i: number): ManagedWorkItem => ({ id: crypto.randomUUID(), section_id: sectionId, sort_order: i + 1, title_en: '', title_zh: '', meta_en: '', meta_zh: '', tags_en: [], tags_zh: [], link: '', description_en: '', description_zh: '', banner_url: '', published: true })
const Text = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
const Columns = ({ zh, en }: { zh: React.ReactNode; en: React.ReactNode }) => <div className="admin-columns"><section className="admin-language"><h4>中文</h4>{zh}</section><section className="admin-language"><h4>English</h4>{en}</section></div>

export default function Admin() {
  const [email, setEmail] = useState(''); const [ready, setReady] = useState(false); const [status, setStatus] = useState('')
  const [entries, setEntries] = useState<ResumeEntry[]>([]); const [sections, setSections] = useState<ManagedWorkSection[]>([]); const [items, setItems] = useState<ManagedWorkItem[]>([]); const [active, setActive] = useState('')
  useEffect(() => { if (supabase) supabase.auth.getSession().then(({ data }) => { setReady(Boolean(data.session)); if (data.session) void load() }) }, [])
  async function load() { if (!supabase) return; const { data } = await supabase.from('resume_entries').select('*').order('sort_order'); setEntries(data?.length ? data as ResumeEntry[] : FALLBACK_RESUME); try { const works = await loadWorksForAdmin(); setSections(works.sections); setItems(works.items); setActive(works.sections[0]?.id || ''); if (!works.sections.length) setStatus('Supabase 中暂时没有 Works 板块：请新增板块并保存。') } catch (error) { setSections([]); setItems([]); setActive(''); setStatus(`无法加载 Works：${error instanceof Error ? error.message : String(error)}`) } }
  async function login(e: FormEvent) { e.preventDefault(); if (!supabase) return; const emailRedirectTo = new URL(`${import.meta.env.BASE_URL}admin`, location.href).toString(); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } }); setStatus(error?.message || '登录链接已发送。') }
  const editEntry = (i: number, patch: Partial<ResumeEntry>) => setEntries((xs) => xs.map((x, n) => n === i ? { ...x, ...patch } : x)); const section = sections.find((x) => x.id === active); const sectionItems = items.filter((x) => x.section_id === active)
  const editSection = (patch: Partial<ManagedWorkSection>) => setSections((xs) => xs.map((x) => x.id === active ? { ...x, ...patch } : x)); const editItem = (id: string, patch: Partial<ManagedWorkItem>) => setItems((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x))
  async function saveResume() { await saveAll() }
  async function saveWorks() {
    if (!supabase) return
    const sectionPayload = sections.map((x, i) => ({ id: x.id, sort_order: i + 1, title: x.title_en, tagline: x.tagline_en, footer: x.footer_en, cover_url: x.coverUrl ?? '', awards: x.awards ?? [], published: x.published, title_en: x.title_en, title_zh: x.title_zh, tagline_en: x.tagline_en, tagline_zh: x.tagline_zh, footer_en: x.footer_en, footer_zh: x.footer_zh }))
    const { error: sectionError } = await supabase.from('work_sections').upsert(sectionPayload)
    if (sectionError) { setStatus(sectionError.message); return }
    const itemPayload = items.map((x) => ({ ...x, title: x.title_en, meta: x.meta_en, tags: x.tags_en, description: x.description_en }))
    const { error: itemError } = await supabase.from('work_items').upsert(itemPayload)
    if (itemError) { setStatus(itemError.message); return }
    try {
      const verified = await loadWorksForAdmin()
      setSections(verified.sections)
      setItems(verified.items)
      setActive((current) => verified.sections.some((x) => x.id === current) ? current : (verified.sections[0]?.id || ''))
      setStatus(verified.sections.length ? `双语 Works 已保存并验证：${verified.sections.length} 个板块、${verified.items.length} 个项目。` : '保存请求未报错，但 Supabase 读回了 0 个板块；请检查 RLS 管理员权限。')
    } catch (error) {
      setStatus(`Works 已写入，但无法重新读取：${error instanceof Error ? error.message : String(error)}`)
    }
  }
  async function saveAll() {
    if (!supabase) return
    setStatus('正在保存履历与 Works…')
    const { error: resumeError } = await supabase.from('resume_entries').upsert(entries.map((x, i) => ({ ...x, focus_key: focusKeys[i], sort_order: i + 1 })))
    if (resumeError) { setStatus(`履历未保存：${resumeError.message}`); return }
    const sectionPayload = sections.map((x, i) => ({ id: x.id, sort_order: i + 1, title: x.title_en, tagline: x.tagline_en, footer: x.footer_en, cover_url: x.coverUrl ?? '', awards: x.awards ?? [], published: x.published, title_en: x.title_en, title_zh: x.title_zh, tagline_en: x.tagline_en, tagline_zh: x.tagline_zh, footer_en: x.footer_en, footer_zh: x.footer_zh }))
    const { error: sectionError } = await supabase.from('work_sections').upsert(sectionPayload)
    if (sectionError) { setStatus(`Works 板块未保存：${sectionError.message}`); return }
    const itemPayload = items.map((x) => ({ ...x, title: x.title_en, meta: x.meta_en, tags: x.tags_en, description: x.description_en }))
    const { error: itemError } = await supabase.from('work_items').upsert(itemPayload)
    if (itemError) { setStatus(`Works 项目未保存：${itemError.message}`); return }
    const [resumeRead, works] = await Promise.all([supabase.from('resume_entries').select('id'), loadWorksForAdmin()])
    if (resumeRead.error) { setStatus(`内容已写入，但履历验证失败：${resumeRead.error.message}`); return }
    setSections(works.sections); setItems(works.items)
    setActive((current) => works.sections.some((x) => x.id === current) ? current : (works.sections[0]?.id || ''))
    setStatus(`全部修改已保存：${resumeRead.data?.length ?? 0} 条履历、${works.sections.length} 个 Works 板块、${works.items.length} 个项目。`)
  }
  async function removeItem(id: string) { if (!supabase || !confirm('删除这个项目？')) return; const { error } = await supabase.from('work_items').delete().eq('id', id); setStatus(error?.message || '项目已删除。'); if (!error) setItems((xs) => xs.filter((x) => x.id !== id)) }
  async function removeSection(id: string) { if (!supabase || !confirm('删除板块及其全部项目？')) return; const { error } = await supabase.from('work_sections').delete().eq('id', id); if (error) { setStatus(error.message); return }; const rest = sections.filter((x) => x.id !== id); setSections(rest); setItems((xs) => xs.filter((x) => x.section_id !== id)); setActive(rest[0]?.id || '') }
  async function upload(file: File, kind: 'cover' | 'banner', id?: string) { if (!supabase) return; const path = `works/${kind}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`; const { error } = await supabase.storage.from('portfolio-assets').upload(path, file, { contentType: file.type }); if (error) { setStatus(error.message); return }; const url = supabase.storage.from('portfolio-assets').getPublicUrl(path).data.publicUrl; kind === 'cover' ? editSection({ coverUrl: url }) : id && editItem(id, { banner_url: url }); setStatus('图片已上传，请保存 Works。') }
  if (!supabaseEnabled) return <main className="admin"><h1>Resume Admin</h1><p>请配置 web/.env.local。</p></main>
  if (!ready) return <main className="admin"><h1>Resume Admin</h1><form onSubmit={login}><Text value={email} onChange={setEmail} placeholder="邮箱" /><button>发送登录链接</button></form><p>{status}</p></main>
  return <main className="admin"><header><h1>Resume Admin</h1><button onClick={() => supabase?.auth.signOut().then(() => setReady(false))}>退出</button></header><h2>镜头履历 / Resume</h2>{entries.map((x, i) => <article className="admin-card admin-card-wide" key={x.id}><h3>{focusKeys[i]}</h3><Columns zh={<><Text value={x.period_zh} onChange={(v) => editEntry(i, { period_zh: v })} placeholder="时间" /><Text value={x.place_zh} onChange={(v) => editEntry(i, { place_zh: v })} placeholder="机构" /><Text value={x.role_zh} onChange={(v) => editEntry(i, { role_zh: v })} placeholder="角色" /><textarea value={x.points_zh.join('\n')} onChange={(e) => editEntry(i, { points_zh: e.target.value.split('\n') })} placeholder="每行一个中文要点" /></>} en={<><Text value={x.period_en} onChange={(v) => editEntry(i, { period_en: v })} placeholder="Period" /><Text value={x.place_en} onChange={(v) => editEntry(i, { place_en: v })} placeholder="Place" /><Text value={x.role_en} onChange={(v) => editEntry(i, { role_en: v })} placeholder="Role" /><textarea value={x.points_en.join('\n')} onChange={(e) => editEntry(i, { points_en: e.target.value.split('\n') })} placeholder="One English bullet per line" /></>} /></article>)}<button onClick={() => void saveResume()}>保存双语履历</button><hr /><h2>Works 项目集 / Works</h2><div className="admin-actions">{sections.map((x) => <button key={x.id} onClick={() => setActive(x.id)}>{x.title_zh || x.title_en || '未命名'}</button>)}<button onClick={() => { const x = emptySection(sections.length); setSections((xs) => [...xs, x]); setActive(x.id) }}>新增板块</button></div>{section && <article className="admin-card admin-card-wide"><h3>板块 / Section</h3><Columns zh={<><Text value={section.title_zh} onChange={(v) => editSection({ title_zh: v })} placeholder="标题" /><Text value={section.tagline_zh} onChange={(v) => editSection({ tagline_zh: v })} placeholder="说明" /><textarea value={section.footer_zh} onChange={(e) => editSection({ footer_zh: e.target.value })} placeholder="底部说明" /></>} en={<><Text value={section.title_en} onChange={(v) => editSection({ title_en: v })} placeholder="Title" /><Text value={section.tagline_en} onChange={(v) => editSection({ tagline_en: v })} placeholder="Tagline" /><textarea value={section.footer_en} onChange={(e) => editSection({ footer_en: e.target.value })} placeholder="Footer" /></>} /><Text value={section.coverUrl ?? ''} onChange={(v) => editSection({ coverUrl: v })} placeholder="Cover image URL" /><label>上传封面 <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0], 'cover')} /></label><button className="admin-danger" onClick={() => void removeSection(section.id)}>删除板块</button></article>}{sectionItems.map((x) => <article className="admin-card admin-card-wide" key={x.id}><h3>项目 / Project</h3><Columns zh={<><Text value={x.title_zh} onChange={(v) => editItem(x.id, { title_zh: v })} placeholder="标题" /><Text value={x.meta_zh} onChange={(v) => editItem(x.id, { meta_zh: v })} placeholder="摘要" /><textarea value={x.description_zh} onChange={(e) => editItem(x.id, { description_zh: e.target.value })} placeholder="Markdown（中文）" /></>} en={<><Text value={x.title_en} onChange={(v) => editItem(x.id, { title_en: v })} placeholder="Title" /><Text value={x.meta_en} onChange={(v) => editItem(x.id, { meta_en: v })} placeholder="Meta" /><textarea value={x.description_en} onChange={(e) => editItem(x.id, { description_en: e.target.value })} placeholder="Markdown (English)" /></>} /><Text value={x.link} onChange={(v) => editItem(x.id, { link: v })} placeholder="Project URL" /><Text value={x.banner_url} onChange={(v) => editItem(x.id, { banner_url: v })} placeholder="Image URL" /><label>上传图片 <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0], 'banner', x.id)} /></label><button className="admin-danger" onClick={() => void removeItem(x.id)}>删除项目</button></article>)}{section && <div className="admin-actions"><button onClick={() => setItems((xs) => [...xs, emptyWork(section.id, sectionItems.length)])}>新增项目</button><button onClick={() => void saveWorks()}>保存双语 Works</button></div>}<p>{status}</p></main>
}
