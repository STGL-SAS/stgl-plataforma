-- Fase 8: roles de usuario (estructura; enforcement fino en Fase 10)

do $$ begin
  create type public.rol_usuario as enum ('superadmin', 'usuario_normal');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.usuarios_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol public.rol_usuario not null default 'usuario_normal',
  socio_id uuid references public.socios(id),
  negocios_permitidos uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.usuarios_roles is
  'Relación usuario de Supabase Auth -> rol. negocios_permitidos listo sin uso real hasta Fase 10.';

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios_roles
    where user_id = auth.uid() and rol = 'superadmin'
  );
$$;

alter table public.usuarios_roles enable row level security;

create policy "usuarios_roles_select_authenticated" on public.usuarios_roles
  for select to authenticated using (true);

create policy "usuarios_roles_insert_superadmin" on public.usuarios_roles
  for insert to authenticated with check (public.is_superadmin());

create policy "usuarios_roles_update_superadmin" on public.usuarios_roles
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Reutiliza set_updated_at() del esquema (no extensión moddatetime)
create trigger set_updated_at_usuarios_roles
  before update on public.usuarios_roles
  for each row execute function public.set_updated_at();

-- Seed (Tomás/Samuel): Cursor no tiene los UUID de auth.users.
-- Tras aplicar la migración, correr a mano algo como:
--
-- insert into public.usuarios_roles (user_id, rol, socio_id) values
--   ('<uuid-tomas-auth>', 'superadmin', (select id from socios where nombre ilike 'Tomás%')),
--   ('<uuid-samuel-auth>', 'superadmin', (select id from socios where nombre ilike 'Samuel%'))
-- on conflict (user_id) do update set rol = excluded.rol, socio_id = excluded.socio_id;
