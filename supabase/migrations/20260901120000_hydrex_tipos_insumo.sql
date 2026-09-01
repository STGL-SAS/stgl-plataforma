create table if not exists hydrex_tipos_insumo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  label_atributo_1 text not null default 'Tipo',
  label_atributo_2 text,
  requiere_atributo_2 boolean not null default true,
  usa_costo_arte boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hydrex_tipos_insumo enable row level security;
create policy "authenticated_full_access" on hydrex_tipos_insumo for all to authenticated using (true) with check (true);

insert into hydrex_tipos_insumo (codigo, nombre, label_atributo_1, label_atributo_2, requiere_atributo_2, usa_costo_arte, orden) values
  ('impermeable', 'Impermeables', 'Tipo', 'Talla', true, false, 1),
  ('sticker', 'Stickers', 'Material', 'Talla', true, false, 2),
  ('caja', 'Cajas', 'Tipo', null, false, true, 3);

alter table hydrex_insumos add column if not exists tipo_insumo_id uuid references hydrex_tipos_insumo(id);

update hydrex_insumos i
set tipo_insumo_id = t.id
from hydrex_tipos_insumo t
where t.codigo = i.tipo_insumo
  and i.tipo_insumo_id is null;

alter table hydrex_insumos alter column tipo_insumo_id set not null;

-- Actualizar dependientes antes de dropear la columna vieja
drop view if exists hydrex_stock_actual;

create view hydrex_stock_actual as
select
  i.id as insumo_id,
  t.codigo as tipo_insumo_codigo,
  t.nombre as tipo_insumo_nombre,
  i.nombre,
  i.atributo_1,
  i.atributo_2,
  coalesce(sum(case
    when m.tipo_movimiento in ('entrada', 'ajuste') then m.cantidad
    else -m.cantidad
  end), 0) as stock_disponible
from hydrex_insumos i
join hydrex_tipos_insumo t on t.id = i.tipo_insumo_id
left join hydrex_inventario_movimientos m on m.insumo_id = i.id
group by i.id, t.codigo, t.nombre, i.nombre, i.atributo_1, i.atributo_2;

-- Drop CHECK y UNIQUE viejos sobre tipo_insumo (nombres pueden variar entre entornos)
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.hydrex_insumos'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%tipo_insumo%'
      and pg_get_constraintdef(c.oid) not ilike '%tipo_insumo_id%'
  loop
    execute format('alter table hydrex_insumos drop constraint %I', r.conname);
  end loop;

  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.hydrex_insumos'::regclass
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%tipo_insumo%'
      and pg_get_constraintdef(c.oid) not ilike '%tipo_insumo_id%'
  loop
    execute format('alter table hydrex_insumos drop constraint %I', r.conname);
  end loop;
end $$;

alter table hydrex_insumos
  add constraint hydrex_insumos_tipo_insumo_id_atributo_1_atributo_2_key
  unique (tipo_insumo_id, atributo_1, atributo_2);

alter table hydrex_insumos drop column if exists tipo_insumo;

create index if not exists idx_hydrex_insumos_tipo on hydrex_insumos(tipo_insumo_id);

create trigger trg_hydrex_tipos_insumo_updated_at before update on hydrex_tipos_insumo
for each row execute function set_updated_at();
