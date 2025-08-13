-- Enable required extension
create extension if not exists pgcrypto;

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.categories enable row level security;

create policy "Categories are viewable by owner"
on public.categories for select to authenticated
using (auth.uid() = user_id);

create policy "Categories can be inserted by owner"
on public.categories for insert to authenticated
with check (auth.uid() = user_id);

create policy "Categories can be updated by owner"
on public.categories for update to authenticated
using (auth.uid() = user_id);

create policy "Categories can be deleted by owner"
on public.categories for delete to authenticated
using (auth.uid() = user_id);

create trigger update_categories_updated_at
before update on public.categories
for each row execute function public.update_updated_at_column();

-- Media table
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bucket text not null default 'media',
  path text not null,
  title text,
  note text,
  category_id uuid references public.categories(id) on delete set null,
  downloadable boolean not null default true,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Media viewable by owner"
on public.media for select to authenticated
using (auth.uid() = user_id);

create policy "Media insertable by owner"
on public.media for insert to authenticated
with check (auth.uid() = user_id);

create policy "Media updatable by owner"
on public.media for update to authenticated
using (auth.uid() = user_id);

create policy "Media deletable by owner"
on public.media for delete to authenticated
using (auth.uid() = user_id);

create trigger update_media_updated_at
before update on public.media
for each row execute function public.update_updated_at_column();

create index if not exists idx_media_user_created_at on public.media(user_id, created_at desc);
create index if not exists idx_media_category on public.media(category_id);

-- Share access mode enum
do $$
begin
    if not exists (select 1 from pg_type where typname = 'share_access_mode') then
        create type public.share_access_mode as enum ('whitelist','blacklist');
    end if;
end
$$;

-- Shares tables
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid(),
  user_id uuid not null,
  media_id uuid not null references public.media(id) on delete cascade,
  password_hash text,
  require_auth boolean not null default true,
  allow_download boolean not null default false,
  expire_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(token)
);

alter table public.shares enable row level security;

create policy "Shares manageable by owner"
on public.shares for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create trigger update_shares_updated_at
before update on public.shares
for each row execute function public.update_updated_at_column();

create index if not exists idx_shares_token on public.shares(token);

-- Share access list
create table if not exists public.share_access (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.shares(id) on delete cascade,
  user_id uuid not null,
  mode public.share_access_mode not null,
  created_at timestamptz not null default now()
);

alter table public.share_access enable row level security;

create policy "Share access manageable by owner via share ownership"
on public.share_access for all to authenticated
using (
  exists (select 1 from public.shares s where s.id = share_id and s.user_id = auth.uid())
)
with check (
  exists (select 1 from public.shares s where s.id = share_id and s.user_id = auth.uid())
);

-- Storage bucket for media
insert into storage.buckets (id, name, public)
values ('media','media', false)
on conflict (id) do nothing;

-- Storage RLS policies for user-owned files (user_id as first folder segment)  
create policy "Own media objects are readable by owner"
on storage.objects for select to authenticated
using (
  bucket_id = 'media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Own media objects can be inserted by owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Own media objects can be updated by owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Own media objects can be deleted by owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'media'
  and auth.uid()::text = (storage.foldername(name))[1]
);