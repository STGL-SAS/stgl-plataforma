-- Corrige ambigüedad de "incompleto" en fn_hydrex_costo_producto_fifo:
-- RETURNS TABLE expone columnas como variables PL/pgSQL; hay que calificar el SELECT.

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
    select f.costo_total, f.incompleto
    into v_costo_linea, v_incompleto_linea
    from fn_hydrex_costo_fifo_insumo(r.insumo_id, r.cantidad_total) f;

    v_costo_total := v_costo_total + coalesce(v_costo_linea, 0);
    v_incompleto := v_incompleto or coalesce(v_incompleto_linea, true);
  end loop;

  return query select v_costo_total, v_incompleto;
end;
$$ language plpgsql stable;
