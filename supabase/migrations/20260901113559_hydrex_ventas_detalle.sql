create table if not exists hydrex_ventas_detalle (
  id uuid primary key default gen_random_uuid(),
  transaccion_id uuid not null references transacciones(id) on delete cascade,
  producto_id uuid not null references hydrex_productos(id),
  cliente_id uuid references clientes(id),
  canal text not null check (canal in ('mercado_libre', 'rappi', 'web', 'directo')),
  cantidad integer not null check (cantidad > 0),
  precio_venta_unitario numeric(12,2) not null,
  incluye_envio boolean not null default false,
  valor_envio numeric(12,2) not null default 0,
  componentes_aplicados jsonb not null default '[]'::jsonb,
  costo_total numeric(14,2) not null,
  ganancia numeric(14,2) not null,
  margen_pct numeric(6,4) not null,
  calificacion text not null check (calificacion in ('excelente', 'ajustado', 'critico', 'perdida')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ventas_detalle_transaccion on hydrex_ventas_detalle(transaccion_id);
create index if not exists idx_ventas_detalle_producto on hydrex_ventas_detalle(producto_id);
create index if not exists idx_ventas_detalle_cliente on hydrex_ventas_detalle(cliente_id);

alter table hydrex_ventas_detalle enable row level security;
create policy "authenticated_full_access" on hydrex_ventas_detalle for all to authenticated using (true) with check (true);

create or replace function fn_hydrex_venta_genera_salida()
returns trigger as $$
declare
  p hydrex_productos%rowtype;
  unidades_totales numeric;
begin
  select * into p from hydrex_productos where id = new.producto_id;

  if p.tipo_producto = 'caja' then
    unidades_totales := new.cantidad * p.unidades_por_caja;
    insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, canal, fecha)
    values (p.caja_id, 'salida', new.cantidad, 'venta', new.id, new.canal, current_date);
  else
    unidades_totales := new.cantidad;
  end if;

  insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, canal, fecha)
  values (p.impermeable_id, 'salida', unidades_totales, 'venta', new.id, new.canal, current_date);

  insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, canal, fecha)
  values (p.sticker_id, 'salida', unidades_totales, 'venta', new.id, new.canal, current_date);

  return new;
end;
$$ language plpgsql;

create trigger trg_hydrex_venta_genera_salida
after insert on hydrex_ventas_detalle
for each row execute function fn_hydrex_venta_genera_salida();

-- Triggers updated_at (función ya existe desde Fase 2)
create trigger trg_proveedores_updated_at before update on proveedores
for each row execute function set_updated_at();
create trigger trg_hydrex_insumos_updated_at before update on hydrex_insumos
for each row execute function set_updated_at();
create trigger trg_hydrex_productos_updated_at before update on hydrex_productos
for each row execute function set_updated_at();
create trigger trg_hydrex_precios_updated_at before update on hydrex_precios
for each row execute function set_updated_at();
create trigger trg_gastos_fijos_updated_at before update on gastos_fijos
for each row execute function set_updated_at();
create trigger trg_clientes_updated_at before update on clientes
for each row execute function set_updated_at();
create trigger trg_hydrex_componentes_updated_at before update on hydrex_componentes_costo
for each row execute function set_updated_at();
create trigger trg_hydrex_envio_tarifas_updated_at before update on hydrex_envio_tarifas
for each row execute function set_updated_at();
create trigger trg_hydrex_compras_updated_at before update on hydrex_compras
for each row execute function set_updated_at();
