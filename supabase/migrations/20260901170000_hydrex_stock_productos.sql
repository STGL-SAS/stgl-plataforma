-- Stock disponible por producto terminado (calculado desde insumos de la receta)

create or replace view hydrex_stock_productos as
select
  p.id as producto_id,
  p.nombre,
  p.tipo_producto,
  floor(min(s.stock_disponible / pi.cantidad))::integer as stock_disponible
from hydrex_productos p
join hydrex_producto_insumos pi on pi.producto_id = p.id
join hydrex_stock_actual s on s.insumo_id = pi.insumo_id
group by p.id, p.nombre, p.tipo_producto;
