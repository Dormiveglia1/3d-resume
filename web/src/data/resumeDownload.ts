import { supabase } from '../lib/supabase'

export const RESUME_FILE_PATH = 'resume/eric-zhang-resume.pdf'
export const RESUME_DOWNLOAD_NAME = 'Eric-Zhang-Resume.pdf'

export function getResumeDownloadUrl() {
  if (!supabase) return ''
  const url = supabase.storage.from('portfolio-assets').getPublicUrl(RESUME_FILE_PATH).data.publicUrl
  return `${url}?download=${encodeURIComponent(RESUME_DOWNLOAD_NAME)}`
}
