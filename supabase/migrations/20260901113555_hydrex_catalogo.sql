-- Proveedores (genérico: aunque hoy solo lo usa HYDREX, no lo prefijes)
create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  datos_pago jsonb not null default '{}'::jsonb,
  condiciones text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hydrex_insumos (
  id uuid primary key default gen_random_uuid(),
  tipo_insumo text not null check (tipo_insumo in ('impermeable', 'sticker', 'caja')),
  nombre text not null,
  atributo_1 text not null,
  atributo_2 text,
  costo_unitario numeric(12,2) not null default 0,
  costo_arte numeric(12,2),
  unidad_medida text not null default 'unidad',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_insumo, atributo_1, atributo_2)
);

create table if not exists hydrex_productos (
  id uuid primary key default gen_random_uuid(),
  tipo_producto text not null check (tipo_producto in ('individual', 'caja')),
  nombre text not null,
  impermeable_id uuid not null references hydrex_insumos(id),
  sticker_id uuid not null references hydrex_insumos(id),
  caja_id uuid references hydrex_insumos(id),
  unidades_por_caja integer,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caja_requiere_datos check (
    (tipo_producto = 'individual' and caja_id is null and unidades_por_caja is null)
    or (tipo_producto = 'caja' and caja_id is not null and unidades_por_caja is not null and unidades_por_caja > 0)
  )
);

create or replace view hydrex_productos_costo as
select
  p.id as producto_id,
  p.tipo_producto,
  p.nombre,
  case
    when p.tipo_producto = 'individual' then imp.costo_unitario + stk.costo_unitario
    else caja.costo_unitario + (imp.costo_unitario + stk.costo_unitario) * p.unidades_por_caja
  end as costo_total_lote,
  case
    when p.tipo_producto = 'individual' then imp.costo_unitario + stk.costo_unitario
    else (caja.costo_unitario + (imp.costo_unitario + stk.costo_unitario) * p.unidades_por_caja) / p.unidades_por_caja
  end as costo_por_unidad
from hydrex_productos p
join hydrex_insumos imp on imp.id = p.impermeable_id
join hydrex_insumos stk on stk.id = p.sticker_id
left join hydrex_insumos caja on caja.id = p.caja_id;

create table if not exists hydrex_precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references hydrex_productos(id) on delete cascade,
  tipo_precio text not null check (tipo_precio in ('individual', 'caja', 'distribuidor')),
  cantidad_min integer not null default 1,
  cantidad_max integer,
  precio_unitario numeric(12,2) not null,
  descuento_pct numeric(5,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hydrex_precios_producto on hydrex_precios(producto_id);

alter table proveedores enable row level security;
alter table hydrex_insumos enable row level security;
alter table hydrex_productos enable row level security;
alter table hydrex_precios enable row level security;

create policy "authenticated_full_access" on proveedores for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_insumos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_productos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_precios for all to authenticated using (true) with check (true);
