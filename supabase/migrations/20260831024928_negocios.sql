-- Los 3 negocios de STGL + STGL como entidad general (paraguas)
create extension if not exists pgcrypto;

create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  estado text not null default 'activo'
    check (estado in ('activo', 'en_desarrollo', 'inactivo')),
  created_at timestamptz not null default now()
);

comment on table negocios is 'Los 3 negocios de STGL + STGL como entidad general.';
comment on column negocios.codigo is 'Identificador corto estable: HYDREX, HANGARC, VIRTUALWAITER, STGL';

alter table negocios enable row level security;

create policy "negocios_authenticated_full_access"
  on negocios for all
  to authenticated
  using (true)
  with check (true);
