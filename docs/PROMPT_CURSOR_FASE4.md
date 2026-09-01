# FASE 4 — STGL Platform: Costeo e Inventario HYDREX

## Contexto para Cursor

Estás trabajando en el repo `STGL-SAS/stgl-plataforma` (Next.js + TypeScript +
Tailwind, Supabase/Postgres, desplegado en Vercel). Las Fases 2 y 3 ya están
completas y validadas: existen las tablas `negocios`, `socios`,
`cuentas_bancarias`, `transacciones`, `aportes_socios`,
`movimientos_intercompania`, `bold_webhook_events`, `ajustes_contabilidad`, y
el módulo `contabilidad/` funcionando con Bold conectado.

Esta fase construye el módulo de **Costeo e Inventario de HYDREX**, exclusivo
de ese negocio. Sigue la regla no negociable de la sección 11 del documento
de requerimientos: este módulo no debe mezclarse ni interferir con HANGARC o
VirtualWaiter. Vive en `src/modules/inventario-hydrex/`.

### Reglas de alcance (no te saltes esto)

- **No corras `supabase db push` ni `supabase link`.** Tomás corre las
  migraciones y maneja las credenciales él mismo, desde su propia terminal.
  Tu trabajo es dejar los archivos de migración listos con
  `supabase migration new <nombre>` y el SQL correspondiente adentro.
- **No necesitas ni debes pedir la `service_role key`, connection strings, ni
  ningún secreto.** Si tu flujo normal te pide credenciales de base de datos,
  detente ahí — es scaffolding, no ejecución.
- Antes de generar el código de acceso a datos, **verifica los nombres reales
  de columnas ya desplegadas** (`negocios`, `transacciones`, etc.) contra el
  schema actual — no asumas nombres. En la Fase 3 esto causó retrabajo.
- Todo el módulo va en `src/modules/inventario-hydrex/`. La única
  integración permitida con otros módulos es un punto puntual en el
  formulario de ingreso de `contabilidad/` (ver sección 7 de este prompt) —
  todo lo demás vive aislado.

---

## 1. Estructura de carpetas

```
src/modules/inventario-hydrex/
  lib/
    motor-calculo.ts        # función pura, sin efectos secundarios (sección 5)
    tipos.ts                 # tipos compartidos del módulo
    queries.ts                # helpers de acceso a datos (Supabase client)
  components/
    CatalogoInsumos.tsx
    CatalogoProductos.tsx
    ComponentesCosto.tsx
    CalculadoraVenta.tsx
    InventarioStock.tsx
    ProveedoresCompras.tsx
    GastosFijosPuntoEquilibrio.tsx
    ClientesHydrex.tsx
    VentaHydrexFormExtension.tsx   # se monta dentro del form de contabilidad
  app/
    inventario-hydrex/
      catalogo/page.tsx
      componentes-costo/page.tsx
      calculadora/page.tsx
      stock/page.tsx
      proveedores/page.tsx
      gastos-fijos/page.tsx
      clientes/page.tsx
```

---

## 2. Migraciones

Crea **5 migraciones**, en este orden (las dependencias entre tablas lo
exigen). Usa `supabase migration new <nombre>` para cada una y pega el SQL
correspondiente.

> Antes de correr los `insert` de seed, confirma que `negocios` tiene una
> columna `nombre` con el valor literal `'HYDREX'` — si el schema real usa
> otro nombre de columna o de negocio, ajusta el `where` antes de dejarlo en
> el archivo de migración.

### 2.1 `hydrex_catalogo`

```sql
-- Proveedores (genérico: aunque hoy solo lo usa HYDREX, no lo prefijes)
create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  datos_pago jsonb not null default '{}'::jsonb,
  condiciones text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catálogo de insumos base: impermeables, stickers, cajas.
-- Cada combinación tipo+talla (o material+talla) es un ítem independiente.
create table if not exists hydrex_insumos (
  id uuid primary key default gen_random_uuid(),
  tipo_insumo text not null check (tipo_insumo in ('impermeable', 'sticker', 'caja')),
  nombre text not null,
  atributo_1 text not null, -- tipo (Reflectivo/Premium) | material (papel/waterproof/laminado) | tipo caja (regular/impresa)
  atributo_2 text,          -- talla (One Size/Oversize); null para cajas
  costo_unitario numeric(12,2) not null default 0, -- IVA incluido, se actualiza solo desde compras (ver 2.4)
  costo_arte numeric(12,2), -- solo cajas: costo único de diseño, NO se prorratea por unidad
  unidad_medida text not null default 'unidad',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_insumo, atributo_1, atributo_2)
);

-- Productos vendibles: individual (impermeable + sticker) o caja (caja + N unidades).
-- El pack casi siempre es de 6 (por eso unidades_por_caja queda como dato,
-- no fijo a 6 en código), pero cuando venden una cantidad suelta distinta
-- (ej. 3 unidades) NO se crea un producto "pack de 3": se registra como
-- producto individual con cantidad = 3 en la venta.
create table if not exists hydrex_productos (
  id uuid primary key default gen_random_uuid(),
  tipo_producto text not null check (tipo_producto in ('individual', 'caja')),
  nombre text not null,
  impermeable_id uuid not null references hydrex_insumos(id),
  sticker_id uuid not null references hydrex_insumos(id),
  caja_id uuid references hydrex_insumos(id),
  unidades_por_caja integer,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caja_requiere_datos check (
    (tipo_producto = 'individual' and caja_id is null and unidades_por_caja is null)
    or (tipo_producto = 'caja' and caja_id is not null and unidades_por_caja is not null and unidades_por_caja > 0)
  )
);

-- Costo dinámico por producto (nunca se digita a mano, sale de los insumos)
create or replace view hydrex_productos_costo as
select
  p.id as producto_id,
  p.tipo_producto,
  p.nombre,
  case
    when p.tipo_producto = 'individual' then imp.costo_unitario + stk.costo_unitario
    else caja.costo_unitario + (imp.costo_unitario + stk.costo_unitario) * p.unidades_por_caja
  end as costo_total_lote,
  case
    when p.tipo_producto = 'individual' then imp.costo_unitario + stk.costo_unitario
    else (caja.costo_unitario + (imp.costo_unitario + stk.costo_unitario) * p.unidades_por_caja) / p.unidades_por_caja
  end as costo_por_unidad
from hydrex_productos p
join hydrex_insumos imp on imp.id = p.impermeable_id
join hydrex_insumos stk on stk.id = p.sticker_id
left join hydrex_insumos caja on caja.id = p.caja_id;

-- Precios: individual, caja (con descuento por 2+), distribuidor por tramos de volumen
create table if not exists hydrex_precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references hydrex_productos(id) on delete cascade,
  tipo_precio text not null check (tipo_precio in ('individual', 'caja', 'distribuidor')),
  cantidad_min integer not null default 1,
  cantidad_max integer, -- null = sin tope superior (ej. tramo "500+")
  precio_unitario numeric(12,2) not null,
  descuento_pct numeric(5,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hydrex_precios_producto on hydrex_precios(producto_id);

alter table proveedores enable row level security;
alter table hydrex_insumos enable row level security;
alter table hydrex_productos enable row level security;
alter table hydrex_precios enable row level security;

create policy "authenticated_full_access" on proveedores for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_insumos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_productos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_precios for all to authenticated using (true) with check (true);
```

### 2.2 `gastos_fijos_y_clientes` (tablas genéricas, reutilizables en Fase 6)

```sql
create table if not exists gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  concepto text not null,
  monto numeric(12,2) not null,
  periodicidad text not null check (periodicidad in ('mensual', 'anual', 'unico')),
  fecha date not null default current_date,
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  contacto jsonb not null default '{}'::jsonb, -- teléfono, email, dirección — libre según el tipo de negocio
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gastos_fijos_negocio on gastos_fijos(negocio_id);
create index if not exists idx_clientes_negocio on clientes(negocio_id);

alter table gastos_fijos enable row level security;
alter table clientes enable row level security;
create policy "authenticated_full_access" on gastos_fijos for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on clientes for all to authenticated using (true) with check (true);

-- seed de gastos fijos de HYDREX (valores tomados del Excel, editables luego desde la plataforma)
insert into gastos_fijos (negocio_id, concepto, monto, periodicidad)
select id, 'Shopify (plan mensual)', 115000, 'mensual' from negocios where nombre = 'HYDREX'
union all
select id, 'Correo corporativo', 15000, 'mensual' from negocios where nombre = 'HYDREX'
union all
select id, 'Dominio (prorrateado mensual)', 8000, 'mensual' from negocios where nombre = 'HYDREX';
```

### 2.3 `hydrex_componentes_costo`

```sql
create table if not exists hydrex_componentes_costo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null,
  tipo_calculo text not null check (tipo_calculo in ('porcentaje', 'valor_fijo', 'valor_por_unidad')),
  valor numeric(14,6) not null,
  categoria text, -- 'publicidad' | 'comision' | 'logistica' | 'impuesto' | 'admin' — solo agrupa en UI
  canales_aplica text[] not null default '{}',   -- canales donde este componente puede aplicar
  premarcado_canales text[] not null default '{}', -- canales donde viene marcado por defecto
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_componentes_negocio on hydrex_componentes_costo(negocio_id);

alter table hydrex_componentes_costo enable row level security;
create policy "authenticated_full_access" on hydrex_componentes_costo for all to authenticated using (true) with check (true);

-- Seed replicando la hoja "PRECIOS BASE" del Excel. Los toggles por defecto
-- (premarcado_canales) reproducen la lógica exacta encontrada en las
-- fórmulas del Excel (ver sección 5.3 de este documento).
insert into hydrex_componentes_costo (negocio_id, nombre, tipo_calculo, valor, categoria, canales_aplica, premarcado_canales, orden)
select id, 'Publicidad digital', 'porcentaje', 0.10, 'publicidad', array['mercado_libre','rappi','web','directo'], array['mercado_libre','rappi','web','directo'], 1 from negocios where nombre = 'HYDREX'
union all select id, 'Comisión Mercado Libre', 'porcentaje', 0.15, 'comision', array['mercado_libre'], array['mercado_libre'], 2 from negocios where nombre = 'HYDREX'
union all select id, 'Comisión Rappi', 'porcentaje', 0.15, 'comision', array['rappi'], array['rappi'], 3 from negocios where nombre = 'HYDREX'
union all select id, 'Comisión pasarela web (Bold)', 'porcentaje', 0.031, 'comision', array['web'], array['web'], 4 from negocios where nombre = 'HYDREX'
union all select id, 'Costo fijo pasarela web', 'valor_fijo', 900, 'comision', array['web'], array['web'], 5 from negocios where nombre = 'HYDREX'
union all select id, 'Logística Rappi', 'valor_fijo', 2500, 'logistica', array['rappi'], array['rappi'], 6 from negocios where nombre = 'HYDREX'
union all select id, 'Bodegaje fulfillment', 'valor_por_unidad', 200, 'logistica', array['mercado_libre','rappi','web','directo'], array[]::text[], 7 from negocios where nombre = 'HYDREX'
union all select id, 'Empaque adicional', 'valor_fijo', 150, 'logistica', array['mercado_libre','rappi','web','directo'], array[]::text[], 8 from negocios where nombre = 'HYDREX'
union all select id, 'Flete masivo B2B', 'valor_por_unidad', 8000, 'logistica', array['directo'], array[]::text[], 9 from negocios where nombre = 'HYDREX'
union all select id, 'Retención en fuente', 'porcentaje', 0.025, 'impuesto', array['mercado_libre','rappi'], array['mercado_libre','rappi'], 10 from negocios where nombre = 'HYDREX'
union all select id, '4x1000 (GMF)', 'porcentaje', 0.004, 'impuesto', array['mercado_libre','rappi','web','directo'], array['mercado_libre','rappi','web','directo'], 11 from negocios where nombre = 'HYDREX'
union all select id, 'ICA Medellín', 'porcentaje', 0, 'impuesto', array['mercado_libre','rappi','web','directo'], array[]::text[], 12 from negocios where nombre = 'HYDREX'
union all select id, 'Autorretención', 'porcentaje', 0, 'impuesto', array['mercado_libre','rappi','web','directo'], array[]::text[], 13 from negocios where nombre = 'HYDREX'
union all select id, 'Costo administrativo prorrateado', 'valor_por_unidad', 1650, 'admin', array['mercado_libre','rappi','web','directo'], array[]::text[], 14 from negocios where nombre = 'HYDREX';
```

> Nota clave: en el Excel la **retención en fuente se desactiva tanto en canal
> Web como en Directo** (`=IF(canal=3,0,IF(canal=4,0,1))`), no solo en Web.
> Queda replicado arriba — no lo cambies sin confirmarlo con Tomás.

> **El envío NO va en esta tabla.** En el Excel no es una regla automática:
> es un número que Tomás/Samuel escriben a mano en cada venta, y cambia caso
> a caso (2.750, 8.500, 9.000...). Va aparte, como tarifas de referencia —
> ver la tabla `hydrex_envio_tarifas` más abajo y la sección 4 (motor de
> cálculo).

```sql
-- Tarifas de envío: solo valores de referencia para sugerir un monto en la
-- calculadora/venta. El valor final SIEMPRE es editable a mano por venta —
-- no se aplica solo como los demás componentes.
create table if not exists hydrex_envio_tarifas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  nombre text not null, -- "Ciudad local (Medellín)", "Otras ciudades", etc.
  valor_referencia numeric(12,2) not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hydrex_envio_tarifas enable row level security;
create policy "authenticated_full_access" on hydrex_envio_tarifas for all to authenticated using (true) with check (true);

insert into hydrex_envio_tarifas (negocio_id, nombre, valor_referencia, orden)
select id, 'Ciudad local (Medellín)', 9000, 1 from negocios where nombre = 'HYDREX'
union all
select id, 'Otras ciudades', 15000, 2 from negocios where nombre = 'HYDREX';
```

### 2.4 `hydrex_compras_e_inventario`

```sql
create table if not exists hydrex_compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references proveedores(id),
  insumo_id uuid not null references hydrex_insumos(id),
  cantidad numeric(12,2) not null check (cantidad > 0),
  valor_total numeric(14,2) not null check (valor_total >= 0),
  costo_unitario numeric(14,4) generated always as (valor_total / nullif(cantidad, 0)) stored,
  fecha date not null default current_date,
  documento_url text, -- referencia a OneDrive como texto libre; integración real en Fase 5
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hydrex_inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references hydrex_insumos(id),
  tipo_movimiento text not null check (tipo_movimiento in ('entrada', 'salida', 'ajuste')),
  cantidad numeric(12,2) not null,
  origen text not null check (origen in ('compra', 'venta', 'ajuste_manual')),
  origen_referencia_id uuid, -- id de hydrex_compras o hydrex_ventas_detalle; sin FK dura, mismo patrón que transacciones.origen_referencia_id
  canal text,
  fecha date not null default current_date,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv_mov_insumo on hydrex_inventario_movimientos(insumo_id);
create index if not exists idx_inv_mov_origen on hydrex_inventario_movimientos(origen, origen_referencia_id);

alter table hydrex_compras enable row level security;
alter table hydrex_inventario_movimientos enable row level security;
create policy "authenticated_full_access" on hydrex_compras for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on hydrex_inventario_movimientos for all to authenticated using (true) with check (true);

-- Cada compra genera su entrada de inventario y actualiza el costo_unitario
-- del insumo con el costo del último lote (misma lógica que el Excel).
create or replace function fn_hydrex_compra_genera_entrada()
returns trigger as $$
begin
  insert into hydrex_inventario_movimientos (insumo_id, tipo_movimiento, cantidad, origen, origen_referencia_id, fecha, notas)
  values (new.insumo_id, 'entrada', new.cantidad, 'compra', new.id, new.fecha, 'Generado automáticamente desde compra');

  update hydrex_insumos
  set costo_unitario = new.costo_unitario, updated_at = now()
  where id = new.insumo_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_hydrex_compra_genera_entrada
after insert on hydrex_compras
for each row execute function fn_hydrex_compra_genera_entrada();

-- Vista de stock actual por insumo
create or replace view hydrex_stock_actual as
select
  i.id as insumo_id,
  i.tipo_insumo,
  i.nombre,
  i.atributo_1,
  i.atributo_2,
  coalesce(sum(case
    when m.tipo_movimiento in ('entrada', 'ajuste') then m.cantidad
    else -m.cantidad
  end), 0) as stock_disponible
from hydrex_insumos i
left join hydrex_inventario_movimientos m on m.insumo_id = i.id
group by i.id, i.tipo_insumo, i.nombre, i.atributo_1, i.atributo_2;
```

### 2.5 `hydrex_ventas_detalle`

```sql
create table if not exists hydrex_ventas_detalle (
  id uuid primary key default gen_random_uuid(),
  transaccion_id uuid not null references transacciones(id) on delete cascade,
  producto_id uuid not null references hydrex_productos(id),
  cliente_id uuid references clientes(id),
  canal text not null check (canal in ('mercado_libre', 'rappi', 'web', 'directo')),
  cantidad integer not null check (cantidad > 0),
  precio_venta_unitario numeric(12,2) not null,
  incluye_envio boolean not null default false,
  valor_envio numeric(12,2) not null default 0, -- monto real cobrado en ESTA venta, siempre editado a mano
  componentes_aplicados jsonb not null default '[]'::jsonb, -- snapshot: [{componente_id, nombre, tipo_calculo, valor, monto_aplicado}]
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

-- Cada venta descuenta automáticamente del inventario los insumos correspondientes
-- (impermeable, sticker, y caja si aplica), multiplicados por la cantidad
-- vendida y por unidades_por_caja cuando es producto tipo caja.
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
```

---

## 3. `updated_at` automático

Si ya existe una función genérica de este tipo en migraciones previas,
reutilízala. Si no, créala una sola vez (es idempotente con `create or
replace`) y engánchala con un trigger `before update` en cada tabla nueva que
tenga columna `updated_at`:

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- repetir para cada tabla con updated_at: proveedores, hydrex_insumos,
-- hydrex_productos, hydrex_precios, hydrex_componentes_costo, hydrex_compras,
-- gastos_fijos, clientes
create trigger trg_set_updated_at before update on proveedores
for each row execute function set_updated_at();
```

---

## 4. Motor de cálculo (`lib/motor-calculo.ts`)

**Debe ser una función pura**, sin llamadas a Supabase adentro — recibe todo
lo que necesita como parámetros y devuelve un resultado. Así la usan tanto la
calculadora (preview) como el registro real de venta, sin duplicar lógica.

### 4.1 Firma

```typescript
type Canal = 'mercado_libre' | 'rappi' | 'web' | 'directo';

interface ComponenteCosto {
  id: string;
  nombre: string;
  tipo_calculo: 'porcentaje' | 'valor_fijo' | 'valor_por_unidad';
  valor: number;
  premarcado_canales: string[];
}

interface CalculoVentaInput {
  costoProductoUnitario: number;   // desde hydrex_productos_costo, costo_por_unidad
  precioVentaUnitario: number;
  cantidad: number;
  canal: Canal;
  componentesDisponibles: ComponenteCosto[];
  // overrides manuales: el usuario puede prender/apagar cualquier check,
  // caso por caso, sin perder de qué venía marcado por defecto
  componentesActivos: Record<string /* componente_id */, boolean>;
  // el envío NO es un componente de la lista: es un monto que se escribe a
  // mano en cada venta (puede sugerirse desde hydrex_envio_tarifas, pero
  // siempre editable). Se suma directo al costo total, una vez por venta.
  incluyeEnvio: boolean;
  valorEnvio: number;
}

interface ComponenteAplicado {
  componenteId: string;
  nombre: string;
  tipoCalculo: string;
  valor: number;
  montoAplicado: number;
  activo: boolean;
}

interface CalculoVentaResultado {
  costoProductoTotal: number;
  componentesAplicados: ComponenteAplicado[];
  costoTotal: number;
  gananciaTotal: number;
  gananciaPorUnidad: number;
  margenPct: number;
  calificacion: 'excelente' | 'ajustado' | 'critico' | 'perdida';
}

function calcularVenta(input: CalculoVentaInput): CalculoVentaResultado { /* ... */ }
```

### 4.2 Lógica paso a paso

1. `costoProductoTotal = costoProductoUnitario * cantidad`.
2. Para cada componente en `componentesDisponibles`, determinar si está
   activo: usar `componentesActivos[componente.id]` si el usuario lo tocó
   manualmente; si no, el default es `componente.premarcado_canales.includes(canal)`.
3. Si está activo, calcular `montoAplicado` según `tipo_calculo`:
   - `porcentaje` → `valor * precioVentaUnitario * cantidad`
   - `valor_fijo` → `valor` (una sola vez por venta, no por unidad — ej. el
     costo fijo de pasarela)
   - `valor_por_unidad` → `valor * cantidad`
4. `costoTotal = costoProductoTotal + (incluyeEnvio ? valorEnvio : 0) + suma(montoAplicado de componentes activos)`.
5. `gananciaTotal = (precioVentaUnitario * cantidad) - costoTotal`.
6. `gananciaPorUnidad = gananciaTotal / cantidad`.
7. `margenPct = gananciaTotal / (precioVentaUnitario * cantidad)`.
8. **Calificación** (thresholds exactos tomados de la fórmula real del Excel,
   hoja "PRECIO VENTA" — no son aproximados, replícalos tal cual):
   - `margenPct >= 0.20` → `'excelente'`
   - `margenPct >= 0.10` → `'ajustado'`
   - `gananciaTotal > 0` → `'critico'`
   - si no → `'perdida'`

### 4.3 Resolución de precio (`precioVentaUnitario`)

Antes de llamar al motor, resolver el precio desde `hydrex_precios` según
`tipo_precio` y la cantidad:
- `individual` → precio fijo del producto individual.
- `caja` → precio de caja; si `cantidad >= 2`, aplicar `descuento_pct` de la
  fila que corresponda (o usar una fila separada con `cantidad_min = 2` si
  prefieres modelarlo así — ambas formas son válidas, elige la que quede más
  simple en la UI).
- `distribuidor` → buscar la fila cuyo rango `[cantidad_min, cantidad_max]`
  contiene la cantidad pedida (`cantidad_max is null` = sin tope, para el
  tramo "500+").

---

## 5. Pantallas (sección 15.4)

Todas bajo `/inventario-hydrex/`, visibles solo cuando el negocio activo es
HYDREX.

- **`/catalogo`** — CRUD de `hydrex_insumos` (separado por tipo: impermeables,
  stickers, cajas — cada combinación tipo+talla como fila propia) y CRUD de
  `hydrex_productos` (individual / caja), mostrando el costo calculado desde
  `hydrex_productos_costo` en modo solo-lectura.
- **`/componentes-costo`** — tabla editable de `hydrex_componentes_costo`
  (nombre, tipo de cálculo, valor, canales, premarcado por canal). Agregar o
  editar aquí no debe requerir tocar código en ningún otro lado. Incluye
  también un bloque chiquito aparte para editar `hydrex_envio_tarifas` (son
  solo valores de referencia, no un componente automático).
- **`/calculadora`** — selecciona canal + producto + cantidad; resuelve
  precio (4.3), trae los componentes premarcados, permite togglear cada uno
  como checkbox, y llama a `calcularVenta` en vivo mostrando costo, ganancia,
  margen y calificación con el mismo color/ícono que el Excel (✅🟡🔴❌). El
  envío es un toggle + campo numérico aparte (no un checkbox de la lista de
  componentes): al elegir una tarifa de referencia de `hydrex_envio_tarifas`
  se precarga el valor, pero siempre queda editable a mano antes de calcular.
- **`/stock`** — lee de `hydrex_stock_actual`, agrupado por tipo de insumo,
  con los movimientos recientes de `hydrex_inventario_movimientos`.
- **`/proveedores`** — CRUD de `proveedores` + tabla de `hydrex_compras`
  (fecha, proveedor, insumo, cantidad, valor total, costo unitario derivado,
  campo de texto para el link de OneDrive).
- **`/gastos-fijos`** — CRUD de `gastos_fijos` filtrado a HYDREX, y punto de
  equilibrio: toma la ganancia por unidad en vivo (llamando al motor con los
  parámetros "actuales" configurados) y calcula cuántas unidades/cajas hay
  que vender para cubrir el total de gastos fijos mensuales.
- **`/clientes`** — CRUD de `clientes` filtrado a HYDREX, con historial de
  compras vía join de `hydrex_ventas_detalle` → `transacciones` (fecha,
  producto, monto).

---

## 6. Integración con el formulario de ingreso de `contabilidad/`

Cuando el formulario de ingreso manual (Fase 3) tiene `negocio = HYDREX` y
`tipo = ingreso`, debe mostrar la sección `VentaHydrexFormExtension`:

1. Selección de producto, canal, cantidad, cliente (opcional).
2. Precio resuelto automáticamente (4.3), editable si hace falta un ajuste
   puntual.
3. Toggle de envío + monto (sugerido desde `hydrex_envio_tarifas`, siempre
   editable a mano — igual que en `/calculadora`).
4. Preview en vivo del motor de cálculo (mismo componente visual que
   `/calculadora`).
5. Al guardar: se crea la fila en `transacciones` (como ya hace Fase 3) y,
   en la misma operación, una fila en `hydrex_ventas_detalle` con
   `transaccion_id` apuntando a ella — el trigger de la sección 2.5 se
   encarga solo de descontar inventario.

No dupliques la lógica de cálculo en el componente — todo pasa por
`motor-calculo.ts`.

---

## 7. Checklist final antes de entregar

- [ ] Las 5 migraciones creadas con `supabase migration new`, en el orden
      indicado, sin `db push` ejecutado.
- [ ] Seeds verificados contra el nombre real de columna/valor de `negocios`.
- [ ] `motor-calculo.ts` sin ninguna llamada a Supabase adentro (función pura,
      testeable).
- [ ] La calculadora y el registro real de venta importan la misma función.
- [ ] Ningún archivo de `inventario-hydrex/` es importado desde HANGARC o
      VirtualWaiter.
- [ ] No aparece ninguna credencial, connection string, ni service role key
      en ningún archivo del repo.
