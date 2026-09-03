# PROMPT_CURSOR_FASE9_PARTE1.md — STGL Plataforma: Sistema de diseño visual

## Contexto
Repo: STGL-SAS/stgl-plataforma (Next.js + TypeScript + Tailwind + Supabase).
Fases 1-8 completadas y en producción (stgl.tomasgarces.com). Esta fase NO agrega
funcionalidad nueva — solo pule el diseño visual de los módulos ya construidos:
core, contabilidad, inventario-hydrex, documentos, tareas, hardtech, clientes,
dashboard.

## Logos
Los logos de cada negocio están en `public/logos/`:
- `public/logos/hydrex.png`
- `public/logos/hangarc.png`
- `public/logos/virtualwaiter.png`
- `public/logos/hardtech.png`
- `public/logos/stgl.png` (puede no existir todavía — STGL aún no tiene
  identidad visual definida; usar el fallback de iniciales descrito abajo si
  falta)

Úsalos en:
1. **Navegación principal / sidebar**: junto al nombre de cada negocio, como
   ícono pequeño (24-32px) en el selector de negocio o menú lateral.
2. **Dashboard general (15.1)**: en la tarjeta-resumen de cada negocio (junto al
   balance), como identificador visual rápido.
3. **Vista por negocio (15.2)**: como encabezado de esa pantalla — logo + nombre
   del negocio, reemplazando el texto plano actual.
4. **Favicon/header** (opcional si el tiempo alcanza): usar `stgl.png` como
   ícono general de la plataforma si existe, si no dejar el actual.

Usar Next.js `<Image>` con `object-contain`, sin recortar ni distorsionar. Si un
logo no está disponible para algún negocio (incluyendo STGL, que hoy no tiene
marca propia), dejar un placeholder con las iniciales del negocio en un círculo
de color neutro — no romper el layout ni bloquear el resto de la fase por esto.

## Sistema de diseño

1. Crear `src/styles/tokens.ts` (o extender `tailwind.config.ts`) con:
   - Paleta: primary, neutral (gray-50 a gray-900), success, warning, error, info.
     Usar los semánticos para los badges de estado de HYDREX
     (Excelente/Ajustado/Crítico/Pérdida) y de transacciones Bold
     (pendiente/clasificada).
   - Tipografía: Inter vía next/font, escala fija (text-xs a text-3xl con
     line-height definido).
   - Espaciado: solo la escala default de Tailwind (4,8,16,24,32,48px);
     eliminar valores arbitrarios sueltos donde se encuentren.
   - Radius y sombras: 2-3 variantes reutilizables, nada custom por componente.

2. Crear/consolidar en `src/components/ui/`:
   - Button (variants: primary, secondary, danger, ghost)
   - Input, Select, Textarea
   - Table (variante responsive: colapsa a tarjetas apiladas en móvil)
   - Card
   - Badge (para estados)
   - Modal
   - Toast/ErrorBanner
   - EmptyState, LoadingSkeleton
   - BusinessLogo (componente que recibe el negocio y muestra su logo con
     fallback de iniciales en círculo neutro)

   Auditar todos los módulos (`contabilidad`, `inventario-hydrex`, `documentos`,
   `tareas`, `hardtech`, `core`) y reemplazar los elementos custom/duplicados
   por estos componentes compartidos.

3. Responsividad: aplicar breakpoints sm(640)/lg(1024) de Tailwind en:
   - Navegación principal (colapsar a menú inferior o hamburguesa en móvil)
   - Tablas de listas largas (transacciones, movimientos_inventario, documentos,
     tareas, clientes)
   - Formularios de registro (venta HYDREX, venta HARDTECH, gasto)

   Probar en viewport de 375px, 768px y 1280px.

4. Estados vacíos/carga/error: revisar las 8 pantallas de la sección 15 del
   documento de requerimientos (`STGL_Requerimientos_Plataforma.md`) y asegurar
   que cada una tenga las tres variantes usando los componentes
   EmptyState/LoadingSkeleton/ErrorBanner — sin mensajes de error crudos de
   Supabase visibles al usuario.

## Reglas del proyecto (no negociables)
- No tocar la estructura modular por dominio (`contabilidad/`, `inventario-hydrex/`,
  `documentos/`, `tareas/`, `hardtech/`) — el sistema de diseño se comparte, la
  lógica de negocio no se mezcla entre módulos.
- No exponer nombres de columnas/tablas de la base de datos en la UI (headings,
  labels, mensajes de error).
- No tocar variables de entorno ni credenciales de Vercel/Supabase.
- No agregar funcionalidad nueva — esta fase es solo diseño visual.

## Entregable
Al terminar, entregar un resumen corto con:
- Qué pantallas/componentes se actualizaron.
- Si algún logo faltó, no cargó, o quedó con el placeholder de iniciales.
- Cualquier inconsistencia visual encontrada que haya quedado pendiente por
  falta de información (ej. spacing que no se pudo resolver sin definir antes
  un caso de uso).
