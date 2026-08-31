create table if not exists movimientos_intercompania (
  id uuid primary key default gen_random_uuid(),
  negocio_origen_id uuid not null references negocios(id),
  negocio_destino_id uuid not null references negocios(id),
  transaccion_origen_id uuid references transacciones(id),
  transaccion_destino_id uuid references transacciones(id),
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  concepto text not null,
  observaciones text,
  created_at timestamptz not null default now(),
  constraint movimientos_intercompania_negocios_distintos
    check (negocio_origen_id <> negocio_destino_id)
);

comment on table movimientos_intercompania is 'Cuando un negocio le presta/transfiere plata a otro. transaccion_origen_id (egreso) y transaccion_destino_id (ingreso) enlazan cada lado al ledger de transacciones para que el balance de cada negocio quede exacto.';

create index if not exists idx_movim_intercomp_origen on movimientos_intercompania (negocio_origen_id);
create index if not exists idx_movim_intercomp_destino on movimientos_intercompania (negocio_destino_id);

alter table movimientos_intercompania enable row level security;

create policy "movimientos_intercompania_authenticated_full_access"
  on movimientos_intercompania for all to authenticated using (true) with check (true);
