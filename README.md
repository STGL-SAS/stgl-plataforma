# STGL Plataforma

Plataforma interna de gestión para STGL (HYDREX, HANGARC, VirtualWaiter).

## Requisitos

- Node.js 20+
- Cuenta Supabase (proyecto vinculado)
- Supabase CLI

## Desarrollo local

```bash
cp .env.local.example .env.local
# Completar las variables de Supabase en .env.local

npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Base de datos

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
# Seed: pegar supabase/seed.sql en el SQL Editor de Supabase
```

## Estructura

- `src/app/` — rutas Next.js (contabilidad, hydrex, hangarc, etc.)
- `src/modules/` — lógica de negocio por dominio
- `supabase/migrations/` — esquema Postgres
- `docs/` — requerimientos del proyecto
