# PROMPT PARA CURSOR — Fase 6: Módulo de Documentos (OneDrive / Microsoft Graph)

Estás trabajando en el repo `stgl-plataforma` (Next.js + TypeScript +
Tailwind + Supabase, desplegado en Vercel). Ya existen los módulos
`core`, `contabilidad` e `inventario-hydrex`, siguiendo una arquitectura
modular en `src/modules/{modulo}/`. Vas a construir el módulo
`documentos`, siguiendo exactamente esa misma organización (no mezclar
código de otros módulos, no tocar sus carpetas).

**Importante**: no ejecutes `supabase db push`, `supabase link` ni nada
que toque credenciales reales — eso lo corre Tomás directamente en su
terminal. Tu entregable de base de datos es el archivo de migración SQL,
listo para que él lo aplique.

Antes de empezar, revisa la carpeta `supabase/migrations/` para confirmar
la numeración correcta del siguiente archivo (debería seguir después de
las 6 migraciones existentes) y el nombre real de la función de trigger
`updated_at` que ya se usa en otras tablas (reutilízala, no la
redefinas). Revisa también la tabla `negocios` (o como se llame en el
seed real) para confirmar el `slug`/`id` de la fila que representa
"STGL / general", y los slugs de HYDREX, HANGARC, VirtualWaiter y
HARDTECH si ya existen.

## 1. Migración: `documentos` + `ms_graph_tokens`

Crea la migración con este contenido (ajusta nombres de función/tabla si
difieren de lo que encuentres en el repo real):

```sql
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  nombre text not null,
  categoria text not null,
  tipo_documento text,
  es_carpeta boolean not null default false,
  onedrive_item_id text not null,
  onedrive_parent_id text,
  onedrive_path text,
  onedrive_web_url text,
  fecha date not null default current_date,
  observaciones text,
  metadata jsonb not null default '{}'::jsonb,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (onedrive_item_id)
);

create index if not exists idx_documentos_negocio on public.documentos(negocio_id);
create index if not exists idx_documentos_categoria on public.documentos(categoria);
create index if not exists idx_documentos_parent on public.documentos(onedrive_parent_id);

alter table public.documentos enable row level security;

create policy "documentos_select_authenticated" on public.documentos
  for select to authenticated using (true);
create policy "documentos_insert_authenticated" on public.documentos
  for insert to authenticated with check (true);
create policy "documentos_update_authenticated" on public.documentos
  for update to authenticated using (true);
create policy "documentos_delete_authenticated" on public.documentos
  for delete to authenticated using (true);

create trigger set_updated_at_documentos
  before update on public.documentos
  for each row execute function public.set_updated_at(); -- usar la función real existente

-- Guarda el refresh/access token de la cuenta única de OneDrive de STGL.
-- Fila única. Solo el backend (service role) la lee/escribe — sin policies
-- para "authenticated", así el frontend nunca puede leerla.
create table if not exists public.ms_graph_tokens (
  id int primary key default 1,
  access_token text,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table public.ms_graph_tokens enable row level security;
-- Sin policies de select/insert/update para "authenticated" a propósito.
```

Nota: `categoria` y `tipo_documento` quedan como texto libre a propósito
(no enum ni tabla cerrada) — igual que se decidió para "STGL / general" en
gastos: no hay lista cerrada de categorías de documentos, se define en la
práctica.

## 2. Cliente de Microsoft Graph — `src/lib/msgraph.ts`

Variables de entorno ya configuradas en Vercel por Tomás/Samuel (ver
`GUIA_MICROSOFT_ENTRA_FASE6.md`, no las inventes ni las pidas de otra
forma):
- `MSGRAPH_CLIENT_ID`
- `MSGRAPH_CLIENT_SECRET`
- `MSGRAPH_REDIRECT_URI` (`https://stgl.tomasgarces.com/api/onedrive/auth/callback`)
- `MSGRAPH_TENANT` — **usar el Id. de directorio (tenant) real**, NO
  `common` ni `consumers`. La app quedó registrada en un tenant propio
  y dedicado de `stglsas@hotmail.com` (Default Directory), no en el
  tenant genérico de cuentas Microsoft — usar el ID genérico causó
  errores de login (`AADSTS16000`) durante el registro. Todas las URLs
  de OAuth (`/authorize`, `/token`) deben construirse con
  `https://login.microsoftonline.com/{MSGRAPH_TENANT}/oauth2/v2.0/...`
  usando ese ID de tenant específico.

Implementa:

- `getAuthorizationUrl()`: arma la URL de consentimiento de Microsoft
  (`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize`)
  con scopes `Files.ReadWrite offline_access User.Read`.
- `exchangeCodeForTokens(code: string)`: intercambia el `code` del
  callback por `access_token` + `refresh_token`, y los guarda (upsert) en
  `ms_graph_tokens` usando el cliente de Supabase con **service role**
  (nunca desde el cliente del navegador).
- `getValidAccessToken()`: lee `ms_graph_tokens`; si `expires_at` ya
  pasó (o está por vencer en <5 min), pide un access token nuevo con el
  `refresh_token` guardado, actualiza la fila, y devuelve el token
  vigente. Toda llamada a Graph pasa por esta función — nunca hardcodear
  un token.
- `listChildren(folderId?: string)`: `GET /me/drive/items/{id}/children`
  (o `/me/drive/root/children` si no hay id) — para navegar carpetas en
  vivo cuando haga falta refrescar contra OneDrive real.
- `createFolder(parentId: string, name: string)`: `POST` a
  `/me/drive/items/{parentId}/children` con
  `{ name, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }`.
- `uploadSmallFile(parentId: string, filename: string, fileBuffer: Buffer)`:
  `PUT /me/drive/items/{parentId}:/{filename}:/content` (válido hasta
  ~4MB; si más adelante suben archivos más pesados hay que pasar a
  sesión de upload — déjalo como comentario TODO, no lo implementes
  ahora).

## 3. Rutas API (`src/app/api/onedrive/...` o `src/pages/api/onedrive/...`,
según el patrón que ya use el repo)

- `GET /api/onedrive/auth/login`: redirige a `getAuthorizationUrl()`.
  Solo debe poder llamarla un usuario autenticado (superadmin, o sea
  Tomás/Samuel).
- `GET /api/onedrive/auth/callback`: recibe `code`, llama
  `exchangeCodeForTokens`, y redirige a `/documentos?conectado=1`.
- `POST /api/onedrive/folder`: body `{ negocio_id, categoria, nombre,
  parent_onedrive_id? }` → llama `createFolder` en Graph, inserta fila en
  `documentos` con `es_carpeta: true` y el `onedrive_item_id` devuelto.
- `POST /api/onedrive/upload`: recibe `multipart/form-data` (archivo +
  `negocio_id` + `categoria` + `tipo_documento` + `parent_onedrive_id?`),
  sube a Graph con `uploadSmallFile`, e inserta la fila correspondiente en
  `documentos`.
- `GET /api/documentos`: lista desde la tabla `documentos` (no desde
  Graph directamente, para que filtrar/buscar sea rápido), con query
  params `negocio`, `categoria`, `q` (búsqueda por nombre), `parent`
  (para navegar como carpetas).

## 4. Frontend — `src/modules/documentos/`

Pantalla según sección 15.5 del documento de requerimientos:

- **Explorador tipo carpetas**: lista de `documentos` filtrada por
  `parent_onedrive_id` actual (null = raíz de STGL), con breadcrumb de
  navegación. Carpetas primero, luego archivos.
- **Filtro por negocio y categoría** (selects, alimentados por los
  valores distintos que ya existan en la tabla + el listado fijo de
  negocios).
- **Botón "Subir archivo"**: input de archivo → `POST /api/onedrive/upload`.
  Mostrar progreso y el resultado (nombre, negocio, categoría asignada en
  un formulario corto antes de confirmar la subida).
- **Botón "Nueva carpeta"**: modal con nombre + negocio + categoría →
  `POST /api/onedrive/folder`.
- **Buscador**: input que dispara `GET /api/documentos?q=...` (busca en
  toda la base, no solo la carpeta actual).
- Cada fila de documento: nombre, categoría, negocio (badge), fecha, y
  un link a `onedrive_web_url` que abre el archivo real en OneDrive en
  pestaña nueva.
- **No exponer nombres de columnas ni de tablas internas en la UI** (ej.
  no mostrar "onedrive_item_id" ni "es_carpeta" como etiquetas — usar
  textos naturales en español).
- Si el usuario es superadmin y `ms_graph_tokens` está vacía, mostrar un
  aviso simple: "Falta conectar la cuenta de OneDrive de STGL" con un
  botón que lleve a `/api/onedrive/auth/login`.

## 5. Al terminar

Corre `npm run build` para confirmar que no hay errores de tipos ni de
build. Deja un resumen corto de los archivos creados/modificados,
mencionando cualquier decisión que hayas tenido que tomar por tu cuenta
(ej. si la función `set_updated_at` se llamaba distinto, si la tabla
`negocios` tenía otro nombre, etc.) para que quede documentado.
