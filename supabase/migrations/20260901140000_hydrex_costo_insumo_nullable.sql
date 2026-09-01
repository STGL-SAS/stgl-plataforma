alter table hydrex_insumos alter column costo_unitario drop not null;
alter table hydrex_insumos alter column costo_unitario drop default;
alter table hydrex_insumos alter column costo_unitario set default null;

-- Los insumos creados sin compra no deben quedar en 0
update hydrex_insumos
set costo_unitario = null
where costo_unitario = 0
  and not exists (
    select 1 from hydrex_compras c where c.insumo_id = hydrex_insumos.id
  );
