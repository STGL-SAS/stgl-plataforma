-- Receta libre por producto (reemplaza impermeable_id / sticker_id / caja_id fijos)

create table if not exists hydrex_producto_insumos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references hydrex_productos(id) on delete cascade,
  insumo_id uuid not null references hydrex_insumos(id),
  cantidad numeric(12,4) not null check (cantidad > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (producto_id, insumo_id)
);

create index if not exists idx_producto_insumos_producto on hydrex_producto_insumos(producto_id);
create index if not exists idx_producto_insumos_insumo on hydrex_producto_insumos(insumo_id);

alter table hydrex_producto_insumos enable row level security;
create policy "authenticated_full_access" on hydrex_producto_insumos for all to authenticated using (true) with check (true);

create trigger trg_hydrex_producto_insumos_updated_at before update on hydrex_producto_insumos
for each row execute function set_updated_at();

-- Backfill desde columnas fijas
insert into hydrex_producto_insumos (producto_id, insumo_id, cantidad)
select id, impermeable_id, 1 from hydrex_productos where tipo_producto = 'individual' and impermeable_id is not null
union all
select id, sticker_id, 1 from hydrex_productos where tipo_producto = 'individual' and sticker_id is not null
union all
select id, caja_id, 1 from hydrex_productos where tipo_producto = 'caja' and caja_id is not null
union all
select id, impermeable_id, unidades_por_caja from hydrex_productos where tipo_producto = 'caja' and impermeable_id is not null
union all
select id, sticker_id, unidades_por_caja from hydrex_productos where tipo_producto = 'caja' and sticker_id is not null
on conflict (producto_id, insumo_id) do nothing;

drop view if exists hydrex_productos_costo;

create view hydrex_productos_costo as
select
  p.id as producto_id,
  p.tipo_producto,
  p.nombre,
  sum(pi.cantidad * i.costo_unitario) as costo_por_unidad,
  bool_or(i.costo_unitario is null) as costo_incompleto
from hydrex_productos p
join hydrex_producto_insumos pi on pi.producto_id = p.id
join hydrex_insumos i on i.id = pi.insumo_id
group by p.id, p.tipo_producto, p.nombre;

create or replace function fn_hydrex_venta_genera_salida()
returns trigger as $$
declare
  linea record;
begin
  for linea in
    select insumo_id, cantidad
    from hydrex_producto_insumos
    where producto_id = new.producto_id
  loop
    insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, canal, fecha)
    values (linea.insumo_id, 'salida', linea.cantidad * new.cantidad, 'venta', new.id, new.canal, current_date);
  end loop;

  return new;
end;
$$ language plpgsql;

-- Drop CHECK caja_requiere_datos (nombre puede variar entre entornos)
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.hydrex_productos'::regclass
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%caja_requiere_datos%'
        or pg_get_constraintdef(c.oid) ilike '%tipo_producto = ''individual''%caja_id%'
      )
  loop
    execute format('alter table hydrex_productos drop constraint %I', r.conname);
  end loop;
end $$;

alter table hydrex_productos
  drop column if exists impermeable_id,
  drop column if exists sticker_id,
  drop column if exists caja_id,
  drop column if exists unidades_por_caja;
