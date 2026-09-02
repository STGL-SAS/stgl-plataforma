# PROMPT PARA CURSOR — Fase 5: Módulo HARDTECH (ventas de tecnología y mantenimientos)

## Contexto del proyecto

Repo: `stgl-plataforma` (org `STGL-SAS`), Next.js + TypeScript + Tailwind, desplegado en Vercel.
Base de datos: Supabase (Postgres), proyecto `sdtxsvyontdxvivrqgvt`. Un solo proyecto de Supabase
para todos los negocios, separación por schemas/tablas bien delimitadas + RLS.

Estructura modular ya establecida (no romperla):
```
src/modules/
  core/
  contabilidad/
  inventario-hydrex/
  documentos/
  tareas/
  hardtech/          <- NUEVO, esta fase
```

Fases previas ya completadas: infraestructura (1), esquema base + negocios/socios/cuentas/
transacciones/intercompañía (2), módulo de Contabilidad con integración Bold (3), Costeo e
Inventario de HYDREX con motor de cálculo puro (4).

**IMPORTANTE — antes de escribir cualquier migración**: revisar las migraciones existentes en
`supabase/migrations/` para mantener la misma convención de nombres de columnas, tipos, y
patrón de RLS ya usado en `contabilidad` e `inventario-hydrex`. No inventar convenciones nuevas
si ya existe una establecida para el mismo tipo de dato (fechas, montos, moneda, adjuntos/OneDrive,
estados tipo enum, etc).

## Objetivo de esta fase

Construir el módulo HARDTECH: ventas de tecnología bajo pedido (sin inventario propio) +
mantenimientos (servicio técnico) + el mecanismo de "Pagos entre Socios" que resuelve la
ausencia de cuenta bancaria propia del negocio. Ver sección 4C completa de
`STGL_Requerimientos_Plataforma.md` para el detalle funcional; secciones 1 y 2 para participación
societaria (50/50) y ausencia de cuenta HARDTECH.

## 1. Migraciones

### 1.1 Verificar/insertar HARDTECH en `negocios`
Confirmar si ya existe una fila para HARDTECH en la tabla de negocios sembrada en la Fase 2.
Si no existe, insertarla con participación Tomás 50% / Samuel 50%, siguiendo el mismo patrón
que HYDREX/HANGARC/VirtualWaiter.

### 1.2 Cuenta de divisas
HARDTECH no tiene cuenta bancaria propia, pero sí usa una plataforma de cambio de dólares para
comprar en el exterior. Tratarla **como una cuenta más** dentro de la tabla de cuentas ya
existente (la misma que usan Bold/Bancolombia en Contabilidad), con moneda USD, para que el
saldo se calcule con la misma lógica de movimientos ya construida en la Fase 3 — no crear un
sistema de saldo paralelo.

### 1.3 `hardtech_ventas`
Campos mínimos:
- `id`, `cliente_id` (FK a la tabla de clientes genérica de la sección 4A, filtrado a negocio HARDTECH)
- `titulo`, `descripcion`
- `estado` (enum: `pendiente_compra`, `pendiente_pago_final`, `cerrada`)
- `fecha_cotizacion`, `documento_cotizacion` (referencia a documento — mismo patrón de adjuntos
  usado en Contabilidad/inventario para soportes ligados a OneDrive, aunque la integración real
  de OneDrive se construye en Fase 6; por ahora guardar la ficha/metadata igual que ya se hace
  con otros comprobantes)
- `anticipo_monto` (nullable, NO fijo a 50%), `anticipo_fecha`, `anticipo_comprobante`, `anticipo_nota`
- `valor_venta_final`, `propina` (se suma al valor final), `pago_final_fecha`, `pago_final_comprobante`
- `comision_terceros_pct`, `comision_terceros_destinatario`, `comision_terceros_monto` (libres por venta)
- `created_at`, `updated_at`

Ganancia y ganancia neta **no se guardan como columna fija**: se calculan en vivo (ver sección 2,
motor de cálculo), igual que se hizo en HYDREX con `motor-calculo.ts`, para que cualquier ajuste
posterior a compras/gastos recalcule automáticamente.

### 1.4 `hardtech_compras`
- `id`, `venta_id` (FK a `hardtech_ventas`)
- `lugar_compra`, `metodo_pago`
- `moneda` (COP | USD), `monto`, `tasa_cambio` (nullable si COP), `monto_cop_equivalente`
- `fecha_compra`, `comprobante`
- `agrupada_con` (FK auto-referencial nullable, para compras que comparten envío con otra compra
  de otra venta, evitando duplicar el costo de envío)

Si `moneda = USD`, generar automáticamente el movimiento correspondiente contra la cuenta de
divisas (1.2), restando el saldo disponible.

### 1.5 `hardtech_gastos_extra`
- `id`, `venta_id` (FK), `tipo` (envio_internacional | empaque | otro)
- `monto`, `moneda`, `fecha`, `comprobante`, `nota`

### 1.6 `hardtech_mantenimientos`
- `id`, `cliente_id` (FK, mismo módulo de clientes)
- `titulo`, `descripcion`, `fecha`
- `anticipo_monto`, `anticipo_fecha`, `pago_final_monto`, `pago_final_fecha`
- `honorarios_monto`, `honorarios_destinatario` (texto libre — técnico externo subcontratado,
  nunca un socio; esto es importante: si algún día un socio hace el trabajo, NO pasa por este
  campo, para no mezclarlo con reparto de utilidad)
- `insumos_monto`, `insumos_detalle` (jsonb, libre)
- `domicilio_monto`
- `created_at`, `updated_at`

Ganancia = valor cobrado − honorarios − insumos − domicilio (calculada en vivo).

### 1.7 `hardtech_pagos_socios`
El "fondo HARDTECH" sin caja real:
- `id`, `socio_id` (FK a socios)
- `tipo` (`socio_puso_plata` | `socio_recibio_plata`) — puso plata propia que es de HARDTECH,
  o recibió una ganancia de HARDTECH en su cuenta personal
- `monto`, `fecha`, `nota`
- `venta_id` (FK nullable a `hardtech_ventas`) / `mantenimiento_id` (FK nullable) — referencia
  opcional a qué operación originó el movimiento, para trazabilidad
- `created_at`

Diferenciar explícitamente en el modelo y en el código de esta tabla vs. la de aportes de socios
(sección 3.1, ya existente): esta NO es inversión, es plata operativa temporal.

Construir una vista o función (`hardtech_saldo_socios`) que sume estos movimientos y devuelva,
por socio, cuánto le "debe" HARDTECH en un momento dado (recibido − puesto, o el inverso según
convención que se fije).

### 1.8 RLS
Mismo patrón permisivo (usuario autenticado) ya usado en las demás tablas de esta fase del
proyecto. No implementar roles granulares todavía (eso es Fase 8/10).

## 2. Motor de cálculo (TypeScript, función pura)

Crear `src/modules/hardtech/motor-calculo.ts` con funciones puras (sin llamadas a Supabase,
mismo principio que `inventario-hydrex/motor-calculo.ts`):

- `calcularGananciaVenta(venta, compras[], gastosExtra[])` → `{ costoTotal, ganancia, gananciaNeta }`
  - Ganancia = valor final de venta − precio de compra − gastos extra
  - Ganancia neta = ganancia − comisión a terceros (si aplica)
- `calcularGananciaMantenimiento(mantenimiento)` → `{ ganancia }`
- `calcularSaldoSocios(pagos[])` → saldo neto por socio

Estas mismas funciones deben poder reutilizarse desde la pantalla de detalle de venta/mantenimiento
y desde los cálculos consolidados (sección 4 de este prompt).

## 3. Pantallas

Diseñadas para esta fase (no existían en la sección 15 del documento de requerimientos —
se agregan como nueva sección 15.8, mismo nivel de detalle que 15.3/15.4):

### 3.1 Lista de ventas HARDTECH
Filtro por estado (`pendiente_compra` / `pendiente_pago_final` / `cerrada`), cliente, fecha.
Cada fila: título, cliente, estado, compra asociada (o "sin compra registrada"), ganancia neta
calculada en vivo.

### 3.2 Formulario de venta por etapas
No un formulario único: refleja el flujo real (4C.1). Etapas habilitadas progresivamente:
1. Cotización (cliente, descripción, documento adjunto)
2. Anticipo (opcional, monto libre)
3. Compra (lugar, método de pago, moneda, tasa de cambio si USD)
4. Gastos extra (envío internacional, empaque)
5. Entrega y pago final (monto, propina)
6. Comisión a terceros (opcional, % + destinatario)

Con resumen de ganancia/ganancia neta visible en vivo a medida que se completan etapas.

### 3.3 Vista de Mantenimientos
Lista + formulario: honorarios (con destinatario), insumos, domicilio, anticipo/pago final,
ganancia calculada en vivo.

### 3.4 Pagos entre Socios / Fondo HARDTECH
Tabla de movimientos (quién puso o recibió, cuánto, cuándo, ligado a qué venta/mantenimiento si
aplica) + resumen superior tipo "saldo a favor de Tomás: $X — saldo a favor de Samuel: $Y".

### 3.5 Saldo cuenta de divisas
Card simple: saldo actual en USD, equivalente en COP a la tasa más reciente registrada,
historial de movimientos (compras que lo consumieron).

### 3.6 Clientes HARDTECH
No construir nada nuevo: reutilizar el módulo de clientes de la sección 4A, filtrado por
negocio = HARDTECH.

## 4. Integración con lo ya construido

- **Balance consolidado STGL**: los movimientos de HARDTECH (ganancia neta de ventas y
  mantenimientos) deben sumar al balance consolidado igual que HYDREX/HANGARC/VirtualWaiter,
  aunque no exista cuenta bancaria propia — el balance se alimenta de la ganancia calculada,
  no de movimientos de una cuenta física.
- **Utilidad repartible por socio**: incluir HARDTECH en el mismo cálculo que ya existe para
  los demás negocios, aplicando 50/50.
- **Dashboard general** (Fase 8, aún no construido): dejar los datos estructurados para que
  cuando se construya el dashboard, HARDTECH entre sin fricción — no requiere trabajo extra
  ahora, solo no romper la forma de los datos que el dashboard va a consumir.

## 5. Estructura de carpetas

```
src/modules/hardtech/
  ventas/
  compras/
  mantenimientos/
  pagos-socios/
  motor-calculo.ts
```

## 6. Criterios de aceptación

- [ ] HARDTECH existe en `negocios` con 50/50
- [ ] Cuenta de divisas existe y su saldo se mueve correctamente con compras en USD
- [ ] Se puede crear una venta completa pasando por las 6 etapas y ver ganancia/ganancia neta correctas
- [ ] Se puede registrar un mantenimiento y ver su ganancia correcta
- [ ] Un movimiento en Pagos entre Socios cambia el saldo mostrado por socio
- [ ] La ganancia neta de HARDTECH aparece en el balance consolidado STGL y en la utilidad
      repartible por socio
- [ ] Ningún componente de este módulo se filtra a HYDREX/HANGARC/VirtualWaiter (estructura limpia,
      sección 11)
