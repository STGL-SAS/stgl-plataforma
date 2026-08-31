# STGL — Fase 2: Estructura de repositorio + migraciones iniciales

> Pega este documento completo en Cursor. Contiene todo lo necesario para
> ejecutar la Fase 2: estructura del proyecto, las 6 migraciones SQL, el
> seed de datos base, y los pasos de terminal para dejarlo todo aplicado
> contra el proyecto de Supabase y las variables de entorno en Vercel.

---

## 0. Contexto (no lo repitas, solo úsalo de guía)

- Sociedad STGL, 2 socios: Tomás Garcés y Samuel López.
- 3 negocios + STGL como entidad general: HYDREX (activo), HANGARC (en
  desarrollo), VirtualWaiter (en desarrollo).
- % de participación: HYDREX 50/50, HANGARC 50/50, VirtualWaiter 43% Tomás
  / 57% Samuel.
- Cuentas: Bold (ventas HYDREX) y Bancolombia General (compartida entre
  HANGARC, VirtualWaiter y STGL).
- La Fase 1 (cuentas/proyectos en Supabase, GitHub y Vercel) ya está lista.
  Vas a necesitar del usuario: el **project ref de Supabase**, la
  **contraseña de la base de datos**, la **URL del repo de GitHub** (si ya
  existe) y el **nombre del proyecto en Vercel**. Pídeselos si no los
  tienes antes de continuar con los pasos que los requieren.
- Regla de arquitectura no negociable: el inventario/costeo es exclusivo
  de HYDREX y no debe mezclarse con los demás negocios ni con el ledger
  general de `transacciones`. El "canal de venta" (Mercado Libre, Rappi,
  Web, etc.) es un concepto del motor de costeo de HYDREX (Fase 4) — NO
  es lo mismo que `origen` en `transacciones`, que aquí solo indica cómo
  entró el dato al sistema (manual, Bold, Shopify).

---

## 1. Estructura de carpetas a crear

```
stgl-platform/                       (raíz del repo = raíz del proyecto Next.js)
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── contabilidad/
│   │   ├── hydrex/
│   │   ├── hangarc/
│   │   ├── virtualwaiter/
│   │   ├── documentos/
│   │   ├── tareas/
│   │   ├── configuracion/
│   │   └── layout.tsx
│   ├── modules/
│   │   ├── core/                  # negocios, socios, participación
│   │   ├── contabilidad/          # transacciones, aportes, intercompañía
│   │   ├── inventario-hydrex/     # vacío por ahora, exclusivo de HYDREX (Fase 4)
│   │   ├── documentos/            # vacío por ahora (Fase 5)
│   │   └── tareas/                # vacío por ahora (Fase 6)
│   ├── components/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── server.ts
│   └── types/
│       └── database.ts
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── docs/
│   └── STGL_Requerimientos_Plataforma.md
├── public/
├── .env.local.example
├── .gitignore
├── package.json
└── README.md
```

Deja `inventario-hydrex/`, `documentos/` y `tareas/` como carpetas vacías
con un `.gitkeep` — se llenan en fases posteriores, no las implementes
ahora.

---

## 2. Pasos a ejecutar

### 2.1 Repo y scaffolding de Next.js

1. Si ya existe un repositorio vacío en GitHub de la Fase 1, clónalo y
   trabaja ahí. Si no existe, créalo (`gh repo create stgl-platform
   --private --source=. --remote=origin`, requiere GitHub CLI
   autenticado) o pide la URL antes de seguir.
2. Dentro del repo:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint
   ```
3. Instala el cliente de Supabase:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```
4. Crea el resto de carpetas de la sección 1 que `create-next-app` no
   generó (`src/modules/*`, `docs/`, etc.).
5. Copia `STGL_Requerimientos_Plataforma.md` (lo tiene el usuario en el
   proyecto de Claude) a `docs/`.

### 2.2 Supabase CLI: instalar, login y link al proyecto ya creado

```bash
npm install -g supabase
supabase login
supabase init
supabase link --project-ref <SUPABASE_PROJECT_REF>
```
Te pedirá la contraseña de la base de datos (la que se definió en la
Fase 1). `supabase init` crea `supabase/config.toml` y la carpeta
`supabase/migrations/` — está bien que sobreescriba lo que ya tenías ahí.

### 2.3 Migraciones

Crea cada migración con `supabase migration new <nombre>` (genera el
archivo con el timestamp correcto) y pega el contenido exacto indicado
abajo. **Respeta este orden** — cada una depende de la anterior:

#### a) `negocios`
```bash
supabase migration new negocios
```
```sql
-- Los 3 negocios de STGL + STGL como entidad general (paraguas)
create extension if not exists pgcrypto;

create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  estado text not null default 'activo'
    check (estado in ('activo', 'en_desarrollo', 'inactivo')),
  created_at timestamptz not null default now()
);

comment on table negocios is 'Los 3 negocios de STGL + STGL como entidad general.';
comment on column negocios.codigo is 'Identificador corto estable: HYDREX, HANGARC, VIRTUALWAITER, STGL';

alter table negocios enable row level security;

create policy "negocios_authenticated_full_access"
  on negocios for all
  to authenticated
  using (true)
  with check (true);
```

#### b) `socios_participacion` (incluye la tabla base `socios`, prerequisito)
```bash
supabase migration new socios_participacion
```
```sql
-- Socios de STGL y su % de participación por negocio
create table if not exists socios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique,
  user_id uuid references auth.users(id),
  rol text not null default 'superadmin'
    check (rol in ('superadmin', 'usuario_normal')),
  created_at timestamptz not null default now()
);

comment on table socios is 'Socios de STGL (Tomás, Samuel) y futuros colaboradores. user_id se enlaza a auth.users cuando se active login.';
comment on column socios.rol is 'Pensado para roles/permisos futuros (Fase 7) — hoy ambos socios son superadmin.';

create table if not exists socios_participacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  socio_id uuid not null references socios(id) on delete cascade,
  porcentaje numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  created_at timestamptz not null default now(),
  unique (negocio_id, socio_id)
);

comment on table socios_participacion is '% de participación de cada socio por negocio (ej. HYDREX 50/50, VirtualWaiter 43/57).';

-- Valida que la suma de % por negocio nunca pase de 100
create or replace function chk_socios_participacion_suma()
returns trigger as $$
declare
  suma numeric(5,2);
begin
  select coalesce(sum(porcentaje), 0) into suma
  from socios_participacion
  where negocio_id = new.negocio_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if suma + new.porcentaje > 100 then
    raise exception 'La suma de participación para este negocio superaría el 100%% (actual: %, nuevo: %)', suma, new.porcentaje;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_chk_socios_participacion_suma
  before insert or update on socios_participacion
  for each row execute function chk_socios_participacion_suma();

alter table socios enable row level security;
alter table socios_participacion enable row level security;

create policy "socios_authenticated_full_access"
  on socios for all to authenticated using (true) with check (true);

create policy "socios_participacion_authenticated_full_access"
  on socios_participacion for all to authenticated using (true) with check (true);
```

#### c) `cuentas_bancarias`
```bash
supabase migration new cuentas_bancarias
```
```sql
create table if not exists cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('bold', 'bancaria', 'otro')),
  descripcion text,
  created_at timestamptz not null default now()
);

comment on table cuentas_bancarias is 'Cuentas reales de pago/banco (Bold, Bancolombia general). Una cuenta puede alimentar más de un negocio — el negocio real de cada movimiento se etiqueta en transacciones, no aquí.';

alter table cuentas_bancarias enable row level security;

create policy "cuentas_bancarias_authenticated_full_access"
  on cuentas_bancarias for all to authenticated using (true) with check (true);
```

#### d) `transacciones`
```bash
supabase migration new transacciones
```
```sql
create type tipo_transaccion as enum ('ingreso', 'egreso', 'aporte', 'intercompania');
create type estado_transaccion as enum ('pendiente_revision', 'clasificada');
create type origen_transaccion as enum ('manual', 'bold', 'shopify');

create table if not exists transacciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  cuenta_id uuid references cuentas_bancarias(id),
  tipo tipo_transaccion not null,
  categoria text,
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  nombre_original text,
  nombre_interno text,
  observaciones text,
  estado estado_transaccion not null default 'pendiente_revision',
  origen origen_transaccion not null default 'manual',
  origen_referencia_id text,
  metadata jsonb not null default '{}'::jsonb,
  creado_por uuid references socios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transacciones_clasificada_requiere_datos check (
    estado <> 'clasificada' or (nombre_interno is not null and categoria is not null)
  )
);

comment on table transacciones is 'Ledger central: todo ingreso/egreso/aporte/intercompañía de cualquier negocio pasa por aquí. aportes_socios y movimientos_intercompania la extienden con sus datos propios, sin duplicar el balance.';
comment on column transacciones.origen is 'Cómo entró el dato al sistema (manual/bold/shopify) — NO es el canal de venta de HYDREX, eso vive en el módulo de costeo (Fase 4).';
comment on column transacciones.origen_referencia_id is 'ID de la transacción en Bold u otra fuente externa, para evitar duplicados al sincronizar.';
comment on column transacciones.nombre_original is 'Nombre/descripción tal cual la reporta Bold u otro origen automático.';

create unique index if not exists transacciones_origen_referencia_unica
  on transacciones (origen, origen_referencia_id)
  where origen_referencia_id is not null;

create index if not exists idx_transacciones_negocio_fecha on transacciones (negocio_id, fecha);
create index if not exists idx_transacciones_estado on transacciones (estado);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_transacciones_updated_at
  before update on transacciones
  for each row execute function set_updated_at();

alter table transacciones enable row level security;

create policy "transacciones_authenticated_full_access"
  on transacciones for all to authenticated using (true) with check (true);
```

#### e) `aportes_socios`
```bash
supabase migration new aportes_socios
```
```sql
create type clasificacion_aporte as enum ('capital', 'prestamo', 'sin_definir');

create table if not exists aportes_socios (
  id uuid primary key default gen_random_uuid(),
  transaccion_id uuid not null references transacciones(id) on delete cascade,
  socio_id uuid not null references socios(id),
  negocio_id uuid not null references negocios(id),
  clasificacion clasificacion_aporte not null default 'sin_definir',
  devuelto boolean not null default false,
  monto_devuelto numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table aportes_socios is 'Extiende una transacción de tipo aporte con el socio, negocio y clasificación (capital/préstamo — se decide en la práctica, no bloquea el registro).';

create index if not exists idx_aportes_socios_socio on aportes_socios (socio_id);
create index if not exists idx_aportes_socios_negocio on aportes_socios (negocio_id);

-- Solo se puede enlazar un aporte a una transacción de tipo 'aporte'
create or replace function chk_aporte_transaccion_tipo()
returns trigger as $$
declare
  t_tipo tipo_transaccion;
begin
  select tipo into t_tipo from transacciones where id = new.transaccion_id;
  if t_tipo <> 'aporte' then
    raise exception 'aportes_socios solo puede enlazarse a una transacción de tipo aporte (id: %)', new.transaccion_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_chk_aporte_transaccion_tipo
  before insert or update on aportes_socios
  for each row execute function chk_aporte_transaccion_tipo();

alter table aportes_socios enable row level security;

create policy "aportes_socios_authenticated_full_access"
  on aportes_socios for all to authenticated using (true) with check (true);
```

#### f) `movimientos_intercompania`
```bash
supabase migration new movimientos_intercompania
```
```sql
create table if not exists movimientos_intercompania (
  id uuid primary key default gen_random_uuid(),
  negocio_origen_id uuid not null references negocios(id),
  negocio_destino_id uuid not null references negocios(id),
  transaccion_origen_id uuid references transacciones(id),
  transaccion_destino_id uuid references transacciones(id),
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  concepto text not null,
  observaciones text,
  created_at timestamptz not null default now(),
  constraint movimientos_intercompania_negocios_distintos
    check (negocio_origen_id <> negocio_destino_id)
);

comment on table movimientos_intercompania is 'Cuando un negocio le presta/transfiere plata a otro. transaccion_origen_id (egreso) y transaccion_destino_id (ingreso) enlazan cada lado al ledger de transacciones para que el balance de cada negocio quede exacto.';

create index if not exists idx_movim_intercomp_origen on movimientos_intercompania (negocio_origen_id);
create index if not exists idx_movim_intercomp_destino on movimientos_intercompania (negocio_destino_id);

alter table movimientos_intercompania enable row level security;

create policy "movimientos_intercompania_authenticated_full_access"
  on movimientos_intercompania for all to authenticated using (true) with check (true);
```

### 2.4 Aplicar las migraciones al proyecto remoto

```bash
supabase db push
```
Confirma que corrió sin errores y que las 6 tablas aparecen en el
Table Editor del dashboard de Supabase.

### 2.5 Seed de datos iniciales

Crea `supabase/seed.sql` con este contenido:

```sql
-- Datos base: negocios, socios, % de participación, cuentas
-- Pensado para ejecutarse una sola vez al inicializar la base.

insert into negocios (codigo, nombre, estado) values
  ('HYDREX', 'HYDREX', 'activo'),
  ('HANGARC', 'HANGARC', 'en_desarrollo'),
  ('VIRTUALWAITER', 'VirtualWaiter', 'en_desarrollo'),
  ('STGL', 'STGL (general)', 'activo')
on conflict (codigo) do nothing;

insert into socios (nombre, rol) values
  ('Tomás Garcés', 'superadmin'),
  ('Samuel López', 'superadmin');

insert into socios_participacion (negocio_id, socio_id, porcentaje)
select n.id, s.id, v.porcentaje
from (values
  ('HYDREX', 'Tomás Garcés', 50),
  ('HYDREX', 'Samuel López', 50),
  ('HANGARC', 'Tomás Garcés', 50),
  ('HANGARC', 'Samuel López', 50),
  ('VIRTUALWAITER', 'Tomás Garcés', 43),
  ('VIRTUALWAITER', 'Samuel López', 57)
) as v(negocio_codigo, socio_nombre, porcentaje)
join negocios n on n.codigo = v.negocio_codigo
join socios s on s.nombre = v.socio_nombre
on conflict (negocio_id, socio_id) do nothing;

insert into cuentas_bancarias (nombre, tipo, descripcion) values
  ('Bold', 'bold', 'Recibe ventas de HYDREX: Shopify, Mercado Libre, Rappi, distribuidores, ventas en persona.'),
  ('Bancolombia General', 'bancaria', 'Compartida entre HANGARC, VirtualWaiter y posibles gastos de STGL.');
```

Ejecútalo contra el proyecto remoto. La forma más simple: copia el
contenido y pégalo en el **SQL Editor** del dashboard de Supabase y
corre. Alternativa por CLI si tienes la connection string a mano
(Project Settings → Database → Connection string → URI):
```bash
psql "<CONNECTION_STRING>" -f supabase/seed.sql
```
Verifica en el Table Editor que aparezcan los 4 negocios, los 2 socios,
las 6 filas de participación y las 2 cuentas.

### 2.6 Cliente de Supabase en el frontend

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

`.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
`SUPABASE_SERVICE_ROLE_KEY` es solo para uso en servidor — nunca con
prefijo `NEXT_PUBLIC_`, nunca en el cliente, nunca commiteado (confirma
que `.env.local` está en `.gitignore`).

### 2.7 Vercel: guardar las variables de entorno

Una vez exista el proyecto de Next.js:
```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```
Los valores de `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
están en el dashboard de Supabase → Project Settings → API. El
`SUPABASE_SERVICE_ROLE_KEY` está en la misma página — trátalo como
secreto, solo en `production` (o donde de verdad se necesite server-side).

### 2.8 Commit y push

```bash
git add .
git commit -m "Fase 2: estructura de repo + migraciones iniciales de negocios, socios, cuentas y transacciones"
git push origin main
```

---

## 3. Checklist final (confírmalo antes de terminar)

- [ ] Proyecto Next.js corre localmente (`npm run dev`) sin errores.
- [ ] Las 6 migraciones se aplicaron al proyecto de Supabase (`supabase db push` sin errores).
- [ ] El seed cargó: 4 negocios, 2 socios, 6 filas de participación, 2 cuentas.
- [ ] RLS está activo en las 6 tablas (visible en el dashboard de Supabase, sección Authentication → Policies).
- [ ] `.env.local` existe localmente, tiene los 3 valores, y está en `.gitignore` (no se commiteó).
- [ ] Variables de entorno guardadas en Vercel para los 3 ambientes (production/preview/development donde aplique).
- [ ] Repo commiteado y pusheado a GitHub.

## 4. Al terminar

Escribe un resumen corto (5-8 líneas) de lo que quedó construido y
cualquier decisión que hayas tenido que tomar sobre la marcha, para
devolverlo al chat principal de planeación del proyecto STGL.
