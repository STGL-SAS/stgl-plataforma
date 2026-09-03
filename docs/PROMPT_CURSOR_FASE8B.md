# PROMPT PARA CURSOR — Fase 8B: Vista por Negocio (HANGARC, VirtualWaiter, STGL)

## Contexto del proyecto

Estás trabajando en `stgl-plataforma`, la plataforma interna de gestión de STGL SAS
(sociedad entre Tomás Garcés y Samuel López). El proyecto ya tiene construidas:

- Fase 1-2: infraestructura + esquema base (`negocios`, `socios`, `cuentas`,
  `transacciones`, `aportes`, `gastos_fijos`, `gastos_ocasionales`, `tareas`, `documentos`)
- Fase 3: módulo de Contabilidad (transacciones, Bold, estado de cuenta por socio,
  intercompañía)
- Fase 4: módulo HYDREX — Costeo e Inventario (sección propia en el menú lateral)
- Fase 5: módulo HARDTECH — Ventas y mantenimientos (sección propia en el menú lateral)
- Fase 6: Documentos (OneDrive)
- Fase 7: Tareas y clientes

**El hueco que resuelve esta fase**: HANGARC y VirtualWaiter (negocios en
desarrollo, sin ventas activas) y STGL como entidad general se quedaron sin una
vista propia en el menú lateral. Hoy solo se puede ver sus tareas/documentos
entrando a los módulos genéricos sin filtro claro por negocio. HYDREX y HARDTECH
sí tienen su sección grande y dedicada — esta fase les da a los otros tres un
equivalente simple.

## Objetivo de esta fase

Construir la "Vista por negocio" (documento de requerimientos, sección 15.2) para:
- HANGARC
- VirtualWaiter
- STGL (entidad general, no es un negocio con ventas — gastos/documentos/tareas
  de la sociedad)

Cada una debe mostrar, filtrado automáticamente a ese negocio:
1. Balance (ingresos − egresos − saldo actual), usando las transacciones ya
   existentes del módulo de Contabilidad.
2. Gastos fijos (tabla `gastos_fijos`) — CRUD completo filtrado a ese negocio.
3. Tareas abiertas (reutilizando el módulo de Tareas ya existente, solo filtrado).
4. Documentos (reutilizando el módulo de Documentos ya existente, solo filtrado).

**Explícitamente fuera de alcance**: no se toca HYDREX ni HARDTECH, no se crea
inventario ni motor de costeo para estos negocios (eso solo aplica a HYDREX), y
no hay lógica de ventas para HANGARC/VirtualWaiter (aún no facturan).

## Paso 0 — Verificación antes de escribir código

Antes de tocar nada, confirma en el repo actual:

1. Que la tabla `negocios` tenga una fila para HANGARC, otra para VirtualWaiter,
   y una fila que represente a STGL como entidad general (revisa el seed de
   Fase 2). Si STGL no existe como fila en `negocios`, créala con un insert
   simple (no requiere migración de estructura nueva) — nombre visible "STGL /
   General", sin participación societaria específica (o marcada como N/A, ya
   que la sección 1 del documento la trata como "paraguas general").
2. Que `gastos_fijos`, `tareas` y `documentos` tengan efectivamente una columna
   `negocio_id` (FK a `negocios`) usable para filtrar. Si algo falta, repórtalo
   antes de continuar en vez de improvisar un campo nuevo.
3. Revisa cómo están estructuradas hoy las rutas y el menú lateral para HYDREX
   y HARDTECH (Fases 4 y 5) — la nueva sección debe seguir el mismo patrón
   visual y de navegación, no inventar uno nuevo.

Si algo de esto no cuadra, para y reporta el hallazgo antes de seguir.

## Paso 1 — Estructura de módulo

Crear un módulo nuevo y compartido en vez de tres pantallas duplicadas:

```
src/modules/negocios/
  components/
    VistaNegocio.tsx          # componente genérico, recibe negocioId/slug como prop
    BalanceNegocio.tsx        # tarjeta de balance (ingresos/egresos/saldo)
    GastosFijosNegocio.tsx    # tabla + CRUD de gastos fijos filtrado
    TareasNegocio.tsx         # lista de tareas abiertas filtrada (wrapper del módulo de tareas)
    DocumentosNegocio.tsx     # explorador filtrado (wrapper del módulo de documentos)
  hooks/
    useBalanceNegocio.ts      # reutiliza el cálculo de balance ya existente en contabilidad,
                               # NO reimplementar la lógica de sumar ingresos/egresos
    useGastosFijos.ts
```

Regla de oro: `BalanceNegocio`, `TareasNegocio` y `DocumentosNegocio` **consumen
los services/hooks que ya existen** en `contabilidad/`, `tareas/` y
`documentos/` respectivamente, pasándoles el filtro de negocio. No se duplica
lógica de cálculo ni de queries — si el módulo de contabilidad ya expone una
función tipo `getBalancePorNegocio(negocioId)`, se usa esa. Si no existe todavía
como función reutilizable (solo vive dentro de un componente de HYDREX/HARDTECH),
extráela a un hook/servicio compartido primero, y luego consúmela desde ahí y
desde `VistaNegocio`.

`GastosFijosNegocio` sí necesita CRUD propio (crear/editar/eliminar concepto,
monto, periodicidad) porque hoy ese módulo no tiene una pantalla dedicada fuera
de HYDREX — pero la tabla y el service de datos (`gastos_fijos`) ya existen,
así que es UI nueva sobre datos existentes, no schema nuevo.

## Paso 2 — Rutas

Usar una ruta dinámica en vez de tres páginas casi idénticas:

```
src/app/negocios/[slug]/page.tsx
```

donde `slug` es `hangarc`, `virtualwaiter`, o `stgl`. La página resuelve el
`negocio_id` real a partir del slug (tabla `negocios`) y renderiza
`<VistaNegocio negocioId={...} />`.

Si el patrón de rutas ya usado en Fases 4/5 para HYDREX/HARDTECH es distinto
(por ejemplo rutas planas tipo `/hydrex`, `/hardtech` en vez de un segmento
`/negocios/`), sigue ESE patrón en vez del propuesto aquí, para mantener
consistencia visual y de código con lo ya construido. Prioriza lo que ya existe
en el repo sobre lo que dice este prompt si hay conflicto.

## Paso 3 — Menú lateral

Agregar tres entradas nuevas al sidebar, con el mismo estilo/iconografía que
ya usan HYDREX y HARDTECH (no inventar un estilo nuevo):

- HANGARC → `/negocios/hangarc` (o el patrón de ruta equivalente)
- VirtualWaiter → `/negocios/virtualwaiter`
- STGL / General → `/negocios/stgl`

Revisa el componente de sidebar existente (probablemente en
`src/modules/core/` o `src/components/layout/`) y sigue exactamente su
convención (props, iconos, orden, agrupación) para agregar estas tres.

## Paso 4 — Balance del negocio

- Reutilizar el cálculo ya usado en Contabilidad para balance por negocio
  (ingresos − egresos = saldo), filtrado por `negocio_id`.
- Mostrar: ingresos del mes, egresos del mes, saldo acumulado.
- Para STGL como entidad general: el balance se calcula igual, sumando las
  transacciones marcadas con `negocio_id` = STGL (gastos compartidos, categoría
  "STGL / general" mencionada en la sección 9 del documento de requerimientos).
- No mezclar aquí el tratamiento especial de HARDTECH (gastos que restan
  directo de la utilidad) — eso es exclusivo de HARDTECH, sección 4B del
  documento. Para HANGARC/VirtualWaiter/STGL los gastos fijos son solo
  informativos, como dice la sección 4B: "en los demás negocios, estos gastos
  siguen siendo solo informativos".

## Paso 5 — Gastos fijos

- Tabla filtrada por negocio: concepto, monto, periodicidad (mensual/anual/único).
- CRUD completo: crear, editar, eliminar.
- Sin restricción de conceptos predefinidos — campo de texto libre para
  "concepto", como pide la sección 4B.
- No mostrar aquí columnas técnicas crudas (nombres de columna de la base de
  datos) en los encabezados — usar etiquetas legibles ("Concepto", "Monto",
  "Periodicidad"), siguiendo la misma observación que ya se hizo en fases
  anteriores sobre no exponer detalles internos en la UI.

## Paso 6 — Tareas y Documentos (solo filtro, sin lógica nueva)

- `TareasNegocio`: reutiliza el componente/lista de tareas ya existente,
  pasándole el filtro de `negocio_id`. Mostrar solo tareas con estado
  pendiente/en curso/esperando (no resueltas) por defecto, con opción de ver
  todas.
- `DocumentosNegocio`: reutiliza el explorador de documentos ya existente,
  filtrado por `negocio_id`. Para STGL, esto debe mostrar los documentos
  categorizados como "STGL / general" (sección 6 y 9 del documento).

## Paso 7 — Checklist de verificación antes de terminar

- [ ] Las tres rutas nuevas cargan sin error y muestran datos reales (no mock).
- [ ] El balance de cada vista coincide con lo que ya muestra Contabilidad al
      filtrar manualmente por ese negocio (cross-check).
- [ ] Gastos fijos: crear uno de prueba en HANGARC y confirmar que NO aparece
      en la vista de VirtualWaiter ni de STGL (aislamiento correcto).
- [ ] Tareas y documentos de HYDREX/HARDTECH no se filtran ni aparecen aquí
      (separación de módulos respetada, sección 11 del documento).
- [ ] El sidebar mantiene el mismo estilo visual que HYDREX/HARDTECH — sin
      inconsistencias de iconos, tipografía o espaciado.
- [ ] Si STGL no existía como fila en `negocios`, quedó creada y documentada
      en el resumen de la fase.

## Nota de seguridad (recordatorio, no acción de esta fase)

La plataforma sigue sin login real hasta la Fase 10 (control de acceso). No es
tarea de esta fase, pero no agregues nada que dependa de autenticación real
todavía — sigue el mismo patrón de acceso abierto que ya usan HYDREX/HARDTECH
por ahora.
