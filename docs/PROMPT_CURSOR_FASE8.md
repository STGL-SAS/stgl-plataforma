# PROMPT PARA CURSOR — Fase 8: Dashboard general + Configuración/Roles

## Contexto del proyecto

Estás trabajando en `stgl-plataforma`, plataforma interna de gestión de STGL SAS
(Next.js + TypeScript + Tailwind + Supabase). Estructura modular por dominio bajo
`src/modules/{core, contabilidad, inventario-hydrex, hardtech, documentos, tareas}`.
RLS habilitado en todas las tablas.

Ya existen (fases anteriores, completas y en producción):
- `negocios`, `socios`, `socios_participacion` (con trigger que valida que la suma
  de % por negocio nunca pase de 100).
- `cuentas_bancarias`, `transacciones` (ledger central: enums `tipo`, `estado`
  ["pendiente","clasificada", ...], `origen` ["bold","manual", ...]).
- `aportes_socios`, `movimientos_intercompania`.
- `bold_webhook_events`.
- Módulo HYDREX completo (`hydrex_*`: insumos, tipos, productos, componentes de
  costo, compras, stock, motor de cálculo en `motor-calculo.ts`).
- Módulo HARDTECH (ventas, mantenimientos, pagos entre socios, cuenta USD —
  nombres exactos de tablas por confirmar, ver paso 0).
- `documentos` (conectado a OneDrive vía Microsoft Graph).
- `gastos_fijos`, `gastos_ocasionales` (genéricas, con `negocio_id`).
- `tareas`, `tareas_historial` (con trigger de historial automático).
- `clientes` (genérica, con `negocio_id`, activa para los 4 negocios).

**No corras ninguna migración tú mismo.** Genera los archivos `.sql` dentro de
`supabase/migrations/` con el siguiente número disponible en la secuencia (revisa
los archivos existentes antes de nombrar los nuevos). Tomás las aplica manualmente
con `supabase db push` desde su propia terminal.

---

## 0. Antes de escribir nada: verifica el esquema real

Los nombres usados en este prompt para HARDTECH y para las columnas de estado son
la convención esperada, pero pueden diferir de lo que Cursor generó en la Fase 5.
Antes de tocar código:

1. Revisa `supabase/migrations/0*.sql` ya aplicados, o consulta
   `information_schema.columns` para: `negocios`, `transacciones`, `socios_participacion`,
   `gastos_fijos`, `gastos_ocasionales`, `documentos`, `tareas`, y las tablas de
   HARDTECH (probablemente `hardtech_ventas`, `hardtech_mantenimientos`,
   `hardtech_pagos_socios` — confirma nombres y columnas de ganancia/estado exactos).
2. Ajusta las vistas de la sección 1 para que coincidan con los nombres reales.
   No renombres columnas existentes.

---

## 1. Migraciones nuevas

### `supabase/migrations/0XX_roles.sql`

```sql
-- Roles de usuario (sección 13). Solo estructura por ahora — la Fase 10
-- (correos_autorizados + enforcement fino por pantalla) usa esto sin rehacer nada.

create type rol_usuario as enum ('superadmin', 'usuario_normal');

create table if not exists usuarios_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol rol_usuario not null default 'usuario_normal',
  socio_id uuid references socios(id), -- null si es colaborador futuro sin ser socio
  negocios_permitidos uuid[], -- null = todos los negocios (uso real en Fase 10)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table usuarios_roles is 'Relación usuario de Supabase Auth -> rol. Los roles no viven en auth.users (Supabase Auth no lo trae de fábrica). negocios_permitidos queda listo pero sin uso real hasta Fase 10.';

-- Función security definer para evitar recursión de RLS al consultar el propio rol
create or replace function is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from usuarios_roles
    where user_id = auth.uid() and rol = 'superadmin'
  );
$$;

alter table usuarios_roles enable row level security;

-- Cualquier autenticado puede ver la lista de roles (la pantalla de Configuración
-- necesita listar usuarios/roles; no hay datos sensibles en esta tabla).
create policy "usuarios_roles_select_authenticated" on usuarios_roles
  for select to authenticated using (true);

-- Solo superadmin puede crear o modificar roles.
create policy "usuarios_roles_insert_superadmin" on usuarios_roles
  for insert to authenticated with check (is_superadmin());

create policy "usuarios_roles_update_superadmin" on usuarios_roles
  for update to authenticated using (is_superadmin()) with check (is_superadmin());

create trigger trg_usuarios_roles_updated_at
  before update on usuarios_roles
  for each row execute function moddatetime(updated_at);
-- Si la extensión moddatetime no está habilitada en el proyecto, reemplaza este
-- trigger por un `set updated_at = now()` manual en la función de update, o
-- por una función trigger simple equivalente.

-- Seed: Tomás y Samuel como superadmin. Cursor NO tiene los UUID reales de
-- auth.users — deja este INSERT comentado y como nota para que Tomás lo corra
-- él mismo después de aplicar la migración:
-- insert into usuarios_roles (user_id, rol, socio_id) values
--   ('<uuid-tomas-auth>', 'superadmin', (select id from socios where nombre ilike 'Tomás%')),
--   ('<uuid-samuel-auth>', 'superadmin', (select id from socios where nombre ilike 'Samuel%'));
```

### `supabase/migrations/0XX_vistas_dashboard.sql`

```sql
-- Vistas de solo lectura para el Dashboard general (sección 7, 15.1).
-- No agregan tablas nuevas, solo consolidan lo que ya existe.

-- Balance por negocio a partir del ledger central (HYDREX, HANGARC, VirtualWaiter).
-- HARDTECH también aparece aquí con ingresos/egresos de transacciones si los tiene
-- (ej. pagos entre socios que sí pasan por `transacciones`), pero su utilidad real
-- se calcula aparte en v_utilidad_hardtech por el tratamiento especial de sección 4B.
create or replace view v_balance_por_negocio as
select
  n.id as negocio_id,
  n.nombre as negocio_nombre,
  coalesce(sum(case when t.tipo = 'ingreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as ingresos,
  coalesce(sum(case when t.tipo = 'egreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as egresos,
  coalesce(sum(case when t.tipo = 'ingreso' and t.estado = 'clasificada' then t.monto else 0 end), 0)
    - coalesce(sum(case when t.tipo = 'egreso' and t.estado = 'clasificada' then t.monto else 0 end), 0) as balance
from negocios n
left join transacciones t on t.negocio_id = n.id
group by n.id, n.nombre;

-- Ingresos/egresos por mes y negocio, para la gráfica de evolución mensual.
create or replace view v_movimientos_mensuales as
select
  t.negocio_id,
  n.nombre as negocio_nombre,
  date_trunc('month', t.fecha)::date as mes,
  sum(case when t.tipo = 'ingreso' then t.monto else 0 end) as ingresos,
  sum(case when t.tipo = 'egreso' then t.monto else 0 end) as egresos
from transacciones t
join negocios n on n.id = t.negocio_id
where t.estado = 'clasificada'
group by t.negocio_id, n.nombre, date_trunc('month', t.fecha);

-- Utilidad de HARDTECH: NO sale del balance de cuenta bancaria (no tiene una
-- propia), sale de ganancia de ventas + mantenimientos, menos sus gastos fijos
-- y ocasionales (que aquí SÍ restan directo, a diferencia de los demás negocios).
-- AJUSTA nombres de columnas reales (ver paso 0) antes de aplicar.
create or replace view v_utilidad_hardtech as
select
  coalesce((select sum(ganancia_neta) from hardtech_ventas where estado = 'cerrada'), 0)
  + coalesce((select sum(valor_cobrado - honorarios - insumos - domicilio) from hardtech_mantenimientos where estado = 'cerrada'), 0)
  - coalesce((select sum(gf.monto) from gastos_fijos gf join negocios n on n.id = gf.negocio_id where n.nombre = 'HARDTECH'), 0)
  - coalesce((select sum(go.monto) from gastos_ocasionales go join negocios n on n.id = go.negocio_id where n.nombre = 'HARDTECH'), 0)
  as utilidad_neta;

-- Utilidad teórica repartible por socio y negocio (informativo, sección 9 —
-- NO implica lógica de pago real).
create or replace view v_utilidad_repartible as
select
  sp.negocio_id,
  n.nombre as negocio_nombre,
  sp.socio_id,
  s.nombre as socio_nombre,
  sp.porcentaje,
  round(vb.balance * (sp.porcentaje / 100.0), 2) as utilidad_teorica
from socios_participacion sp
join negocios n on n.id = sp.negocio_id
join socios s on s.id = sp.socio_id
join v_balance_por_negocio vb on vb.negocio_id = sp.negocio_id;

-- Estado de cuenta de aportes por socio y negocio (usa lo ya construido en Fase 3).
create or replace view v_aportes_por_socio as
select
  a.socio_id,
  s.nombre as socio_nombre,
  a.negocio_id,
  n.nombre as negocio_nombre,
  a.clasificacion,
  sum(a.monto) as total_aportado
from aportes_socios a
join socios s on s.id = a.socio_id
join negocios n on n.id = a.negocio_id
group by a.socio_id, s.nombre, a.negocio_id, n.nombre, a.clasificacion;

-- Alertas del dashboard: Bold pendiente, documentos sin categorizar, tareas vencidas.
create or replace view v_alertas_dashboard as
select 'bold_pendiente' as tipo, count(*)::int as cantidad
  from transacciones where origen = 'bold' and estado = 'pendiente'
union all
select 'documento_sin_categorizar', count(*)::int
  from documentos where categoria is null
union all
select 'tarea_vencida', count(*)::int
  from tareas where fecha_limite < current_date and estado <> 'resuelto';

-- Tareas abiertas vs resueltas por negocio (sección 7).
create or replace view v_tareas_estado_por_negocio as
select
  negocio_id,
  count(*) filter (where estado <> 'resuelto') as abiertas,
  count(*) filter (where estado = 'resuelto') as resueltas
from tareas
group by negocio_id;
```

Todas las vistas heredan RLS de las tablas base (Postgres respeta las policies de
las tablas subyacentes al consultar una vista normal), así que no necesitan RLS
propia.

---

## 2. Dashboard general (`src/modules/core/dashboard` o equivalente)

Ruta: la página que se muestra al iniciar sesión (`/` o `/dashboard`).

Contenido, en este orden:

1. **Alertas** (arriba, si hay algo pendiente): tarjetas cortas usando
   `v_alertas_dashboard` — "3 transacciones Bold por clasificar", "5 documentos sin
   categorizar", "2 tareas vencidas" — cada una enlaza directo a la vista filtrada
   correspondiente (Bold pendientes, documentos, tareas). Si `cantidad = 0` para
   una alerta, no se muestra la tarjeta.
2. **Balance por negocio**: una tarjeta por cada uno de los 4 negocios (HYDREX,
   HANGARC, VirtualWaiter, HARDTECH) con ingresos, egresos y balance/utilidad del
   mes actual y acumulado. HARDTECH usa `v_utilidad_hardtech` en vez de
   `v_balance_por_negocio`. Cada tarjeta es un acceso rápido (click → vista del
   negocio, sección 15.2).
3. **Gráfica de evolución mensual**: ingresos vs egresos, comparativo entre
   negocios, usando `v_movimientos_mensuales` (últimos 6-12 meses).
4. **Estado de cuenta de socios** (resumen corto, no la vista completa): total
   aportado por cada socio, usando `v_aportes_por_socio`, con link a la vista
   detallada de Contabilidad.
5. **Utilidad repartible** (resumen): tabla corta con `v_utilidad_repartible`,
   dejando claro con una nota visible que es informativo y no implica reparto real
   todavía.
6. **Tareas abiertas vs resueltas por negocio**: usando `v_tareas_estado_por_negocio`,
   como barra o número simple por negocio.

No exponer nombres de columnas ni de vistas en la UI (mismo criterio ya aplicado
en fases anteriores) — todo con etiquetas en español legibles.

---

## 3. Configuración (`src/modules/core/configuracion`)

Ruta protegida: visible para cualquier autenticado, pero las acciones de escritura
(participación societaria, cambio de roles) solo se habilitan si `is_superadmin()`
devuelve true para el usuario actual (consulta el rol propio al cargar la página).

Tres secciones:

1. **Parámetros HYDREX**: no se reconstruye nada — esta pantalla solo centraliza el
   acceso a las pantallas ya construidas en Fase 4 (Componentes de costo, Catálogo
   de insumos) con un link directo a cada una.
2. **Participación societaria**: tabla editable de `socios_participacion` (negocio,
   socio, %). Al guardar, usa el mismo trigger que ya existe desde Fase 2 (valida
   que la suma por negocio no pase de 100) — no dupliques esa validación en el
   frontend, solo maneja el error si el trigger la rechaza.
3. **Usuarios y roles**: lista de `usuarios_roles` (join contra `auth.users` para
   mostrar email — usa el admin API de Supabase server-side, con la service role
   key, nunca expuesta al cliente). Por usuario: email, rol actual (selector
   superadmin/usuario_normal), socio asociado (opcional). Solo superadmin puede
   guardar cambios. No hay flujo de invitación todavía (eso es `correos_autorizados`
   en Fase 10) — por ahora solo se puede asignar rol a usuarios que ya existen en
   Supabase Auth.

---

## 4. Qué NO hacer en esta fase

- No implementar restricciones de RLS por negocio usando `negocios_permitidos`
  (columna lista, sin uso real todavía — eso es Fase 10).
- No tocar las pantallas de HYDREX ya construidas, solo enlazarlas.
- No construir `correos_autorizados` ni flujo de invitación.
- No mover el dominio de producción (queda pendiente, fuera de alcance de esta fase).

---

## 5. Al terminar

Confirma en el resumen final:
- Las dos migraciones aplicadas sin error (`supabase db push` corrido por Tomás).
- Capturas o confirmación de que el dashboard carga con datos reales.
- Confirmación de que Tomás insertó manualmente su fila y la de Samuel en
  `usuarios_roles` como `superadmin` (el INSERT queda comentado en la migración a
  propósito, por los UUID reales de auth.users).
