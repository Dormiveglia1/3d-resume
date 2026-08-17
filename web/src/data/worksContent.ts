import { supabase } from '../lib/supabase'
import { WORKS, type WorkSection } from './works'
import type { Lang } from './resumeContent'

export type ManagedWorkSection = WorkSection & { sort_order: number; published: boolean; coverUrl?: string; title_en: string; title_zh: string; tagline_en: string; tagline_zh: string; footer_en: string; footer_zh: string }
export type ManagedWorkItem = {
  id: string; section_id: string; sort_order: number; title_en: string; title_zh: string; meta_en: string; meta_zh: string; tags_en: string[]; tags_zh: string[]
  link: string; description_en: string; description_zh: string; banner_url: string; gallery_urls: string[]; published: boolean
}

export function fallbackWorksForAdmin() {
  const sections: ManagedWorkSection[] = WORKS.en.sections.map((section, index) => ({
    ...section, sort_order: index + 1, published: true, coverUrl: '', items: [], title_en: section.title, title_zh: section.title, tagline_en: section.tagline, tagline_zh: section.tagline, footer_en: section.footer ?? '', footer_zh: section.footer ?? '',
  }))
  const items: ManagedWorkItem[] = WORKS.en.sections.flatMap((section) => (section.items ?? []).map((item, index) => ({
    id: `${section.id}-${item.slug ?? index + 1}`,
    section_id: section.id,
    sort_order: index + 1,
    title_en: item.name, title_zh: item.name, meta_en: item.meta ?? '', meta_zh: item.meta ?? '', tags_en: item.tags ?? [], tags_zh: item.tags ?? [],
    link: item.link ?? '',
    description_en: '', description_zh: '',
    banner_url: '',
    gallery_urls: [],
    published: true,
  })))
  return { sections, items }
}

export async function loadWorks(lang: Lang): Promise<ManagedWorkSection[]> {
  if (!supabase) return fallbackWorksForAdmin().sections
  const { data, error } = await supabase.from('work_sections').select('*, work_items(*)').eq('published', true).order('sort_order')
  if (error || !data?.length) return fallbackWorksForAdmin().sections
  return data.map((section: any) => ({
    id: section.id, sort_order: section.sort_order, no: String(section.sort_order).padStart(2, '0'), title: section[`title_${lang}`] || section.title, tagline: section[`tagline_${lang}`] || section.tagline,
    title_en: section.title_en || section.title, title_zh: section.title_zh || section.title, tagline_en: section.tagline_en || section.tagline, tagline_zh: section.tagline_zh || section.tagline, footer_en: section.footer_en || section.footer || '', footer_zh: section.footer_zh || section.footer || '', footer: (section[`footer_${lang}`] || section.footer || ''), published: section.published, coverUrl: section.cover_url ?? '',
    items: (section.work_items ?? []).filter((item: any) => item.published).sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
      name: item[`title_${lang}`] || item.title, meta: item[`meta_${lang}`] || item.meta, tags: item[`tags_${lang}`] || item.tags || [], link: item.link, slug: item.id,
      description: item[`description_${lang}`] || item.description, banner: item.banner_url, gallery: Array.isArray(item.gallery_urls) ? item.gallery_urls : [], role: '',
    })),
  }))
}

export async function loadWorksForAdmin() {
  if (!supabase) return fallbackWorksForAdmin()
  const [{ data: sectionData, error: sectionError }, { data: itemData, error: itemError }] = await Promise.all([
    supabase.from('work_sections').select('*').order('sort_order'),
    supabase.from('work_items').select('*').order('sort_order'),
  ])
  if (sectionError) throw sectionError
  if (itemError) throw itemError
  return { sections: (sectionData ?? []).map((section: any) => ({ ...section, no: String(section.sort_order).padStart(2, '0'), coverUrl: section.cover_url ?? '', title_en: section.title_en || section.title, title_zh: section.title_zh || section.title, tagline_en: section.tagline_en || section.tagline, tagline_zh: section.tagline_zh || section.tagline, footer_en: section.footer_en || section.footer || '', footer_zh: section.footer_zh || section.footer || '', items: [] })), items: (itemData ?? []).map((item: any) => ({ ...item, title_en: item.title_en || item.title, title_zh: item.title_zh || item.title, meta_en: item.meta_en || item.meta || '', meta_zh: item.meta_zh || item.meta || '', tags_en: item.tags_en || item.tags || [], tags_zh: item.tags_zh || item.tags || [], description_en: item.description_en || item.description || '', description_zh: item.description_zh || item.description || '', gallery_urls: Array.isArray(item.gallery_urls) ? item.gallery_urls : [] })) as ManagedWorkItem[] }
}
