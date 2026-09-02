-- HARDTECH: gastos generales (fijos reutilizados + ocasionales genéricos)
-- + sync automático a hardtech_pagos_socios cuando paga un socio

-- 1.1 gastos_fijos: quién pagó con plata personal
alter table gastos_fijos
  add column if not exists pagado_por_socio_id uuid references socios(id) on delete set null;

create index if not exists idx_gastos_fijos_pagado_por
  on gastos_fijos(pagado_por_socio_id)
  where pagado_por_socio_id is not null;

-- 1.2 gastos_ocasionales (genérica — cualquier negocio)
create table if not exists gastos_ocasionales (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  concepto text not null,
  monto numeric(14,2) not null check (monto >= 0),
  fecha date not null default current_date,
  comprobante text,
  pagado_por_socio_id uuid references socios(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_ocasionales_negocio on gastos_ocasionales(negocio_id);
create index if not exists idx_gastos_ocasionales_fecha on gastos_ocasionales(fecha);

alter table gastos_ocasionales enable row level security;
create policy "authenticated_full_access" on gastos_ocasionales
  for all to authenticated using (true) with check (true);

-- Referencias en hardtech_pagos_socios para sync / cascade
alter table hardtech_pagos_socios
  add column if not exists gasto_fijo_id uuid references gastos_fijos(id) on delete cascade;

alter table hardtech_pagos_socios
  add column if not exists gasto_ocasional_id uuid references gastos_ocasionales(id) on delete cascade;

create unique index if not exists idx_hardtech_pagos_gasto_fijo
  on hardtech_pagos_socios(gasto_fijo_id)
  where gasto_fijo_id is not null;

create unique index if not exists idx_hardtech_pagos_gasto_ocasional
  on hardtech_pagos_socios(gasto_ocasional_id)
  where gasto_ocasional_id is not null;

-- Helper: solo HARDTECH genera fondo de socios
create or replace function fn_is_negocio_hardtech(p_negocio_id uuid)
returns boolean as $$
  select exists (
    select 1 from negocios where id = p_negocio_id and codigo = 'HARDTECH'
  );
$$ language sql stable;

-- Sync gasto fijo → hardtech_pagos_socios
create or replace function fn_hardtech_gasto_fijo_pago_socio()
returns trigger as $$
begin
  if not fn_is_negocio_hardtech(new.negocio_id) then
    return new;
  end if;

  delete from hardtech_pagos_socios where gasto_fijo_id = new.id;

  if new.pagado_por_socio_id is null then
    return new;
  end if;

  if coalesce(new.activo, true) = false then
    return new;
  end if;

  insert into hardtech_pagos_socios (
    socio_id, tipo, monto, fecha, nota, gasto_fijo_id
  ) values (
    new.pagado_por_socio_id,
    'socio_puso_plata',
    new.monto,
    new.fecha,
    'Gasto fijo HARDTECH: ' || left(new.concepto, 120),
    new.id
  );

  return new;
end;
$$ language plpgsql;

create trigger trg_hardtech_gasto_fijo_pago_socio
after insert or update on gastos_fijos
for each row execute function fn_hardtech_gasto_fijo_pago_socio();

-- Sync gasto ocasional → hardtech_pagos_socios
create or replace function fn_hardtech_gasto_ocasional_pago_socio()
returns trigger as $$
begin
  if not fn_is_negocio_hardtech(new.negocio_id) then
    return new;
  end if;

  delete from hardtech_pagos_socios where gasto_ocasional_id = new.id;

  if new.pagado_por_socio_id is null then
    return new;
  end if;

  insert into hardtech_pagos_socios (
    socio_id, tipo, monto, fecha, nota, gasto_ocasional_id
  ) values (
    new.pagado_por_socio_id,
    'socio_puso_plata',
    new.monto,
    new.fecha,
    'Gasto ocasional HARDTECH: ' || left(new.concepto, 120),
    new.id
  );

  return new;
end;
$$ language plpgsql;

create trigger trg_hardtech_gasto_ocasional_pago_socio
after insert or update on gastos_ocasionales
for each row execute function fn_hardtech_gasto_ocasional_pago_socio();
