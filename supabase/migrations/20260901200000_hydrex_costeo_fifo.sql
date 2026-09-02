-- Costeo FIFO real: lotes de compra, mezcla por cantidad, salidas atadas a lote

alter table hydrex_inventario_movimientos
  add column if not exists lote_compra_id uuid references hydrex_compras(id);

create index if not exists idx_inv_mov_lote on hydrex_inventario_movimientos(lote_compra_id);

create or replace view hydrex_lotes_disponibles as
select
  c.id as compra_id,
  c.insumo_id,
  c.fecha,
  c.costo_unitario,
  c.cantidad - coalesce(sum(m.cantidad) filter (
    where m.tipo_movimiento = 'salida' and m.lote_compra_id = c.id
  ), 0) as cantidad_disponible
from hydrex_compras c
left join hydrex_inventario_movimientos m on m.lote_compra_id = c.id
group by c.id, c.insumo_id, c.fecha, c.costo_unitario, c.cantidad
having c.cantidad - coalesce(sum(m.cantidad) filter (
  where m.tipo_movimiento = 'salida' and m.lote_compra_id = c.id
), 0) > 0;

create or replace function fn_hydrex_costo_fifo_insumo(p_insumo_id uuid, p_cantidad numeric)
returns table(costo_total numeric, incompleto boolean) as $$
declare
  lote record;
  restante numeric := p_cantidad;
  a_tomar numeric;
  costo_acumulado numeric := 0;
begin
  for lote in
    select cantidad_disponible, costo_unitario
    from hydrex_lotes_disponibles
    where insumo_id = p_insumo_id
    order by fecha asc, compra_id asc
  loop
    exit when restante <= 0;
    a_tomar := least(restante, lote.cantidad_disponible);
    costo_acumulado := costo_acumulado + (a_tomar * lote.costo_unitario);
    restante := restante - a_tomar;
  end loop;

  return query select costo_acumulado, (restante > 0);
end;
$$ language plpgsql stable;

create or replace function fn_hydrex_costo_producto_fifo(p_producto_id uuid, p_cantidad numeric)
returns table(costo numeric, incompleto boolean) as $$
declare
  r record;
  v_costo_total numeric := 0;
  v_incompleto boolean := false;
  v_costo_linea numeric;
  v_incompleto_linea boolean;
begin
  for r in
    select insumo_id, sum(cantidad) as cantidad_total
    from fn_hydrex_expandir_receta(p_producto_id, p_cantidad)
    group by insumo_id
  loop
    select costo_total, incompleto into v_costo_linea, v_incompleto_linea
    from fn_hydrex_costo_fifo_insumo(r.insumo_id, r.cantidad_total);

    v_costo_total := v_costo_total + coalesce(v_costo_linea, 0);
    v_incompleto := v_incompleto or coalesce(v_incompleto_linea, true);
  end loop;

  return query select v_costo_total, v_incompleto;
end;
$$ language plpgsql stable;

drop view if exists hydrex_productos_costo;

create view hydrex_productos_costo as
select
  p.id as producto_id,
  p.tipo_producto,
  p.nombre,
  c.costo as costo_por_unidad,
  c.incompleto as costo_incompleto
from hydrex_productos p
cross join lateral fn_hydrex_costo_producto_fifo(p.id, 1) as c;

create or replace function fn_descontar_insumo_fifo(
  p_insumo_id uuid, p_cantidad numeric, p_venta_detalle_id uuid, p_canal text
) returns void as $$
declare
  lote record;
  restante numeric := p_cantidad;
  a_tomar numeric;
begin
  for lote in
    select compra_id, cantidad_disponible
    from hydrex_lotes_disponibles
    where insumo_id = p_insumo_id
    order by fecha asc, compra_id asc
  loop
    exit when restante <= 0;
    a_tomar := least(restante, lote.cantidad_disponible);
    insert into hydrex_inventario_movimientos
      (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, lote_compra_id, canal, fecha)
    values
      (p_insumo_id, 'salida', a_tomar, 'venta', p_venta_detalle_id, lote.compra_id, p_canal, current_date);
    restante := restante - a_tomar;
  end loop;

  if restante > 0 then
    insert into hydrex_inventario_movimientos
      (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, lote_compra_id, canal, fecha, notas)
    values
      (p_insumo_id, 'salida', restante, 'venta', p_venta_detalle_id, null, p_canal, current_date,
       'Sin lote de compra suficiente para cubrir esta salida');
  end if;
end;
$$ language plpgsql;

create or replace function fn_hydrex_venta_genera_salida()
returns trigger as $$
declare
  linea record;
begin
  for linea in
    select insumo_id, sum(cantidad) as cantidad
    from fn_hydrex_expandir_receta(new.producto_id, new.cantidad)
    group by insumo_id
  loop
    perform fn_descontar_insumo_fifo(linea.insumo_id, linea.cantidad, new.id, new.canal);
  end loop;
  return new;
end;
$$ language plpgsql;
