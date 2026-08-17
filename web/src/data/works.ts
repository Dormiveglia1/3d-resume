export interface WorkListItem {
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
  description?: string
  banner?: string
  role?: string
}

export interface WorkGroup {
  heading: string
  items: string[]
}

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  items?: WorkListItem[]
  groups?: WorkGroup[]
  footer?: string
  coverUrl?: string
}

export interface WorksLang {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
  countLabel: (n: number) => string
  sections: WorkSection[]
}

const defaultSections = {
  zh: [
    {
      id: 'featured', no: '01', title: '精选项目', tagline: 'AI · Full-stack · Game Development',
      items: [
        { name: '3D 个人简历', meta: 'React Three Fiber · Blender · Supabase', slug: '3d-resume' },
      ],
      footer: '更多项目可在管理后台随时维护。',
    },
  ],
  en: [
    {
      id: 'featured', no: '01', title: 'Featured Projects', tagline: 'AI · Full-stack · Game Development',
      items: [
        { name: '3D Resume', meta: 'React Three Fiber · Blender · Supabase', slug: '3d-resume' },
      ],
      footer: 'More projects can be maintained anytime in the admin area.',
    },
  ],
} satisfies Record<'zh' | 'en', WorkSection[]>

export const WORKS: Record<'zh' | 'en', WorksLang> = {
  zh: {
    title: '项目集', closeLabel: '返回', openLabel: '查看项目', hint: '继续下滑',
    visitLabel: '访问项目', detailPlaceholder: '项目介绍',
    phImageLabel: '图片 / 视频', phButtonLabel: '跳转链接', countLabel: (n) => `${n} 个项目`,
    sections: defaultSections.zh,
  },
  en: {
    title: 'Works', closeLabel: 'Back', openLabel: 'Explore', hint: 'Keep scrolling',
    visitLabel: 'Visit site', detailPlaceholder: 'Project description',
    phImageLabel: 'Image / Video', phButtonLabel: 'Visit link', countLabel: (n) => `${n} projects`,
    sections: defaultSections.en,
  },
}

// Optional section cover mapping. Admin-provided cover URLs take precedence.
export const SECTION_COVERS: Record<string, string> = {}

export function sectionCount(section: WorkSection): number {
  if (section.items) return section.items.length
  if (section.groups) return section.groups.reduce((n, g) => n + g.items.length, 0)
  return 0
}
