-- Receta recursiva: cada línea referencia un insumo crudo O otro producto

alter table hydrex_producto_insumos rename to hydrex_producto_receta;

alter table hydrex_producto_receta
  add column componente_producto_id uuid references hydrex_productos(id);

alter table hydrex_producto_receta
  alter column insumo_id drop not null;

alter table hydrex_producto_receta
  add constraint receta_una_sola_referencia check (
    (insumo_id is not null and componente_producto_id is null)
    or (insumo_id is null and componente_producto_id is not null)
  );

alter table hydrex_producto_receta
  add constraint receta_no_autoreferencia
  check (componente_producto_id is distinct from producto_id);

create index if not exists idx_producto_receta_componente
  on hydrex_producto_receta(componente_producto_id);

create or replace function fn_prevenir_ciclo_receta()
returns trigger as $$
begin
  if new.componente_producto_id is not null then
    if exists (
      with recursive arbol as (
        select componente_producto_id as id
        from hydrex_producto_receta
        where producto_id = new.componente_producto_id
          and componente_producto_id is not null
        union
        select r.componente_producto_id
        from hydrex_producto_receta r
        join arbol a on r.producto_id = a.id
        where r.componente_producto_id is not null
      )
      select 1 from arbol where id = new.producto_id
    ) then
      raise exception 'Ciclo detectado: % ya depende de % en su receta, no se puede usar como componente', new.componente_producto_id, new.producto_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevenir_ciclo_receta
before insert or update on hydrex_producto_receta
for each row execute function fn_prevenir_ciclo_receta();

create or replace function fn_hydrex_costo_producto(p_producto_id uuid)
returns table(costo numeric, incompleto boolean) as $$
declare
  r record;
  v_costo numeric := 0;
  v_incompleto boolean := false;
  v_costo_linea numeric;
  v_incompleto_linea boolean;
begin
  for r in
    select insumo_id, componente_producto_id, cantidad
    from hydrex_producto_receta
    where producto_id = p_producto_id
  loop
    if r.insumo_id is not null then
      select i.costo_unitario, i.costo_unitario is null
      into v_costo_linea, v_incompleto_linea
      from hydrex_insumos i where i.id = r.insumo_id;
    else
      select c.costo, c.incompleto
      into v_costo_linea, v_incompleto_linea
      from fn_hydrex_costo_producto(r.componente_producto_id) c;
    end if;

    v_costo := v_costo + (r.cantidad * coalesce(v_costo_linea, 0));
    v_incompleto := v_incompleto or coalesce(v_incompleto_linea, true);
  end loop;

  return query select v_costo, v_incompleto;
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
cross join lateral fn_hydrex_costo_producto(p.id) as c;

create or replace function fn_hydrex_stock_producto(p_producto_id uuid)
returns integer as $$
declare
  r record;
  v_min numeric;
  v_actual numeric;
begin
  v_min := null;

  for r in
    select insumo_id, componente_producto_id, cantidad
    from hydrex_producto_receta
    where producto_id = p_producto_id
  loop
    if r.insumo_id is not null then
      select coalesce(stock_disponible, 0) into v_actual
      from hydrex_stock_actual where insumo_id = r.insumo_id;
    else
      v_actual := fn_hydrex_stock_producto(r.componente_producto_id);
    end if;

    v_actual := coalesce(v_actual, 0) / r.cantidad;

    if v_min is null or v_actual < v_min then
      v_min := v_actual;
    end if;
  end loop;

  return floor(coalesce(v_min, 0))::integer;
end;
$$ language plpgsql stable;

drop view if exists hydrex_stock_productos;

create view hydrex_stock_productos as
select
  p.id as producto_id,
  p.nombre,
  p.tipo_producto,
  fn_hydrex_stock_producto(p.id) as stock_disponible
from hydrex_productos p;

create or replace function fn_hydrex_expandir_receta(p_producto_id uuid, p_multiplicador numeric)
returns table(insumo_id uuid, cantidad numeric) as $$
begin
  return query
  select r.insumo_id, r.cantidad * p_multiplicador
  from hydrex_producto_receta r
  where r.producto_id = p_producto_id and r.insumo_id is not null

  union all

  select e.insumo_id, e.cantidad
  from hydrex_producto_receta r
  cross join lateral fn_hydrex_expandir_receta(r.componente_producto_id, r.cantidad * p_multiplicador) e
  where r.producto_id = p_producto_id and r.componente_producto_id is not null;
end;
$$ language plpgsql stable;

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
    insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, canal, fecha)
    values (linea.insumo_id, 'salida', linea.cantidad, 'venta', new.id, new.canal, current_date);
  end loop;
  return new;
end;
$$ language plpgsql;
