create table if not exists hydrex_componentes_costo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  tipo_calculo text not null check (tipo_calculo in ('porcentaje', 'valor_fijo', 'valor_por_unidad')),
  valor numeric(14,6) not null,
  categoria text,
  canales_aplica text[] not null default '{}',
  premarcado_canales text[] not null default '{}',
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_componentes_negocio on hydrex_componentes_costo(negocio_id);

alter table hydrex_componentes_costo enable row level security;
create policy "authenticated_full_access" on hydrex_componentes_costo for all to authenticated using (true) with check (true);

insert into hydrex_componentes_costo (negocio_id, nombre, tipo_calculo, valor, categoria, canales_aplica, premarcado_canales, orden)
select id, 'Publicidad digital', 'porcentaje', 0.10, 'publicidad', array['mercado_libre','rappi','web','directo'], array['mercado_libre','rappi','web','directo'], 1 from negocios where codigo = 'HYDREX'
union all select id, 'Comisión Mercado Libre', 'porcentaje', 0.15, 'comision', array['mercado_libre'], array['mercado_libre'], 2 from negocios where codigo = 'HYDREX'
union all select id, 'Comisión Rappi', 'porcentaje', 0.15, 'comision', array['rappi'], array['rappi'], 3 from negocios where codigo = 'HYDREX'
union all select id, 'Comisión pasarela web (Bold)', 'porcentaje', 0.031, 'comision', array['web'], array['web'], 4 from negocios where codigo = 'HYDREX'
union all select id, 'Costo fijo pasarela web', 'valor_fijo', 900, 'comision', array['web'], array['web'], 5 from negocios where codigo = 'HYDREX'
union all select id, 'Logística Rappi', 'valor_fijo', 2500, 'logistica', array['rappi'], array['rappi'], 6 from negocios where codigo = 'HYDREX'
union all select id, 'Bodegaje fulfillment', 'valor_por_unidad', 200, 'logistica', array['mercado_libre','rappi','web','directo'], array[]::text[], 7 from negocios where codigo = 'HYDREX'
union all select id, 'Empaque adicional', 'valor_fijo', 150, 'logistica', array['mercado_libre','rappi','web','directo'], array[]::text[], 8 from negocios where codigo = 'HYDREX'
union all select id, 'Flete masivo B2B', 'valor_por_unidad', 8000, 'logistica', array['directo'], array[]::text[], 9 from negocios where codigo = 'HYDREX'
union all select id, 'Retención en fuente', 'porcentaje', 0.025, 'impuesto', array['mercado_libre','rappi'], array['mercado_libre','rappi'], 10 from negocios where codigo = 'HYDREX'
union all select id, '4x1000 (GMF)', 'porcentaje', 0.004, 'impuesto', array['mercado_libre','rappi','web','directo'], array['mercado_libre','rappi','web','directo'], 11 from negocios where codigo = 'HYDREX'
union all select id, 'ICA Medellín', 'porcentaje', 0, 'impuesto', array['mercado_libre','rappi','web','directo'], array[]::text[], 12 from negocios where codigo = 'HYDREX'
union all select id, 'Autorretención', 'porcentaje', 0, 'impuesto', array['mercado_libre','rappi','web','directo'], array[]::text[], 13 from negocios where codigo = 'HYDREX'
union all select id, 'Costo administrativo prorrateado', 'valor_por_unidad', 1650, 'admin', array['mercado_libre','rappi','web','directo'], array[]::text[], 14 from negocios where codigo = 'HYDREX';

create table if not exists hydrex_envio_tarifas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  valor_referencia numeric(12,2) not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hydrex_envio_tarifas enable row level security;
create policy "authenticated_full_access" on hydrex_envio_tarifas for all to authenticated using (true) with check (true);

insert into hydrex_envio_tarifas (negocio_id, nombre, valor_referencia, orden)
select id, 'Ciudad local (Medellín)', 9000, 1 from negocios where codigo = 'HYDREX'
union all
select id, 'Otras ciudades', 15000, 2 from negocios where codigo = 'HYDREX';
