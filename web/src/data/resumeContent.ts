import { supabase } from '../lib/supabase'

export type Lang = 'zh' | 'en'
export type ResumeEntry = {
  id: string; focus_key: string; sort_order: number; published: boolean
  period_en: string; period_zh: string; place_en: string; place_zh: string
  role_en: string; role_zh: string; points_en: string[]; points_zh: string[]
}
export const FALLBACK_RESUME: ResumeEntry[] = [
  { id: 'education', focus_key: 'focus-1', sort_order: 1, published: true, period_en: 'Sep 2023 – Present', period_zh: '2023 年 9 月 – 至今', place_en: 'McMaster University', place_zh: '麦克马斯特大学', role_en: 'B.Sc. Computer Science (Honours Co-op)', role_zh: '计算机科学荣誉 Co-op 本科', points_en: ['GPA 3.62/4.0 · Dean’s Honour List', 'Algorithms · Databases · Operating Systems'], points_zh: ['GPA 3.62/4.0 · 院长荣誉名单', '算法 · 数据库 · 操作系统'] },
  { id: 'ey', focus_key: 'focus-2', sort_order: 2, published: true, period_en: 'May 2025 – Aug 2025', period_zh: '2025 年 5 月 – 8 月', place_en: 'Ernst & Young (EY China) · Shanghai', place_zh: '安永中国 · 上海', role_en: 'Web Developer & DBA Intern', role_zh: 'Web 开发与 DBA 实习生', points_en: ['Automated workflows for 100+ finance professionals.', 'Optimized MySQL reports by 40%.'], points_zh: ['为 100+ 财务专业人士自动化工作流程。', '优化 MySQL 报表，速度提升 40%。'] },
  { id: 'rag', focus_key: 'focus-3', sort_order: 3, published: true, period_en: 'Mar 2026 – Jun 2026', period_zh: '2026 年 3 月 – 6 月', place_en: 'AI Knowledge Base Assistant', place_zh: 'AI 知识库助手', role_en: 'Full-stack RAG project', role_zh: '全栈 RAG 项目', points_en: ['OpenAI API · FastAPI · React · vector search'], points_zh: ['OpenAI API · FastAPI · React · 向量检索'] },
  { id: 'tracker', focus_key: 'focus-4', sort_order: 4, published: true, period_en: 'Dec 2025 – Mar 2026', period_zh: '2025 年 12 月 – 2026 年 3 月', place_en: 'Job Application Tracker', place_zh: '求职申请追踪器', role_en: 'Full-stack project', role_zh: '全栈项目', points_en: ['React · REST APIs · JWT · MySQL'], points_zh: ['React · REST API · JWT · MySQL'] },
  { id: 'skills', focus_key: 'focus-5', sort_order: 5, published: true, period_en: 'Skill Tree', period_zh: '技能树', place_en: 'AI · Full-stack · Game Development', place_zh: 'AI · 全栈 · 游戏开发', role_en: 'Open to software engineering opportunities', role_zh: '正在寻找软件工程相关机会', points_en: ['Python · Java · C/C++ · JavaScript · SQL'], points_zh: ['Python · Java · C/C++ · JavaScript · SQL'] },
]

export async function loadResumeEntries() {
  if (!supabase) return FALLBACK_RESUME
  const { data, error } = await supabase.from('resume_entries').select('*').eq('published', true).order('sort_order')
  return error || !data?.length ? FALLBACK_RESUME : data as ResumeEntry[]
}
