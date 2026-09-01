-- Retención en fuente e ICA Mercado Libre (simulador oficial ML)

update hydrex_componentes_costo
set nombre = 'Retención en fuente Mercado Libre',
    valor = 0.015,
    canales_aplica = array['mercado_libre'],
    premarcado_canales = array[]::text[]
where nombre in ('Retención en fuente', 'Retención en fuente Mercado Libre');

insert into hydrex_componentes_costo (negocio_id, nombre, tipo_calculo, valor, categoria, canales_aplica, premarcado_canales, orden)
select id, 'ICA retención Mercado Libre', 'porcentaje', 0.002, 'impuesto', array['mercado_libre'], array[]::text[], 13
from negocios where codigo = 'HYDREX'
and not exists (
  select 1 from hydrex_componentes_costo c
  where c.negocio_id = negocios.id and c.nombre = 'ICA retención Mercado Libre'
);

-- 4x1000: desactivado (ingresos HYDREX vía Bold, no aplica GMF en retiros de canal)
update hydrex_componentes_costo
set activo = false, premarcado_canales = array[]::text[]
where nombre = '4x1000 (GMF)';
