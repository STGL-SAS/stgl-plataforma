# PROMPT_CURSOR_FASE9_PARTE1_v2.md — STGL Plataforma: Rediseño visual con identidad propia

## Contexto y por qué este prompt reemplaza al anterior
Ya se implementó una primera pasada de sistema de diseño (tokens, componentes UI base,
logos). Funciona pero se ve **genérico**: tarjetas idénticas con el mismo
border-radius, misma sombra gris suave, sin jerarquía ni personalidad — el
"kit SaaS por defecto" que sale cuando no se define una identidad concreta.
Esta fase corrige eso: no es un ajuste más, es un rediseño con dirección
propia. Además hay un bug de estructura real que corregir primero.

No se agrega funcionalidad nueva — es diseño visual y arquitectura de
navegación únicamente.

## BUG PRIORITARIO — navegación duplicada
Al entrar a un módulo de negocio (ej. HARDTECH → Ventas), se están mostrando
DOS barras de navegación apiladas y sin relación jerárquica clara:
1. La navegación global de la plataforma (Inicio / Contabilidad / Tareas /
   Clientes / Documentos / HARDTECH / HYDREX / Configuración)
2. La navegación interna del módulo (Ventas / Mantenimientos / Gastos / Pagos
   entre socios / Cuenta USD / Clientes)

Esto confunde: no queda claro cuál es "la" navegación principal. Rediseñar
como jerarquía de dos niveles clara y visualmente distinta:
- **Nivel 1 (siempre visible, fijo)**: identidad STGL + selector de negocio
  (con logos) + accesos base (Inicio, Configuración). Debe verse claramente
  como el "afuera" — el contenedor de todo.
- **Nivel 2 (contextual, cambia según dónde estás)**: las secciones internas
  del módulo actual (ej. dentro de HARDTECH: Ventas/Mantenimientos/Gastos/...).
  Debe verse visualmente como "adentro" del nivel 1 — subordinado, no una
  segunda barra del mismo peso.
Sugerencia de patrón: nivel 1 como sidebar fijo o header delgado con el
selector de negocio; nivel 2 como tabs o sub-navegación dentro del propio
`ModuleShell`, ligado visualmente al contenido de ese módulo (mismo fondo,
sin la línea/borde que lo separa como si fuera otra barra completa).

## Dirección de diseño: "Bitácora de taller"
STGL no es una startup SaaS de consumo — son dos socios operando 4 negocios
físicos/técnicos (impermeables, aeromodelismo, tecnología, software de
restaurantes) desde una sola cabina de control. La plataforma debe sentirse
como un tablero de operaciones / bitácora técnica de taller, no como un
dashboard financiero genérico de plantilla.

### Color
- Fondo base: `#F7F5F0` (papel cálido, no blanco puro)
- Texto principal: `#1C1B19` (casi negro, no negro puro)
- Acento neutro STGL (nivel 1, general): `#8A8578` (bronce apagado)
- Acento por negocio (cada uno tiene el suyo, se usa como franja/detalle, no
  como fondo completo):
  - HYDREX: `#2B5F8A` (azul lluvia)
  - HANGARC: `#C4622D` (naranja óxido)
  - VirtualWaiter: `#5B7A5C` (verde oliva)
  - HARDTECH: `#3A3D42` (grafito)
- Semánticos (mantener del sistema anterior): success, warning, error, info —
  pero recalibrados para no chocar con la paleta cálida de fondo.

### Tipografía
- Serif con carácter para títulos y números grandes (montos, balances):
  Fraunces o Source Serif 4, vía next/font. Le da peso "editorial/libro de
  cuentas" en vez de look de app genérica.
- Grotesk condensada o mono para datos tabulares, badges de estado, labels
  pequeños (montos en tablas, códigos, fechas): JetBrains Mono o similar —
  refuerza la idea de "bitácora técnica".
- NO usar mayúsculas sostenidas para labels (evitar el tic de "EEEBROW LABEL"
  en todo). NO acentuar una sola palabra del título con color/cursiva.

### Layout
- Border-radius casi nulo (0–4px) en tarjetas y contenedores — nada de
  esquinas muy redondeadas tipo SaaS-card-kit. Piensa en fichas de archivo,
  no en burbujas.
- El balance por negocio (dashboard) NO es un grid de tarjetas idénticas:
  es una lista tipo ficha/expediente — franja vertical del color de ese
  negocio a la izquierda, logo pequeño, nombre, y el número del mes actual en
  serif grande como único elemento de énfasis por fila. Todo lo demás
  (acumulado, meta) queda pequeño y en mono.
- Nada de sombra gris suave (`shadow` genérico de Tailwind) repetida en cada
  tarjeta — si se usa sombra, que sea sutil y consistente con el concepto de
  "papel", no el efecto flotante de app.
- Un solo momento de animación/protagonismo por pantalla (ej. el número del
  balance al cargar), no fade-in genérico en cada card ni hover-transition en
  todo elemento.

### Principios
- Cada negocio se reconoce por su color de acento antes de leer el nombre —
  consistente en nav, dashboard, headers de módulo y badges.
- Los datos (montos, fechas, estados) siempre en la tipografía mono/condensada
  para que se sientan como registros de bitácora, no como texto decorativo.
- Restraint: el color y la serif grande son el protagonismo — el resto
  (botones, inputs, tablas) se queda disciplinado y silencioso.

## Libertad técnica para Cursor
Tienes libertad de elegir e instalar las librerías que consideres necesarias
para lograr esto bien (por ejemplo: Framer Motion si se justifica para el
único momento de animación, una librería de iconos coherente con el concepto
en vez de emojis o el set por defecto, etc.) — prioriza que el resultado se
vea intencional y bien ejecutado sobre reutilizar exactamente los componentes
ya creados en la pasada anterior si no sirven a esta dirección. Es válido
reescribir `src/styles/tokens.ts` y los componentes en `src/components/ui/`
desde cero si el enfoque actual no da para esta identidad.

Antes de escribir código: arma primero un plan corto (paleta con hex,
tipografías con su rol, layout del dashboard y de un módulo con ASCII
wireframe) y revisa que no se parezca al look genérico anterior (cards
idénticas, radius grande, sombra suave, todo en azul/gris). Si algo del plan
se siente "por defecto" en vez de una decisión para STGL específicamente,
ajústalo antes de construir.

## Alcance (todas las pantallas de la sección 15 del documento de
requerimientos)
Dashboard (15.1), Vista por negocio (15.2), Contabilidad (15.3), HYDREX
(15.4), Documentos (15.5), Tareas (15.6), Configuración (15.7), HARDTECH
(15.8) — aplicar la identidad de forma consistente en las 8, no solo en el
dashboard.

## Reglas del proyecto (no negociables)
- No tocar la estructura modular por dominio (`contabilidad/`,
  `inventario-hydrex/`, `documentos/`, `tareas/`, `hardtech/`) — el rediseño
  visual y de navegación no debe mezclar lógica de negocio entre módulos.
- No exponer nombres de columnas/tablas de la base de datos en la UI.
- No tocar variables de entorno ni credenciales.
- No agregar funcionalidad nueva — esto es diseño visual + arquitectura de
  navegación.
- Mantener responsividad (móvil/tablet/escritorio) y accesibilidad (foco de
  teclado visible, contraste suficiente) mientras se aplica el rediseño.

## Entregable
Al terminar, entregar:
1. El plan de diseño corto (paleta, tipografía, layout) que se siguió.
2. Capturas o descripción de cómo quedó el dashboard y al menos un módulo
   (ej. HARDTECH) antes/después.
3. Confirmación de que la navegación duplicada quedó resuelta como jerarquía
   de 2 niveles.
4. Qué librerías nuevas se instalaron, si alguna.
