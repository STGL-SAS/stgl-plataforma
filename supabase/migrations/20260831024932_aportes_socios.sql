create type clasificacion_aporte as enum ('capital', 'prestamo', 'sin_definir');

create table if not exists aportes_socios (
  id uuid primary key default gen_random_uuid(),
  transaccion_id uuid not null references transacciones(id) on delete cascade,
  socio_id uuid not null references socios(id),
  negocio_id uuid not null references negocios(id),
  clasificacion clasificacion_aporte not null default 'sin_definir',
  devuelto boolean not null default false,
  monto_devuelto numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table aportes_socios is 'Extiende una transacción de tipo aporte con el socio, negocio y clasificación (capital/préstamo — se decide en la práctica, no bloquea el registro).';

create index if not exists idx_aportes_socios_socio on aportes_socios (socio_id);
create index if not exists idx_aportes_socios_negocio on aportes_socios (negocio_id);

-- Solo se puede enlazar un aporte a una transacción de tipo 'aporte'
create or replace function chk_aporte_transaccion_tipo()
returns trigger as $$
declare
  t_tipo tipo_transaccion;
begin
  select tipo into t_tipo from transacciones where id = new.transaccion_id;
  if t_tipo <> 'aporte' then
    raise exception 'aportes_socios solo puede enlazarse a una transacción de tipo aporte (id: %)', new.transaccion_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_chk_aporte_transaccion_tipo
  before insert or update on aportes_socios
  for each row execute function chk_aporte_transaccion_tipo();

alter table aportes_socios enable row level security;

create policy "aportes_socios_authenticated_full_access"
  on aportes_socios for all to authenticated using (true) with check (true);
