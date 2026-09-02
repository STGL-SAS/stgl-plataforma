-- Fix: v_utilidad_repartible debe usar utilidad operativa HARDTECH
-- (v_utilidad_hardtech), no el balance del ledger (HARDTECH no tiene cuenta propia).

create or replace view public.v_utilidad_repartible as
select
  sp.negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  sp.socio_id,
  s.nombre as socio_nombre,
  sp.porcentaje,
  round(
    (
      case
        when n.codigo = 'HARDTECH' then
          coalesce((select utilidad_neta from public.v_utilidad_hardtech), 0)
        else
          vb.balance
      end
    ) * (sp.porcentaje / 100.0),
    2
  ) as utilidad_teorica
from public.socios_participacion sp
join public.negocios n on n.id = sp.negocio_id
join public.socios s on s.id = sp.socio_id
join public.v_balance_por_negocio vb on vb.negocio_id = sp.negocio_id;

comment on view public.v_utilidad_repartible is
  'Utilidad teórica por socio = base del negocio × % participación. Base = ledger clasificado, salvo HARDTECH (utilidad operativa).';
