-- Prorrateo por unidades del lote + corrección costos Rappi (reporte oficial)

alter table hydrex_productos
  add column if not exists unidades_equivalentes integer not null default 1
  check (unidades_equivalentes > 0);

alter table hydrex_componentes_costo
  add column if not exists prorratea_por_lote boolean not null default false;

update hydrex_componentes_costo
set prorratea_por_lote = true
where nombre = 'Publicidad digital';

update hydrex_componentes_costo
set nombre = 'Comisión Rappi (incl. IVA)', valor = 0.119
where nombre = 'Comisión Rappi';

insert into hydrex_componentes_costo (negocio_id, nombre, tipo_calculo, valor, categoria, canales_aplica, premarcado_canales, orden)
select id, 'Gasto bancario Rappi (incl. IVA)', 'porcentaje', 0.02097, 'comision', array['rappi'], array['rappi'], 6
from negocios where codigo = 'HYDREX'
and not exists (
  select 1 from hydrex_componentes_costo c
  where c.negocio_id = negocios.id and c.nombre = 'Gasto bancario Rappi (incl. IVA)'
);

-- Packs existentes: 6 unidades equivalentes por lote
update hydrex_productos
set unidades_equivalentes = 6
where nombre in (
  'Impermeable OneSize - Pack x6',
  'OverSize - Pack x6',
  'Impermeable Mix (3OS+3OVS)'
);
