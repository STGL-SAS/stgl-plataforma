-- Socios de STGL y su % de participación por negocio
create table if not exists socios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique,
  user_id uuid references auth.users(id),
  rol text not null default 'superadmin'
    check (rol in ('superadmin', 'usuario_normal')),
  created_at timestamptz not null default now()
);

comment on table socios is 'Socios de STGL (Tomás, Samuel) y futuros colaboradores. user_id se enlaza a auth.users cuando se active login.';
comment on column socios.rol is 'Pensado para roles/permisos futuros (Fase 7) — hoy ambos socios son superadmin.';

create table if not exists socios_participacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  socio_id uuid not null references socios(id) on delete cascade,
  porcentaje numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  created_at timestamptz not null default now(),
  unique (negocio_id, socio_id)
);

comment on table socios_participacion is '% de participación de cada socio por negocio (ej. HYDREX 50/50, VirtualWaiter 43/57).';

-- Valida que la suma de % por negocio nunca pase de 100
create or replace function chk_socios_participacion_suma()
returns trigger as $$
declare
  suma numeric(5,2);
begin
  select coalesce(sum(porcentaje), 0) into suma
  from socios_participacion
  where negocio_id = new.negocio_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if suma + new.porcentaje > 100 then
    raise exception 'La suma de participación para este negocio superaría el 100%% (actual: %, nuevo: %)', suma, new.porcentaje;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_chk_socios_participacion_suma
  before insert or update on socios_participacion
  for each row execute function chk_socios_participacion_suma();

alter table socios enable row level security;
alter table socios_participacion enable row level security;

create policy "socios_authenticated_full_access"
  on socios for all to authenticated using (true) with check (true);

create policy "socios_participacion_authenticated_full_access"
  on socios_participacion for all to authenticated using (true) with check (true);
