-- Alertas: incluir tareas que vencen hoy + vista por negocio

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
    and fecha_limite <= current_date
    and estado <> 'resuelto';

create or replace view public.v_alertas_por_negocio as
select t.negocio_id, n.codigo as negocio_codigo, 'bold_pendiente'::text as tipo, count(*)::int as cantidad
  from public.transacciones t
  join public.negocios n on n.id = t.negocio_id
  where t.origen = 'bold' and t.estado = 'pendiente_revision'
  group by t.negocio_id, n.codigo
union all
select d.negocio_id, n.codigo, 'documento_sin_categorizar', count(*)::int
  from public.documentos d
  join public.negocios n on n.id = d.negocio_id
  where d.categoria is null
     or btrim(d.categoria) = ''
     or lower(d.categoria) = 'sin categorizar'
  group by d.negocio_id, n.codigo
union all
select ta.negocio_id, n.codigo, 'tarea_vencida', count(*)::int
  from public.tareas ta
  join public.negocios n on n.id = ta.negocio_id
  where ta.fecha_limite is not null
    and ta.fecha_limite <= current_date
    and ta.estado <> 'resuelto'
  group by ta.negocio_id, n.codigo;
