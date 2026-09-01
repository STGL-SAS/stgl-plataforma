create table if not exists gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  concepto text not null,
  monto numeric(12,2) not null,
  periodicidad text not null check (periodicidad in ('mensual', 'anual', 'unico')),
  fecha date not null default current_date,
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  contacto jsonb not null default '{}'::jsonb,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gastos_fijos_negocio on gastos_fijos(negocio_id);
create index if not exists idx_clientes_negocio on clientes(negocio_id);

alter table gastos_fijos enable row level security;
alter table clientes enable row level security;
create policy "authenticated_full_access" on gastos_fijos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on clientes for all to authenticated using (true) with check (true);

-- seed gastos fijos HYDREX (negocios.codigo = 'HYDREX', nombre también es 'HYDREX')
insert into gastos_fijos (negocio_id, concepto, monto, periodicidad)
select id, 'Shopify (plan mensual)', 115000, 'mensual' from negocios where codigo = 'HYDREX'
union all
select id, 'Correo corporativo', 15000, 'mensual' from negocios where codigo = 'HYDREX'
union all
select id, 'Dominio (prorrateado mensual)', 8000, 'mensual' from negocios where codigo = 'HYDREX';
