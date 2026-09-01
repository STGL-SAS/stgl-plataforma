-- Unidades equivalentes del lote: suma de líneas de receta tipo Producto

alter table hydrex_productos drop column if exists unidades_equivalentes;

create view hydrex_productos_unidades_equivalentes as
select
  p.id as producto_id,
  coalesce(
    nullif(
      round(sum(case when r.componente_producto_id is not null then r.cantidad else 0 end))::integer,
      0
    ),
    1
  ) as unidades_equivalentes
from hydrex_productos p
left join hydrex_producto_receta r on r.producto_id = p.id
group by p.id;
