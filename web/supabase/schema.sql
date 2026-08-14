create table if not exists public.resume_entries (
  id text primary key,
  focus_key text not null unique check (focus_key in ('focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5')),
  sort_order integer not null unique check (sort_order between 1 and 5),
  period text not null default '',
  place text not null default '',
  role text,
  points jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.resume_entries add column if not exists period_en text;
alter table public.resume_entries add column if not exists period_zh text;
alter table public.resume_entries add column if not exists place_en text;
alter table public.resume_entries add column if not exists place_zh text;
alter table public.resume_entries add column if not exists role_en text;
alter table public.resume_entries add column if not exists role_zh text;
alter table public.resume_entries add column if not exists points_en jsonb;
alter table public.resume_entries add column if not exists points_zh jsonb;
update public.resume_entries set period_en = coalesce(period_en, period), period_zh = coalesce(period_zh, period), place_en = coalesce(place_en, place), place_zh = coalesce(place_zh, place), role_en = coalesce(role_en, role, ''), role_zh = coalesce(role_zh, role, ''), points_en = coalesce(points_en, points), points_zh = coalesce(points_zh, points);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.resume_entries enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_resume_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;

drop policy if exists "public reads published resume" on public.resume_entries;
drop policy if exists "admins read all resume" on public.resume_entries;
drop policy if exists "admins manage resume" on public.resume_entries;
create policy "public reads published resume" on public.resume_entries for select using (published = true);
create policy "admins read all resume" on public.resume_entries for select to authenticated using (public.is_resume_admin());
create policy "admins manage resume" on public.resume_entries for all to authenticated using (public.is_resume_admin()) with check (public.is_resume_admin());

create table if not exists public.work_sections (
  id text primary key,
  sort_order integer not null unique,
  title text not null default '',
  tagline text not null default '',
  cover_url text not null default '',
  awards jsonb not null default '[]'::jsonb,
  footer text not null default '',
  published boolean not null default true
);
alter table public.work_sections add column if not exists title_en text;
alter table public.work_sections add column if not exists title_zh text;
alter table public.work_sections add column if not exists tagline_en text;
alter table public.work_sections add column if not exists tagline_zh text;
alter table public.work_sections add column if not exists footer_en text;
alter table public.work_sections add column if not exists footer_zh text;
update public.work_sections set title_en = coalesce(title_en, title), title_zh = coalesce(title_zh, title), tagline_en = coalesce(tagline_en, tagline), tagline_zh = coalesce(tagline_zh, tagline), footer_en = coalesce(footer_en, footer), footer_zh = coalesce(footer_zh, footer);
create table if not exists public.work_items (
  id text primary key,
  section_id text not null references public.work_sections(id) on delete cascade,
  sort_order integer not null,
  title text not null default '',
  meta text not null default '',
  tags jsonb not null default '[]'::jsonb,
  link text not null default '',
  description text not null default '',
  banner_url text not null default '',
  published boolean not null default true,
  unique(section_id, sort_order)
);
alter table public.work_items add column if not exists title_en text;
alter table public.work_items add column if not exists title_zh text;
alter table public.work_items add column if not exists meta_en text;
alter table public.work_items add column if not exists meta_zh text;
alter table public.work_items add column if not exists tags_en jsonb;
alter table public.work_items add column if not exists tags_zh jsonb;
alter table public.work_items add column if not exists description_en text;
alter table public.work_items add column if not exists description_zh text;
update public.work_items set title_en = coalesce(title_en, title), title_zh = coalesce(title_zh, title), meta_en = coalesce(meta_en, meta), meta_zh = coalesce(meta_zh, meta), tags_en = coalesce(tags_en, tags), tags_zh = coalesce(tags_zh, tags), description_en = coalesce(description_en, description), description_zh = coalesce(description_zh, description);
alter table public.work_sections enable row level security;
alter table public.work_items enable row level security;
drop policy if exists "public reads published work sections" on public.work_sections;
drop policy if exists "admins manage work sections" on public.work_sections;
drop policy if exists "public reads published work items" on public.work_items;
drop policy if exists "admins manage work items" on public.work_items;
create policy "public reads published work sections" on public.work_sections for select using (published = true);
create policy "admins manage work sections" on public.work_sections for all to authenticated using (public.is_resume_admin()) with check (public.is_resume_admin());
create policy "public reads published work items" on public.work_items for select using (published = true);
create policy "admins manage work items" on public.work_items for all to authenticated using (public.is_resume_admin()) with check (public.is_resume_admin());

insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do update set public = true;
drop policy if exists "public reads portfolio assets" on storage.objects;
drop policy if exists "admins upload portfolio assets" on storage.objects;
drop policy if exists "admins update portfolio assets" on storage.objects;
drop policy if exists "admins delete portfolio assets" on storage.objects;
create policy "public reads portfolio assets" on storage.objects for select using (bucket_id = 'portfolio-assets');
create policy "admins upload portfolio assets" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-assets' and public.is_resume_admin());
create policy "admins update portfolio assets" on storage.objects for update to authenticated using (bucket_id = 'portfolio-assets' and public.is_resume_admin()) with check (bucket_id = 'portfolio-assets' and public.is_resume_admin());
create policy "admins delete portfolio assets" on storage.objects for delete to authenticated using (bucket_id = 'portfolio-assets' and public.is_resume_admin());

-- 首次用管理员邮箱登录 /admin 后，在 Supabase SQL Editor 执行：
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'your-email@example.com';
