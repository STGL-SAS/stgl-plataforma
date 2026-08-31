create table if not exists cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('bold', 'bancaria', 'otro')),
  descripcion text,
  created_at timestamptz not null default now()
);

comment on table cuentas_bancarias is 'Cuentas reales de pago/banco (Bold, Bancolombia general). Una cuenta puede alimentar más de un negocio — el negocio real de cada movimiento se etiqueta en transacciones, no aquí.';

alter table cuentas_bancarias enable row level security;

create policy "cuentas_bancarias_authenticated_full_access"
  on cuentas_bancarias for all to authenticated using (true) with check (true);
