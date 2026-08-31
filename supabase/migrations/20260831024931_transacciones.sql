create type tipo_transaccion as enum ('ingreso', 'egreso', 'aporte', 'intercompania');
create type estado_transaccion as enum ('pendiente_revision', 'clasificada');
create type origen_transaccion as enum ('manual', 'bold', 'shopify');

create table if not exists transacciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  cuenta_id uuid references cuentas_bancarias(id),
  tipo tipo_transaccion not null,
  categoria text,
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  nombre_original text,
  nombre_interno text,
  observaciones text,
  estado estado_transaccion not null default 'pendiente_revision',
  origen origen_transaccion not null default 'manual',
  origen_referencia_id text,
  metadata jsonb not null default '{}'::jsonb,
  creado_por uuid references socios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transacciones_clasificada_requiere_datos check (
    estado <> 'clasificada' or (nombre_interno is not null and categoria is not null)
  )
);

comment on table transacciones is 'Ledger central: todo ingreso/egreso/aporte/intercompañía de cualquier negocio pasa por aquí. aportes_socios y movimientos_intercompania la extienden con sus datos propios, sin duplicar el balance.';
comment on column transacciones.origen is 'Cómo entró el dato al sistema (manual/bold/shopify) — NO es el canal de venta de HYDREX, eso vive en el módulo de costeo (Fase 4).';
comment on column transacciones.origen_referencia_id is 'ID de la transacción en Bold u otra fuente externa, para evitar duplicados al sincronizar.';
comment on column transacciones.nombre_original is 'Nombre/descripción tal cual la reporta Bold u otro origen automático.';

create unique index if not exists transacciones_origen_referencia_unica
  on transacciones (origen, origen_referencia_id)
  where origen_referencia_id is not null;

create index if not exists idx_transacciones_negocio_fecha on transacciones (negocio_id, fecha);
create index if not exists idx_transacciones_estado on transacciones (estado);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_transacciones_updated_at
  before update on transacciones
  for each row execute function set_updated_at();

alter table transacciones enable row level security;

create policy "transacciones_authenticated_full_access"
  on transacciones for all to authenticated using (true) with check (true);
