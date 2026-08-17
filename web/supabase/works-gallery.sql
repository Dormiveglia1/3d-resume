-- Run once in the Supabase SQL Editor to enable multi-image project galleries.
alter table public.work_items
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

update public.work_items
  set gallery_urls = '[]'::jsonb
  where gallery_urls is null;
