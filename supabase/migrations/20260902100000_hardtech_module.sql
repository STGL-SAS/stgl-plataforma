-- Fase 5: módulo HARDTECH (ventas bajo pedido, mantenimientos, pagos entre socios)

-- 1.1 Negocio HARDTECH + participación 50/50
insert into negocios (codigo, nombre, estado) values
  ('HARDTECH', 'HARDTECH', 'activo')
on conflict (codigo) do update set nombre = excluded.nombre, estado = excluded.estado;

insert into socios_participacion (negocio_id, socio_id, porcentaje)
select n.id, s.id, v.porcentaje
from (values
  ('HARDTECH', 'Tomás Garcés', 50),
  ('HARDTECH', 'Samuel López', 50)
) as v(negocio_codigo, socio_nombre, porcentaje)
join negocios n on n.codigo = v.negocio_codigo
join socios s on s.nombre = v.socio_nombre
on conflict (negocio_id, socio_id) do update set porcentaje = excluded.porcentaje;

-- 1.2 Cuenta de divisas USD (misma tabla cuentas_bancarias)
alter table cuentas_bancarias
  add column if not exists moneda text not null default 'COP'
  check (moneda in ('COP', 'USD'));

alter table cuentas_bancarias drop constraint if exists cuentas_bancarias_tipo_check;
alter table cuentas_bancarias
  add constraint cuentas_bancarias_tipo_check
  check (tipo in ('bold', 'bancaria', 'otro', 'divisas'));

insert into cuentas_bancarias (nombre, tipo, descripcion, moneda)
select 'Plataforma cambio USD (HARDTECH)', 'divisas',
  'Saldo en dólares para compras internacionales de HARDTECH. Los movimientos se registran vía transacciones.',
  'USD'
where not exists (
  select 1 from cuentas_bancarias where tipo = 'divisas' and moneda = 'USD'
);

-- 1.3 Ventas
create table if not exists hardtech_ventas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente_compra'
    check (estado in ('pendiente_compra', 'pendiente_pago_final', 'cerrada')),
  fecha_cotizacion date,
  documento_cotizacion text,
  anticipo_monto numeric(14,2),
  anticipo_fecha date,
  anticipo_comprobante text,
  anticipo_nota text,
  valor_venta_final numeric(14,2),
  propina numeric(14,2) not null default 0,
  pago_final_fecha date,
  pago_final_comprobante text,
  comision_terceros_pct numeric(6,4),
  comision_terceros_destinatario text,
  comision_terceros_monto numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hardtech_ventas_cliente on hardtech_ventas(cliente_id);
create index if not exists idx_hardtech_ventas_estado on hardtech_ventas(estado);
create index if not exists idx_hardtech_ventas_fecha on hardtech_ventas(fecha_cotizacion);

-- 1.4 Compras
create table if not exists hardtech_compras (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references hardtech_ventas(id) on delete cascade,
  lugar_compra text not null,
  metodo_pago text not null,
  moneda text not null check (moneda in ('COP', 'USD')),
  monto numeric(14,2) not null check (monto >= 0),
  tasa_cambio numeric(14,4),
  monto_cop_equivalente numeric(14,2) generated always as (
    case
      when moneda = 'COP' then monto
      else monto * coalesce(tasa_cambio, 0)
    end
  ) stored,
  fecha_compra date not null default current_date,
  comprobante text,
  agrupada_con uuid references hardtech_compras(id) on delete set null,
  transaccion_divisas_id uuid references transacciones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hardtech_compras_usd_tasa check (
    moneda = 'COP' or (moneda = 'USD' and tasa_cambio is not null and tasa_cambio > 0)
  )
);

create index if not exists idx_hardtech_compras_venta on hardtech_compras(venta_id);

-- 1.5 Gastos extra
create table if not exists hardtech_gastos_extra (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references hardtech_ventas(id) on delete cascade,
  tipo text not null check (tipo in ('envio_internacional', 'empaque', 'otro')),
  monto numeric(14,2) not null check (monto >= 0),
  moneda text not null default 'COP' check (moneda in ('COP', 'USD')),
  tasa_cambio numeric(14,4),
  monto_cop_equivalente numeric(14,2) generated always as (
    case
      when moneda = 'COP' then monto
      else monto * coalesce(tasa_cambio, 0)
    end
  ) stored,
  fecha date not null default current_date,
  comprobante text,
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hardtech_gastos_venta on hardtech_gastos_extra(venta_id);

-- 1.6 Mantenimientos
create table if not exists hardtech_mantenimientos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  titulo text not null,
  descripcion text,
  fecha date not null default current_date,
  anticipo_monto numeric(14,2),
  anticipo_fecha date,
  pago_final_monto numeric(14,2),
  pago_final_fecha date,
  honorarios_monto numeric(14,2) not null default 0,
  honorarios_destinatario text,
  insumos_monto numeric(14,2) not null default 0,
  insumos_detalle jsonb not null default '[]'::jsonb,
  domicilio_monto numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hardtech_mant_cliente on hardtech_mantenimientos(cliente_id);

-- 1.7 Pagos entre socios (fondo operativo HARDTECH — NO es aporte de capital)
create table if not exists hardtech_pagos_socios (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references socios(id),
  tipo text not null check (tipo in ('socio_puso_plata', 'socio_recibio_plata')),
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  nota text,
  venta_id uuid references hardtech_ventas(id) on delete set null,
  mantenimiento_id uuid references hardtech_mantenimientos(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_hardtech_pagos_socio on hardtech_pagos_socios(socio_id);

-- Saldo por socio: positivo = HARDTECH le debe al socio (puso más de lo que recibió)
create or replace view hardtech_saldo_socios as
select
  s.id as socio_id,
  s.nombre as socio_nombre,
  coalesce(sum(case when p.tipo = 'socio_puso_plata' then p.monto else 0 end), 0) as total_puesto,
  coalesce(sum(case when p.tipo = 'socio_recibio_plata' then p.monto else 0 end), 0) as total_recibido,
  coalesce(sum(case when p.tipo = 'socio_puso_plata' then p.monto else -p.monto end), 0) as saldo_neto
from socios s
left join hardtech_pagos_socios p on p.socio_id = s.id
group by s.id, s.nombre;

-- Trigger: compra USD → egreso en cuenta divisas (transacciones)
create or replace function fn_hardtech_compra_usd_egreso()
returns trigger as $$
declare
  v_negocio_id uuid;
  v_cuenta_id uuid;
  v_tx_id uuid;
begin
  if new.moneda <> 'USD' then
    return new;
  end if;

  select id into v_negocio_id from negocios where codigo = 'HARDTECH';
  select id into v_cuenta_id from cuentas_bancarias where tipo = 'divisas' and moneda = 'USD' limit 1;

  if v_negocio_id is null or v_cuenta_id is null then
    raise exception 'No se encontró negocio HARDTECH o cuenta de divisas USD';
  end if;

  insert into transacciones (
    negocio_id, cuenta_id, tipo, categoria, monto, fecha,
    nombre_interno, observaciones, estado, origen
  ) values (
    v_negocio_id,
    v_cuenta_id,
    'egreso',
    'compra_divisas_usd',
    new.monto,
    new.fecha_compra,
    'Compra USD HARDTECH — ' || left(new.lugar_compra, 80),
    'Generado automáticamente desde hardtech_compras ' || new.id::text,
    'clasificada',
    'manual'
  )
  returning id into v_tx_id;

  update hardtech_compras set transaccion_divisas_id = v_tx_id where id = new.id;
  return new;
end;
$$ language plpgsql;

create trigger trg_hardtech_compra_usd_egreso
after insert on hardtech_compras
for each row execute function fn_hardtech_compra_usd_egreso();

-- updated_at triggers
create trigger trg_hardtech_ventas_updated_at
  before update on hardtech_ventas
  for each row execute function set_updated_at();

create trigger trg_hardtech_compras_updated_at
  before update on hardtech_compras
  for each row execute function set_updated_at();

create trigger trg_hardtech_mantenimientos_updated_at
  before update on hardtech_mantenimientos
  for each row execute function set_updated_at();

-- RLS (patrón permisivo authenticated)
alter table hardtech_ventas enable row level security;
alter table hardtech_compras enable row level security;
alter table hardtech_gastos_extra enable row level security;
alter table hardtech_mantenimientos enable row level security;
alter table hardtech_pagos_socios enable row level security;

create policy "authenticated_full_access" on hardtech_ventas for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hardtech_compras for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hardtech_gastos_extra for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hardtech_mantenimientos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hardtech_pagos_socios for all to authenticated using (true) with check (true);
