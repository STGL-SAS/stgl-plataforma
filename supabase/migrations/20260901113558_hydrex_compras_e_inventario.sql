create table if not exists hydrex_compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references proveedores(id),
  insumo_id uuid not null references hydrex_insumos(id),
  cantidad numeric(12,2) not null check (cantidad > 0),
  valor_total numeric(14,2) not null check (valor_total >= 0),
  costo_unitario numeric(14,4) generated always as (valor_total / nullif(cantidad, 0)) stored,
  fecha date not null default current_date,
  documento_url text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hydrex_inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references hydrex_insumos(id),
  tipo_movimiento text not null check (tipo_movimiento in ('entrada', 'salida', 'ajuste')),
  cantidad numeric(12,2) not null,
  origen text not null check (origen in ('compra', 'venta', 'ajuste_manual')),
  origen_referencia_id uuid,
  canal text,
  fecha date not null default current_date,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv_mov_insumo on hydrex_inventario_movimientos(insumo_id);
create index if not exists idx_inv_mov_origen on hydrex_inventario_movimientos(origen, origen_referencia_id);

alter table hydrex_compras enable row level security;
alter table hydrex_inventario_movimientos enable row level security;
create policy "authenticated_full_access" on hydrex_compras for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_inventario_movimientos for all to authenticated using (true) with check (true);

create or replace function fn_hydrex_compra_genera_entrada()
returns trigger as $$
begin
  insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, fecha, notas)
  values (new.insumo_id, 'entrada', new.cantidad, 'compra', new.id, new.fecha, 'Generado automáticamente desde compra');

  update hydrex_insumos
  set costo_unitario = new.costo_unitario, updated_at = now()
  where id = new.insumo_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_hydrex_compra_genera_entrada
after insert on hydrex_compras
for each row execute function fn_hydrex_compra_genera_entrada();

create or replace view hydrex_stock_actual as
select
  i.id as insumo_id,
  i.tipo_insumo,
  i.nombre,
  i.atributo_1,
  i.atributo_2,
  coalesce(sum(case
    when m.tipo_movimiento in ('entrada', 'ajuste') then m.cantidad
    else -m.cantidad
  end), 0) as stock_disponible
from hydrex_insumos i
left join hydrex_inventario_movimientos m on m.insumo_id = i.id
group by i.id, i.tipo_insumo, i.nombre, i.atributo_1, i.atributo_2;
