import { type FormEvent, useEffect, useState } from 'react'
import { FALLBACK_RESUME, type ResumeEntry } from './data/resumeContent'
import { fallbackWorksForAdmin, loadWorksForAdmin, type ManagedWorkItem, type ManagedWorkSection } from './data/worksContent'
import { RESUME_DOWNLOAD_NAME, RESUME_FILE_PATH } from './data/resumeDownload'
import { supabase, supabaseEnabled } from './lib/supabase'

type ResumeFile = { name: string; created_at?: string; updated_at?: string; metadata?: { size?: number } }

const focusKeys = ['focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5']
const Text = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
const Columns = ({ zh, en }: { zh: React.ReactNode; en: React.ReactNode }) => <div className="admin-columns"><section className="admin-language"><h4>中文</h4>{zh}</section><section className="admin-language"><h4>English</h4>{en}</section></div>
const emptySection = (index: number): ManagedWorkSection => ({ id: crypto.randomUUID(), no: `${index + 1}`.padStart(2, '0'), sort_order: index + 1, title: '', tagline: '', footer: '', coverUrl: '', published: true, items: [], title_en: '', title_zh: '', tagline_en: '', tagline_zh: '', footer_en: '', footer_zh: '' })
const emptyWork = (sectionId: string, index: number): ManagedWorkItem => ({ id: crypto.randomUUID(), section_id: sectionId, sort_order: index + 1, title_en: '', title_zh: '', meta_en: '', meta_zh: '', tags_en: [], tags_zh: [], link: '', description_en: '', description_zh: '', banner_url: '', gallery_urls: [], published: true })

export default function Admin() {
  const [email, setEmail] = useState('')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const [resumeStatus, setResumeStatus] = useState('')
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
  const [entries, setEntries] = useState<ResumeEntry[]>([])
  const [sections, setSections] = useState<ManagedWorkSection[]>([])
  const [items, setItems] = useState<ManagedWorkItem[]>([])
  const [active, setActive] = useState('')

  useEffect(() => { if (supabase) supabase.auth.getSession().then(({ data }) => { setReady(Boolean(data.session)); if (data.session) { void load(); void loadResumeFile() } }) }, [])

  async function loadResumeFile() {
    if (!supabase) return
    const { data, error } = await supabase.storage.from('portfolio-assets').list('resume', { search: 'eric-zhang-resume.pdf' })
    if (error) { setResumeStatus(`无法读取线上 PDF 状态：${error.message}`); return }
    setResumeFile((data?.find((file) => file.name === 'eric-zhang-resume.pdf') as ResumeFile | undefined) ?? null)
  }

  async function load() {
    if (!supabase) return
    const { data } = await supabase.from('resume_entries').select('*').order('sort_order')
    setEntries(data?.length ? data as ResumeEntry[] : FALLBACK_RESUME)
    try {
      const works = await loadWorksForAdmin()
      setSections(works.sections); setItems(works.items); setActive(works.sections[0]?.id || '')
    } catch (error) { setStatus(`无法加载 Works：${error instanceof Error ? error.message : String(error)}`) }
  }

  async function login(event: FormEvent) {
    event.preventDefault(); if (!supabase) return
    const emailRedirectTo = new URL(`${import.meta.env.BASE_URL}admin`, location.href).toString()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
    setStatus(error?.message || '登录链接已发送，请查收邮箱。')
  }

  const editEntry = (index: number, patch: Partial<ResumeEntry>) => setEntries((all) => all.map((entry, current) => current === index ? { ...entry, ...patch } : entry))
  // Uploads are asynchronous. Keep the target section ID rather than relying
  // on `active`, which may change while a file is being uploaded.
  const editSection = (patch: Partial<ManagedWorkSection>, sectionId = active) => setSections((all) => all.map((section) => section.id === sectionId ? { ...section, ...patch } : section))
  const editItem = (id: string, patch: Partial<ManagedWorkItem>) => setItems((all) => all.map((item) => item.id === id ? { ...item, ...patch } : item))
  const section = sections.find((item) => item.id === active)
  const sectionItems = items.filter((item) => item.section_id === active)

  async function saveAll() {
    if (!supabase) return
    setStatus('正在保存全部内容…')
    const { error: resumeError } = await supabase.from('resume_entries').upsert(entries.map((entry, index) => ({ ...entry, focus_key: focusKeys[index], sort_order: index + 1 })))
    if (resumeError) { setStatus(`履历未保存：${resumeError.message}`); return }
    const sectionPayload = sections.map((item, index) => ({ id: item.id, sort_order: index + 1, title: item.title_en, tagline: item.tagline_en, footer: item.footer_en, cover_url: item.coverUrl ?? '', published: item.published, title_en: item.title_en, title_zh: item.title_zh, tagline_en: item.tagline_en, tagline_zh: item.tagline_zh, footer_en: item.footer_en, footer_zh: item.footer_zh }))
    const { error: sectionError } = await supabase.from('work_sections').upsert(sectionPayload)
    if (sectionError) { setStatus(`Works 板块未保存：${sectionError.message}`); return }
    const itemPayload = items.map((item) => ({ ...item, title: item.title_en, meta: item.meta_en, tags: item.tags_en, description: item.description_en }))
    const { error: itemError } = await supabase.from('work_items').upsert(itemPayload)
    if (itemError) { setStatus(`Works 项目未保存：${itemError.message}`); return }
    const works = await loadWorksForAdmin()
    setSections(works.sections); setItems(works.items); setActive((current) => works.sections.some((item) => item.id === current) ? current : works.sections[0]?.id || '')
    setStatus('全部修改已保存并已从 Supabase 验证。')
  }

  async function uploadAsset(file: File, kind: 'cover' | 'banner' | 'gallery', id?: string) {
    if (!supabase) return
    const path = `works/${kind}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
    const { error } = await supabase.storage.from('portfolio-assets').upload(path, file, { contentType: file.type })
    if (error) { setStatus(error.message); return }
    const url = supabase.storage.from('portfolio-assets').getPublicUrl(path).data.publicUrl
    if (kind === 'cover' && id) editSection({ coverUrl: url }, id)
    else if (kind === 'banner' && id) editItem(id, { banner_url: url })
    else if (kind === 'gallery' && id) setItems((all) => all.map((item) => item.id === id ? { ...item, gallery_urls: [...(item.gallery_urls ?? []), url] } : item))
    setStatus('图片已上传。点击底部“保存全部修改”后会写入内容。')
  }

  const removeGalleryImage = (itemId: string, url: string) => editItem(itemId, { gallery_urls: (items.find((item) => item.id === itemId)?.gallery_urls ?? []).filter((image) => image !== url) })

  async function uploadResume(file: File) {
    if (!supabase) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setResumeStatus('请选择 PDF 文件。'); return }
    setResumeStatus('正在上传 PDF…')
    const { error } = await supabase.storage.from('portfolio-assets').upload(RESUME_FILE_PATH, file, { upsert: true, contentType: 'application/pdf', cacheControl: '60' })
    const message = error?.message || `上传成功：${RESUME_DOWNLOAD_NAME}。刷新前台后会出现下载按钮。`
    setResumeStatus(message); setStatus(message)
    if (!error) await loadResumeFile()
  }

  async function removeItem(id: string) {
    if (!supabase || !confirm('删除这个项目？')) return
    const { error } = await supabase.from('work_items').delete().eq('id', id)
    if (error) { setStatus(error.message); return }; setItems((all) => all.filter((item) => item.id !== id)); setStatus('项目已删除。')
  }

  async function removeSection(id: string) {
    if (!supabase || !confirm('删除板块及其全部项目？')) return
    const { error } = await supabase.from('work_sections').delete().eq('id', id)
    if (error) { setStatus(error.message); return }
    const rest = sections.filter((item) => item.id !== id)
    setSections(rest); setItems((all) => all.filter((item) => item.section_id !== id)); setActive(rest[0]?.id || ''); setStatus('板块已删除。')
  }

  if (!supabaseEnabled) return <main className="admin"><h1>Resume Admin</h1><p>请配置 web/.env.local。</p></main>
  if (!ready) return <main className="admin"><h1>Resume Admin</h1><form onSubmit={login}><Text value={email} onChange={setEmail} placeholder="管理员邮箱" /><button>发送登录链接</button></form><p>{status}</p></main>

  return <main className="admin">
    <header><h1>Resume Admin</h1><button onClick={() => supabase?.auth.signOut().then(() => setReady(false))}>退出</button></header>
    <article className="admin-card admin-card-wide"><h2>招聘方简历 PDF / Recruiter résumé PDF</h2><p>上传会替换线上下载文件；前台自动显示 Download Resume 按钮。PDF 上传立即生效，不需要点击“保存全部修改”。</p><label>上传 PDF <input type="file" accept="application/pdf,.pdf" onChange={(event) => event.target.files?.[0] && void uploadResume(event.target.files[0])} /></label><p className={resumeFile ? 'admin-file-status is-ready' : 'admin-file-status'}>{resumeFile ? `线上文件已存在：${resumeFile.name}${resumeFile.metadata?.size ? ` · ${(resumeFile.metadata.size / 1024 / 1024).toFixed(2)} MB` : ''}${resumeFile.updated_at ? ` · 更新于 ${new Date(resumeFile.updated_at).toLocaleString()}` : ''}` : '尚未检测到线上 PDF。请上传后等待成功提示。'}</p>{resumeStatus && <p className="admin-upload-status" role="status">{resumeStatus}</p>}</article>
    <h2>镜头履历 / Resume</h2>
    {entries.map((entry, index) => <article className="admin-card admin-card-wide" key={entry.id}><h3>{focusKeys[index]}</h3><Columns zh={<><Text value={entry.period_zh} onChange={(value) => editEntry(index, { period_zh: value })} placeholder="时间" /><Text value={entry.place_zh} onChange={(value) => editEntry(index, { place_zh: value })} placeholder="机构" /><Text value={entry.role_zh} onChange={(value) => editEntry(index, { role_zh: value })} placeholder="角色" /><textarea value={entry.points_zh.join('\n')} onChange={(event) => editEntry(index, { points_zh: event.target.value.split('\n') })} placeholder="每行一个中文要点" /></>} en={<><Text value={entry.period_en} onChange={(value) => editEntry(index, { period_en: value })} placeholder="Period" /><Text value={entry.place_en} onChange={(value) => editEntry(index, { place_en: value })} placeholder="Place" /><Text value={entry.role_en} onChange={(value) => editEntry(index, { role_en: value })} placeholder="Role" /><textarea value={entry.points_en.join('\n')} onChange={(event) => editEntry(index, { points_en: event.target.value.split('\n') })} placeholder="One English bullet per line" /></>} /></article>)}
    <hr /><h2>Works 项目集 / Works</h2>
    <div className="admin-actions">{sections.map((item) => <button key={item.id} onClick={() => setActive(item.id)}>{item.title_zh || item.title_en || '未命名'}</button>)}<button onClick={() => { const next = emptySection(sections.length); setSections((all) => [...all, next]); setActive(next.id) }}>新增板块</button></div>
    {section && <article className="admin-card admin-card-wide"><h3>板块 / Section</h3><Columns zh={<><Text value={section.title_zh} onChange={(value) => editSection({ title_zh: value })} placeholder="标题" /><Text value={section.tagline_zh} onChange={(value) => editSection({ tagline_zh: value })} placeholder="说明" /><textarea value={section.footer_zh} onChange={(event) => editSection({ footer_zh: event.target.value })} placeholder="底部说明" /></>} en={<><Text value={section.title_en} onChange={(value) => editSection({ title_en: value })} placeholder="Title" /><Text value={section.tagline_en} onChange={(value) => editSection({ tagline_en: value })} placeholder="Tagline" /><textarea value={section.footer_en} onChange={(event) => editSection({ footer_en: event.target.value })} placeholder="Footer" /></>} /><Text value={section.coverUrl ?? ''} onChange={(value) => editSection({ coverUrl: value })} placeholder="Cover image URL" /><label>上传封面 <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadAsset(event.target.files[0], 'cover', section.id)} /></label>{section.coverUrl && <img className="admin-cover-preview" src={section.coverUrl} alt="当前 Section 封面预览" />}<label><input type="checkbox" checked={section.published} onChange={(event) => editSection({ published: event.target.checked })} />公开显示此板块</label><button className="admin-danger" onClick={() => void removeSection(section.id)}>删除此板块</button></article>}
    {sectionItems.map((item) => <article className="admin-card admin-card-wide" key={item.id}><h3>项目 / Project</h3><Columns zh={<><Text value={item.title_zh} onChange={(value) => editItem(item.id, { title_zh: value })} placeholder="标题" /><Text value={item.meta_zh} onChange={(value) => editItem(item.id, { meta_zh: value })} placeholder="摘要" /><textarea value={item.description_zh} onChange={(event) => editItem(item.id, { description_zh: event.target.value })} placeholder="Markdown（中文）" /></>} en={<><Text value={item.title_en} onChange={(value) => editItem(item.id, { title_en: value })} placeholder="Title" /><Text value={item.meta_en} onChange={(value) => editItem(item.id, { meta_en: value })} placeholder="Meta" /><textarea value={item.description_en} onChange={(event) => editItem(item.id, { description_en: event.target.value })} placeholder="Markdown (English)" /></>} /><Text value={item.link} onChange={(value) => editItem(item.id, { link: value })} placeholder="Project URL" /><Text value={item.banner_url} onChange={(value) => editItem(item.id, { banner_url: value })} placeholder="Banner image URL" /><label>上传项目首图 <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadAsset(event.target.files[0], 'banner', item.id)} /></label><label>上传项目补充图片（可多选） <input type="file" accept="image/*" multiple onChange={(event) => Array.from(event.target.files ?? []).forEach((file) => void uploadAsset(file, 'gallery', item.id))} /></label>{item.gallery_urls.length > 0 && <div className="admin-gallery-preview">{item.gallery_urls.map((url, index) => <figure key={url}><img src={url} alt={`项目补充图片 ${index + 1}`} /><button type="button" className="admin-gallery-remove" onClick={() => removeGalleryImage(item.id, url)}>移除</button></figure>)}</div>}<label><input type="checkbox" checked={item.published} onChange={(event) => editItem(item.id, { published: event.target.checked })} />公开显示此项目</label><button className="admin-danger" onClick={() => void removeItem(item.id)}>删除此项目</button></article>)}
    {section && <div className="admin-actions"><button onClick={() => setItems((all) => [...all, emptyWork(section.id, sectionItems.length)])}>新增项目</button></div>}
    <div className="admin-save-bar"><p role="status" aria-live="polite">{status}</p><button onClick={() => void saveAll()}>保存全部修改</button></div>
  </main>
}
