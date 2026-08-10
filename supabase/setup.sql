-- “我们的小世界”首次连接 Supabase 时运行一次。
-- 作用：建立共享数据表、开启访问保护，并创建私有照片空间。

create table if not exists public.site_data (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_data enable row level security;

-- 让两个已登录设备在内容变化时立即收到更新；重复运行本文件也不会报错。
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_data'
  ) then
    execute 'alter publication supabase_realtime add table public.site_data';
  end if;
end $$;

drop policy if exists "couple can read site data" on public.site_data;
create policy "couple can read site data"
on public.site_data for select
to authenticated
using (true);

drop policy if exists "couple can add site data" on public.site_data;
create policy "couple can add site data"
on public.site_data for insert
to authenticated
with check (true);

drop policy if exists "couple can update site data" on public.site_data;
create policy "couple can update site data"
on public.site_data for update
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'couple-photos',
  'couple-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "couple can view photos" on storage.objects;
create policy "couple can view photos"
on storage.objects for select
to authenticated
using (bucket_id = 'couple-photos');

drop policy if exists "couple can upload photos" on storage.objects;
create policy "couple can upload photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'couple-photos');

drop policy if exists "couple can update photos" on storage.objects;
create policy "couple can update photos"
on storage.objects for update
to authenticated
using (bucket_id = 'couple-photos')
with check (bucket_id = 'couple-photos');

drop policy if exists "couple can delete photos" on storage.objects;
create policy "couple can delete photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'couple-photos');
