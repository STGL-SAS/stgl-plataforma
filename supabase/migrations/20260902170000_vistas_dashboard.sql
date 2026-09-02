-- Fase 8: vistas de solo lectura para el Dashboard general
-- Ajustadas al esquema real (estado Bold = pendiente_revision; HARDTECH sin
-- columna ganancia_neta; aportes.monto vive en transacciones; documentos.categoria NOT NULL).

-- Balance por negocio desde el ledger (ingresos/egresos clasificados)
create or replace view public.v_balance_por_negocio as
select
  n.id as negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  coalesce(sum(case when t.tipo = 'ingreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as ingresos,
  coalesce(sum(case when t.tipo = 'egreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as egresos,
  coalesce(sum(case when t.tipo = 'ingreso' and t.estado = 'clasificada' then t.monto else 0 end), 0)
    - coalesce(sum(case when t.tipo = 'egreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as balance
from public.negocios n
left join public.transacciones t on t.negocio_id = n.id
group by n.id, n.codigo, n.nombre;

comment on view public.v_balance_por_negocio is
  'Ingresos/egresos/balance clasificados por negocio (ledger). HARDTECH: ver también v_utilidad_hardtech.';

-- Evolución mensual (solo clasificadas)
create or replace view public.v_movimientos_mensuales as
select
  t.negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  date_trunc('month', t.fecha::timestamp)::date as mes,
  sum(case when t.tipo = 'ingreso' then t.monto else 0 end) as ingresos,
  sum(case when t.tipo = 'egreso' then t.monto else 0 end) as egresos
from public.transacciones t
join public.negocios n on n.id = t.negocio_id
where t.estado = 'clasificada'
group by t.negocio_id, n.codigo, n.nombre, date_trunc('month', t.fecha::timestamp);

-- Utilidad HARDTECH (calculada como en motor-calculo.ts; mantenimientos sin estado)
create or replace view public.v_utilidad_hardtech as
with ventas_cerradas as (
  select
    v.id,
    coalesce(v.valor_venta_final, 0) + coalesce(v.propina, 0) as ingreso,
    coalesce((
      select sum(c.monto_cop_equivalente)
      from public.hardtech_compras c
      where c.venta_id = v.id and c.agrupada_con is null
    ), 0) as costo_compras,
    coalesce((
      select sum(g.monto_cop_equivalente)
      from public.hardtech_gastos_extra g
      where g.venta_id = v.id
    ), 0) as costo_gastos,
    coalesce(v.comision_terceros_monto, 0) as comision_monto,
    coalesce(v.comision_terceros_pct, 0) as comision_pct
  from public.hardtech_ventas v
  where v.estado = 'cerrada'
),
ventas_ganancia as (
  select
    ingreso,
    costo_compras + costo_gastos as costo_total,
    ingreso - (costo_compras + costo_gastos) as ganancia,
    case
      when comision_monto > 0 then comision_monto
      when comision_pct > 0 and (ingreso - (costo_compras + costo_gastos)) > 0
        then (ingreso - (costo_compras + costo_gastos)) * comision_pct
      else 0
    end as comision
  from ventas_cerradas
),
mant_ganancia as (
  -- hardtech_mantenimientos NO tiene columna estado en el esquema actual
  -- (a diferencia de hardtech_ventas); se incluyen todos hasta que exista.
  select
    coalesce(sum(
      coalesce(anticipo_monto, 0) + coalesce(pago_final_monto, 0)
      - coalesce(honorarios_monto, 0)
      - coalesce(insumos_monto, 0)
      - coalesce(domicilio_monto, 0)
    ), 0) as total
  from public.hardtech_mantenimientos
),
gastos_ht as (
  select
    coalesce((
      select sum(gf.monto)
      from public.gastos_fijos gf
      join public.negocios n on n.id = gf.negocio_id
      where n.codigo = 'HARDTECH' and gf.activo is not false
    ), 0) as fijos,
    coalesce((
      select sum(go.monto)
      from public.gastos_ocasionales go
      join public.negocios n on n.id = go.negocio_id
      where n.codigo = 'HARDTECH'
    ), 0) as ocasionales
)
select
  coalesce((select sum(ganancia - comision) from ventas_ganancia), 0)
  + coalesce((select total from mant_ganancia), 0)
  - (select fijos from gastos_ht)
  - (select ocasionales from gastos_ht)
  as utilidad_neta;

comment on view public.v_utilidad_hardtech is
  'Utilidad neta HARDTECH: ventas cerradas + mantenimientos − gastos fijos/ocasionales del negocio.';

-- Utilidad teórica repartible (informativo)
create or replace view public.v_utilidad_repartible as
select
  sp.negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  sp.socio_id,
  s.nombre as socio_nombre,
  sp.porcentaje,
  round(vb.balance * (sp.porcentaje / 100.0), 2) as utilidad_teorica
from public.socios_participacion sp
join public.negocios n on n.id = sp.negocio_id
join public.socios s on s.id = sp.socio_id
join public.v_balance_por_negocio vb on vb.negocio_id = sp.negocio_id;

-- Aportes: el monto está en transacciones (solo clasificadas)
create or replace view public.v_aportes_por_socio as
select
  a.socio_id,
  s.nombre as socio_nombre,
  a.negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  a.clasificacion::text as clasificacion,
  sum(t.monto) as total_aportado
from public.aportes_socios a
join public.transacciones t on t.id = a.transaccion_id
join public.socios s on s.id = a.socio_id
join public.negocios n on n.id = a.negocio_id
where t.estado = 'clasificada'
group by a.socio_id, s.nombre, a.negocio_id, n.codigo, n.nombre, a.clasificacion;

-- Alertas del dashboard
create or replace view public.v_alertas_dashboard as
select 'bold_pendiente'::text as tipo, count(*)::int as cantidad
  from public.transacciones
  where origen = 'bold' and estado = 'pendiente_revision'
union all
select 'documento_sin_categorizar', count(*)::int
  from public.documentos
  where categoria is null
     or btrim(categoria) = ''
     or lower(categoria) = 'sin categorizar'
union all
select 'tarea_vencida', count(*)::int
  from public.tareas
  where fecha_limite is not null
    and fecha_limite < current_date
    and estado <> 'resuelto';

-- Tareas abiertas vs resueltas
create or replace view public.v_tareas_estado_por_negocio as
select
  t.negocio_id,
  n.codigo as negocio_codigo,
  n.nombre as negocio_nombre,
  count(*) filter (where t.estado <> 'resuelto')::int as abiertas,
  count(*) filter (where t.estado = 'resuelto')::int as resueltas
from public.tareas t
join public.negocios n on n.id = t.negocio_id
group by t.negocio_id, n.codigo, n.nombre;
