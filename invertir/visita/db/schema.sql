-- ============================================================
--  Checklist de visitas — Esquema de base de datos (Supabase)
--  David Landeo · Personal Shopper Inmobiliario
--
--  CÓMO USARLO:
--  1. Entra en tu proyecto de Supabase.
--  2. Menú lateral → "SQL Editor" → "New query".
--  3. Pega TODO este archivo y pulsa "Run".
--  Es idempotente: puedes ejecutarlo varias veces sin romper nada.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) Tabla principal: una fila por visita
-- ----------------------------------------------------------------
create table if not exists public.visitas (
  id          text primary key,                         -- id generado por la app en el móvil
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  cliente     text default '',
  agencia     text default '',
  agente      text default '',
  fecha       date,
  campos      jsonb not null default '{}'::jsonb,        -- { "precio": "185.000 €", ... }
  checks      jsonb not null default '{}'::jsonb,        -- { "notasimple": true, ... }
  fotos       jsonb not null default '{}'::jsonb,        -- { "ffachada": ["ruta/en/storage.jpg"], ... }
  notas       text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Listar rápido "mis visitas" por fecha de actualización
create index if not exists visitas_user_updated_idx
  on public.visitas (user_id, updated_at desc);

-- ----------------------------------------------------------------
-- 2) Seguridad a nivel de fila (RLS)
--    Cada usuario SOLO puede ver y tocar sus propias visitas.
-- ----------------------------------------------------------------
alter table public.visitas enable row level security;

drop policy if exists "visitas_select_propias" on public.visitas;
create policy "visitas_select_propias" on public.visitas
  for select using (auth.uid() = user_id);

drop policy if exists "visitas_insert_propias" on public.visitas;
create policy "visitas_insert_propias" on public.visitas
  for insert with check (auth.uid() = user_id);

drop policy if exists "visitas_update_propias" on public.visitas;
create policy "visitas_update_propias" on public.visitas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "visitas_delete_propias" on public.visitas;
create policy "visitas_delete_propias" on public.visitas
  for delete using (auth.uid() = user_id);

-- Mantener updated_at al día en cada cambio
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_visitas_touch on public.visitas;
create trigger trg_visitas_touch
  before update on public.visitas
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------
-- 3) Almacén de fotos: bucket PRIVADO
--    Las fotos se ven con enlaces firmados temporales (no públicas).
--    Estructura de carpetas:  <user_id>/<visita_id>/<item>/<archivo>.jpg
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('visitas-fotos', 'visitas-fotos', false)
on conflict (id) do nothing;

drop policy if exists "fotos_select_propias" on storage.objects;
create policy "fotos_select_propias" on storage.objects
  for select using (
    bucket_id = 'visitas-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos_insert_propias" on storage.objects;
create policy "fotos_insert_propias" on storage.objects
  for insert with check (
    bucket_id = 'visitas-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos_delete_propias" on storage.objects;
create policy "fotos_delete_propias" on storage.objects
  for delete using (
    bucket_id = 'visitas-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ¡Listo! Cuando termine sin errores, la base de datos está preparada.
