# Plataforma de Gestión STGL — Documento de Requerimientos

**Sociedad:** STGL (Tomás Garcés y Samuel López)
**Negocios:** HYDREX, HANGARC, VirtualWaiter
**Objetivo:** un sistema único, sin costo inicial, que unifique contabilidad, inventario, documentos y tareas de los 3 negocios y de la sociedad, con trazabilidad total.

---

## 1. Estructura societaria

| Negocio | Estado | Participación Tomás | Participación Samuel |
|---|---|---|---|
| HYDREX | Operando (ventas activas) | 50% | 50% |
| HANGARC | En desarrollo | 50% | 50% |
| VirtualWaiter | En desarrollo | 43% | 57% |
| STGL (sociedad, gastos/activos comunes) | Paraguas general | — | — |

STGL se maneja como una "entidad" más dentro del sistema, para todo lo que no es específico de un solo negocio (documentos legales de la sociedad, marca STGL, gastos compartidos entre socios que no son de un proyecto puntual).

---

## 2. Cuentas bancarias y de pago

| Cuenta | Uso |
|---|---|
| Bold | Recibe ventas de HYDREX: Shopify, Mercado Libre, Rappi, distribuidores, ventas en persona |
| Bancolombia (cuenta general) | Compartida entre HANGARC y VirtualWaiter (y posibles gastos de STGL) |

Una cuenta puede alimentar a más de un negocio — cada movimiento se etiqueta con el negocio al que pertenece realmente, no con la cuenta desde la que salió/entró.

---

## 3. Módulo de Contabilidad Multi-negocio

### 3.1 Qué debe registrar
- **Ingresos y egresos** por negocio, con categoría (ventas, nómina, hosting, marketing, insumos, servicios, etc.) y soporte adjunto (factura/comprobante, enlazado a OneDrive — ver sección 6).
- **Aportes de socios**: lo importante es saber, en todo momento, **a qué negocio específico fue cada aporte** y cuánto suma por socio (total y por negocio). El sistema registrará cada aporte con dos clasificaciones disponibles — **capital** o **préstamo/cuenta por pagar** — y se deja abierto para que, viendo ambas vistas en la práctica, decidan cuál refleja mejor la realidad de cada caso. No es una decisión que bloquee el arranque: se puede empezar registrando el dato (negocio, socio, monto, fecha) y clasificar/ajustar después.
- **Movimientos intercompañía**: cuando un negocio le presta o transfiere plata a otro (ej. algo que sale de la cuenta Bancolombia general y en realidad es de HANGARC pero se usa para VirtualWaiter), debe quedar registrado como movimiento especial para que el balance de cada negocio sea exacto y no se mezcle.

### 3.2 Qué debe poder mostrar
- Balance por negocio (ingresos – egresos – saldo actual).
- Balance consolidado de STGL (los 3 negocios juntos).
- Estado de cuenta por socio: cuánto ha aportado cada uno, en total y por negocio, y si se le ha devuelto algo.
- Utilidad repartible por negocio, aplicando automáticamente el % de participación de cada socio (sección 1) — sin mezclar esto con los aportes.
- Gráficas: evolución mensual de ingresos/egresos por negocio, comparativo entre negocios, aportes acumulados por socio.

### 3.3 Fuente de los movimientos (cómo entran al sistema)
| Origen | Automático o manual | Detalle |
|---|---|---|
| Bold (pagos en línea) | **Automático (fase 1)** | Vía API de consulta de transacciones de Bold. Solo pagos en línea — no manejan datáfono. Ver flujo detallado en sección 3.4. |
| Ventas Mercado Libre, Rappi, distribuidores, en persona | Manual | Se registran a mano en el sistema (no hay integración automática viable por ahora). |
| Shopify | Manual por ahora, **automatizable en fase 2** | Tienen API oficial y es una integración sencilla — se deja pendiente para cuando ya esté lo esencial funcionando. |
| Cuenta Bancolombia general | Manual | No se plantea integración bancaria automática por ahora (más complejo/regulado); se carga a mano. |

### 3.4 Flujo de transacciones detectadas de Bold

Cuando el sistema detecte una transacción nueva vía Bold, **no se clasifica sola**:

1. Entra al sistema con el **nombre/descripción original que trae la transacción de Bold** (tal cual la reporta Bold), y con estado **"pendiente por revisar"**.
2. Desde la plataforma, alguno de los dos socios le pone el **nombre interno** que prefieran (ej. "Venta impermeables x3 - cliente Juan") y la **categoría** correspondiente.
3. Cada transacción (venga de Bold o se registre manual) tiene un campo de **observaciones libres**, para dejar cualquier nota o contexto adicional.
4. Solo cuando ya tiene nombre interno y categoría pasa de "pendiente" a "clasificada" — así nunca se pierde una transacción, pero tampoco se cuenta en los reportes hasta que esté debidamente identificada.

---

## 4. Módulo de Costeo e Inventario (HYDREX)

Basado en el Excel de costos que ya manejan (`Impermeables_v11.xlsx`), que se revisó hoja por hoja. **No es un simple costo-vs-precio**: es un motor de rentabilidad por canal de venta, con parámetros que se pueden ajustar sin tocar la lógica. Se modela igual dentro de la plataforma, así:

> **Nota**: lo que se documenta aquí es la **estructura y la lógica de cálculo** (qué campos existen, cómo se relacionan, qué fórmulas aplican). Los valores concretos de hoy (precio del impermeable, costo del sticker, % de comisión de cada plataforma, etc.) **se cargan y editan directamente en la plataforma una vez esté construida** — no hace falta dejarlos fijos en este documento ni en el diseño técnico.

### 4.1 Catálogo de insumos base
Cada insumo con su costo real, IVA incluido, y derivado de compras por lote (cantidad × valor total ÷ cantidad = costo unitario):
- **Impermeables**: por tipo (Reflectivo, Premium) **y por talla** (One Size, Oversize). *Ampliación pedida por Tomás*: el Excel actual solo distingue por tipo; la plataforma debe manejar tipo + talla como dos atributos independientes, de forma que cada combinación (ej. "Reflectivo One Size", "Premium Oversize") sea un ítem de inventario propio, con su propio costo.
- **Stickers**: por material (papel, waterproof, laminado) **y por talla** (One Size, Oversize) — misma lógica: cada combinación es un ítem independiente.
- **Cajas**: por tipo (regular, impresa), con su costo de "Arte"/diseño aparte (costo único, no por unidad).

### 4.2 Productos vendibles (combinaciones)
- **Producto individual** = impermeable + sticker de una combinación específica (tipo + talla).
- **Producto caja** = caja + N impermeables + N stickers (el Excel usa cajas de 6, pero el número de unidades por caja debe quedar como parámetro configurable, no fijo). *Detalle a definir al cargar los datos reales: si las cajas siempre llevan una combinación estándar de talla, o si se pueden armar cajas mixtas por talla — no bloquea el diseño, se resuelve como configuración.*
- El costo de cada producto vendible se calcula automáticamente a partir del costo de sus insumos — no se digita a mano.

### 4.3 Parámetros generales del negocio (editables, no fijos)
Todo esto vive como configuración, igual que en la hoja "PRECIOS BASE" del Excel:
- % publicidad digital sobre precio de venta (pauta).
- Comisión por canal: Mercado Libre, Rappi, pasarela de pago web (Bold) — incluyendo el costo fijo por transacción web.
- Costos logísticos: envío según ciudad, bodegaje, empaque, flete masivo B2B.
- Costo administrativo prorrateado: (salarios de socios asignados a HYDREX + otros gastos fijos + Shopify) ÷ unidades vendidas del mes — se recalcula solo si cambian estos valores.
- Impuestos: retención en fuente (aplica según canal), 4x1000 (GMF), ICA, autorretención, renta — cada uno editable porque las tarifas y umbrales cambian.

### 4.4 Componentes de costo configurables (el equivalente a los toggles del Excel)

En vez de que cada costo (publicidad, comisión por plataforma, pasarela, impuestos, etc.) quede fijo en el desarrollo, se maneja como una **lista configurable de "componentes de costo"** — así, agregar, quitar o ajustar un costo no requiere tocar código, solo editar esta lista:

| Campo del componente | Ejemplo |
|---|---|
| Nombre | "Publicidad digital", "Comisión Mercado Libre", "4x1000" |
| Tipo de cálculo | % sobre precio de venta / valor fijo / valor por unidad |
| Valor | 10%, $900, etc. |
| Canal(es) donde aplica por defecto | Web, Mercado Libre, Rappi, Directo, Todos |
| ¿Viene marcado por defecto según el canal? | Sí / No |

**Al registrar una venta de HYDREX**, según el canal elegido, el sistema premarca automáticamente los componentes que suelen aplicar (igual que el Excel: canal Web activa la comisión de pasarela y desactiva la retención en fuente). Cada componente se muestra como un **check editable**, para prender/apagar cualquiera caso por caso, sin perder la referencia de qué se aplicó en cada venta.

Cuando cambie una tarifa (ej. Rappi sube su comisión) o aparezca un canal/costo nuevo, solo se edita o agrega una fila en esta lista — el motor de cálculo (sección 4.5) la usa automáticamente.

### 4.5 Motor de cálculo de costo y margen por venta
Al registrar una venta de HYDREX, el sistema —igual que en el Excel— calcula automáticamente, según el **canal de venta** (Mercado Libre / Rappi / Web / Directo), la **cantidad**, y los **componentes de costo marcados** (sección 4.4):
1. Costo del producto (según la combinación específica vendida: tipo, talla, individual o caja).
2. Costo de envío (si aplica).
3. Costo de publicidad (% sobre el precio de venta).
4. Comisión de la plataforma (automática según el canal elegido).
5. Costo fijo de pasarela (solo aplica en canal Web).
6. Costo administrativo prorrateado.
7. Impuestos correspondientes (retención en fuente, 4x1000, etc., algunos se activan/desactivan según el canal).

Resultado: **costo total, ganancia y margen %** de esa venta específica — y una calificación automática (Excelente / Ajustado / Crítico / Pérdida) según rangos de margen, igual que en el Excel.

### 4.6 Precios diferenciados por volumen y canal
- Venta individual, caja (con posible descuento si se compran 2+ cajas), y **precio distribuidor por tramos** (ej. 0-200, 200-500, 500+ unidades, cada tramo con su propio precio unitario). El sistema debe soportar listas de precios por canal y por volumen, no un precio único fijo.

### 4.7 Vínculo venta ↔ inventario
Al registrar un ingreso de HYDREX en contabilidad, se selecciona qué producto(s) se vendió (incluyendo tipo, talla, individual o caja) para que el sistema:
- Descuente automáticamente del inventario los insumos correspondientes (impermeable, sticker, y caja si aplica).
- Calcule la ganancia real de esa venta usando el motor de cálculo (4.5), sin necesidad de recalcular nada a mano.

### 4.8 Gastos fijos y punto de equilibrio
- Tabla de gastos fijos mensuales de HYDREX (Shopify, correo corporativo, dominio, otros) — usa la misma lógica del módulo general de gastos fijos (sección 4B), pero comparada contra la ganancia real de HYDREX.
- El sistema compara estos gastos fijos contra la ganancia real por unidad (tomada en vivo del motor de cálculo, no un número congelado) para calcular cuántas unidades o cajas hay que vender al mes para cubrir los gastos fijos — igual que la hoja "GASTOS FIJOS" del Excel, pero actualizado automáticamente en vez de mantenerlo a mano.

### 4.9 Proveedores y compras
- **Proveedores**: ficha por proveedor (nombre, contacto, datos de pago/cuenta, condiciones acordadas).
- **Compras de inventario**: cada compra con fecha, proveedor, insumo(s) y cantidad, valor total, y el **documento de compra adjunto** (factura/soporte, enlazado a OneDrive — ver sección 6). Esto alimenta tanto las entradas de inventario como el costo unitario real de cada insumo (igual que en el Excel: costo unitario = valor total del lote ÷ cantidad comprada).

### 4.10 Movimientos de inventario
- **Entradas**: generadas automáticamente desde cada compra registrada (4.9).
- **Salidas**: generadas automáticamente desde cada venta vinculada (4.7), etiquetadas por canal (Shopify, Mercado Libre, Rappi, distribuidor, persona).
- Esto permite ver en cualquier momento, sin esperar a fin de mes: cuánto se ha invertido en inventario, cuánto stock queda por cada combinación (tipo + talla), y de dónde viene cada movimiento.

---

## 4B. Módulo de Gastos Fijos (todos los negocios)

A diferencia de los costos variables de HYDREX (sección 4.4-4.5, que dependen del canal, cantidad y otros valores que cambian por venta), **cada negocio tiene también gastos fijos simples**, que no dependen de nada más — se registran y ya:

- Tabla libre: **concepto, monto, periodicidad (mensual/anual/único), negocio**.
- Aplica igual para HANGARC, VirtualWaiter, STGL, y también HYDREX (sus gastos fijos como Shopify, correo, dominio, viven aquí).
- Se puede agregar cualquier concepto nuevo sin restricción — hosting, licencias, contabilidad, lo que vaya surgiendo — sin necesidad de definir una lista cerrada de antemano.
- Para HANGARC y VirtualWaiter, que aún no tienen ventas activas, **este módulo es su principal fuente de "costos"** por ahora — no necesitan el motor de componentes configurables de HYDREX, que solo aplica donde hay ventas con múltiples canales y comisiones variables.

---

## 4A. Módulo de Clientes (por negocio)

Cada negocio (HYDREX, HANGARC, VirtualWaiter) tiene **su propia base de clientes**, separada entre sí — no es una lista mezclada de STGL, porque el tipo de cliente y su relación con cada negocio es distinta (comprador final de HYDREX vs. restaurante cliente de VirtualWaiter vs. usuario/cliente de HANGARC).

- Ficha de cliente: datos de contacto, negocio al que pertenece, y su historial de compras/interacciones dentro de ese negocio.
- Respeta la misma regla de estructura limpia (sección 11): la base de clientes de HYDREX no se mezcla en código ni en datos con la de HANGARC o VirtualWaiter, aunque las tres vivan en la misma plataforma.

---

## 5. Módulo de Tareas / Casos con Historial

Un "to-do" evolucionado a sistema de seguimiento tipo expediente:

- Cada **tarea o caso** tiene: título, negocio al que pertenece, tipo (tarea puntual vs. caso/asunto en curso), responsable, estado (pendiente / en curso / esperando / resuelto), fecha de creación y fecha límite.
- Cada tarea tiene un **historial completo**: todo cambio de estado, de responsable, comentario agregado o documento adjunto queda registrado automáticamente con fecha, hora y quién lo hizo — nadie tiene que acordarse de "dejarlo anotado", el sistema lo hace solo.
- Permite entrar a cualquier tarea y ver su vida completa: útil para negociaciones, pendientes legales, desarrollo de HANGARC y VirtualWaiter.

---

## 6. Módulo de Documentos

- Los archivos **siguen viviendo en OneDrive** — no se duplican ni se suben a otro lado.
- La plataforma guarda la **ficha de cada documento** (nombre, categoría, negocio al que pertenece — incluyendo STGL como categoría propia, tipo de documento, fecha) junto con el enlace/ID real del archivo en OneDrive.
- **La plataforma no es solo un índice de lectura**: desde ahí también se debe poder **subir documentos nuevos y crear carpetas**, y que esto se refleje directamente en la estructura real de OneDrive (vía Microsoft Graph API) — es decir, la plataforma es la puerta de entrada tanto para consultar como para organizar el archivero, sin tener que entrar aparte a OneDrive para eso.
- Conexión técnica vía Microsoft Graph API (gratuita para este uso), autenticada con la cuenta de OneDrive/correo de STGL (ver sección 10).

---

## 7. Dashboards y Métricas

Todo lo anterior se cruza usando siempre los mismos 3 ejes: **negocio, fecha, socio**. Esto permite cortar la información como se necesite: "todo HYDREX en agosto", "aportes totales de Samuel", "documentos legales de STGL", "tareas abiertas de VirtualWaiter".

Métricas mínimas a tener desde el día 1:
- Ingresos y egresos por negocio (mensual/acumulado).
- Balance y utilidad por negocio y consolidado STGL.
- Estado de cuenta de cada socio (aportes, devoluciones, saldo).
- Margen por producto e inventario disponible (HYDREX).
- Tareas/casos abiertos vs. resueltos por negocio.

---

## 8. Fases de implementación

**Fase 1 (arranque, sin costo):**
1. Modelo de datos base (negocios, cuentas, transacciones, aportes, participación societaria).
2. Carga manual del historial existente (empezando por HYDREX, que tiene más movimiento).
3. Conexión a Bold (consulta/webhook de transacciones en línea).
4. Módulo de costeo e inventario de HYDREX.
5. Módulo de documentos conectado a OneDrive.
6. Módulo de tareas/casos con historial.
7. Dashboards básicos.

**Fase 2 (cuando esté lo esencial funcionando):**
- Integración automática con Shopify (órdenes e inventario).
- Explorar integración con Mercado Libre si vale la pena el esfuerzo de aprobación de su API.
- Reportes más avanzados / exportables.
- Roles y permisos más granulares si el equipo crece (ver sección 13).

**Fase 3 (más adelante, cuando empiecen a manejar pauta en Meta Ads):**
- Integración con **Meta Ads** (Facebook/Instagram): traer a la plataforma métricas y gastos reales de pauta de cada negocio, para que el gasto en publicidad no dependa de estimados/porcentajes sino del dato exacto que reporta Meta. Meta tiene una API pública (Marketing API) que permite esto, pero requiere que primero haya cuentas publicitarias activas — no aplica todavía porque aún no están pautando ahí.

---

## 9. Decisiones ya resueltas / estado actual

- **Aportes de socios**: se registran por negocio y por socio, con clasificación doble (capital / préstamo) para decidir en la práctica — no bloquea el arranque (ver 3.1).
- **Gastos de STGL general**: por ahora no hay una lista cerrada de qué categorías aplican; el sistema debe dejar la categoría **"STGL / general"** disponible y abierta desde el día 1, para usarla según vaya surgiendo (ej. abogado, marca, licencias compartidas), sin necesidad de definirlas todas de antemano.
- **Reglas de reparto de utilidades**: no aplica todavía (no se está haciendo reparto activo). El sistema sí debe **calcular y mostrar** la utilidad teórica por socio según el % de participación (sección 1), pero no requiere lógica de pago/reparto real por ahora. Se activa cuando lo necesiten.
- **Documentos**: sí se debe poder subir archivos y crear carpetas desde la plataforma, no solo consultarlos (ver sección 6).

## 10. Correo y cuenta de OneDrive de STGL

Actualmente existen dominios/correos para HYDREX y HANGARC, pero no uno que agrupe a STGL como sociedad. Decisión: **se usará Hotmail/Outlook, no Gmail.**

- Crear un correo **@hotmail.com** (o @outlook.com) para STGL — gratis, sin necesidad de comprar dominio propio.
- Esto es incluso más directo que la opción de Gmail: un correo de Hotmail/Outlook **ya es en sí mismo una cuenta de Microsoft**, así que no hace falta el paso extra de "crear cuenta de Microsoft con correo externo" — al crear el correo, ya viene todo junto.
- Esa cuenta trae automáticamente **OneDrive gratis con 5 GB**, que es la cuenta que la plataforma conecta vía Microsoft Graph API (sección 6). Con este único correo cubren identidad de la sociedad y acceso a OneDrive — **sin ningún gasto de dominio ni suscripción**.
- Único punto a vigilar a futuro: los 5 GB gratis alcanzan bien para documentos (PDFs, Word, legales, logos), pero si más adelante suben muchos archivos pesados (videos, backups grandes) tocaría evaluar un plan pago — no es algo que bloquee el arranque.

---

## 11. Estructura del sistema (para que quede limpio y modular)

Un punto explícito de Tomás: la plataforma debe estar **bien estructurada y con código limpio**, evitando que módulos específicos de un negocio "contaminen" el resto. Reglas de diseño a seguir desde el inicio:

- **Cada módulo pertenece a su alcance real**: el módulo de inventario y costeo es exclusivo de HYDREX y no debe aparecer ni interferir en HANGARC o VirtualWaiter. Si en el futuro otro negocio necesita inventario, se activa como módulo aparte para ese negocio, no se generaliza a la fuerza.
- **Separación por capas**: los negocios comparten la misma base (contabilidad, documentos, tareas) pero cada uno tiene sus módulos propios activables independientemente — esto se refleja luego en la organización del código (carpetas/módulos separados por dominio: `contabilidad/`, `inventario-hydrex/`, `documentos/`, `tareas/`, etc.), no en un solo bloque mezclado.
- Esto se define en el diseño técnico (siguiente paso), pero queda anotado aquí como requisito no negociable del proyecto.

## 12. Enfoque de base de datos

- Supabase usa **Postgres (base de datos relacional)**, no una base "sin esquema". Esto es intencional y conviene para lo que STGL pide: trazabilidad y todo conectado se logra mejor con relaciones claras entre tablas que con documentos sueltos.
- Esto **no significa** que el diseño deba quedar cerrado desde el día uno: el esquema se construye y amplía con **migraciones** (cambios incrementales versionados) a medida que surgen necesidades nuevas — como pasó hoy con proveedores, compras y clientes. No hay que anticipar todo de antemano.
- Para datos que son naturalmente más libres o cambiantes (ej. observaciones, metadatos puntuales) se usan campos flexibles tipo `jsonb` dentro de las tablas relacionales, sin sacrificar la estructura general.
- En la práctica: se sigue documentando cada necesidad nueva aquí, y luego se traduce a migraciones concretas cuando se pase a construcción.
- **Un solo proyecto de Supabase (una sola base de datos)** para los 3 negocios y STGL — necesario para poder consolidar información entre negocios sin complicaciones. La separación entre negocios/módulos se hace con buena organización interna (schemas o tablas bien delimitadas + permisos), no con proyectos separados. Si en el futuro un negocio se independiza de STGL, se puede migrar entonces — no antes.

## 13. Escalabilidad y roles (pensado para crecer)

Requisito explícito: la plataforma debe ser **100% escalable**, no solo en volumen de datos sino en estructura de usuarios a futuro.

- **Roles de usuario**: desde el diseño se contempla un sistema de roles — por ejemplo `superadmin` (Tomás y Samuel, acceso total) y `usuario normal` (futuros empleados o colaboradores, con acceso limitado a lo que les corresponda). No se implementa a fondo ahora mismo porque son solo los dos socios, pero la base de datos y la autenticación se diseñan desde ya para soportarlo sin rehacer nada después.
- **Supabase encaja bien para esto**: su sistema de autenticación (Auth) y seguridad a nivel de fila (Row Level Security) están hechos exactamente para manejar "quién puede ver/hacer qué" de forma granular — se puede empezar simple (solo ustedes dos) y activar más roles y permisos cuando haya más personas, sin cambiar de tecnología ni de arquitectura.
- Esto también aplica a **permisos por negocio**: en el futuro, alguien podría tener acceso solo a HYDREX y no a HANGARC, por ejemplo — la estructura modular (sección 11) ya deja esto natural de implementar.

---

## 14. Próximos pasos

Con los requerimientos ya completos, sigue la fase de **diseño técnico** (sin escribir SQL todavía):

1. **Diagrama conceptual de datos**: cómo se conectan negocios, cuentas, transacciones, aportes, inventario, clientes, documentos y tareas — para validar visualmente que el modelo tiene sentido antes de construirlo.
2. **Definición de pantallas principales**: qué ve cada socio al entrar (dashboard general), y las vistas clave de cada módulo (registrar venta HYDREX, ver balance por negocio, estado de cuenta de socio, archivero, tablero de tareas).
3. **Migraciones iniciales**: ya con el modelo validado, se traduce a la base de datos real en Supabase, en pasos incrementales.
4. **Construcción del frontend** conectado a esa base, empezando por lo esencial (contabilidad + HYDREX + documentos + tareas) y dejando Shopify, Mercado Libre y Meta Ads para fases posteriores, como quedó definido en la sección 8.

---

## 15. Pantallas principales

Ya con el diagrama conceptual validado (sección 14, punto 1), esto define qué ve cada socio al usar la plataforma, módulo por módulo:

### 15.1 Dashboard general (al iniciar sesión)
Vista consolidada de STGL: balance de cada uno de los 3 negocios, gráficas de ingresos/egresos del mes, alertas de lo que necesita atención (transacciones de Bold pendientes por clasificar, tareas vencidas), y acceso rápido a cada negocio.

### 15.2 Vista por negocio
Al entrar a HYDREX / HANGARC / VirtualWaiter / STGL general: balance de ese negocio, sus gastos fijos, sus tareas abiertas, y sus documentos — todo filtrado automáticamente a ese negocio.

### 15.3 Contabilidad
- Lista de transacciones, con filtro por estado ("pendiente por revisar" / "clasificada"), negocio, fecha y categoría.
- Formulario para registrar un ingreso o egreso manual.
- Vista de "Bold pendientes": las transacciones que llegaron automáticas y aún no tienen nombre interno ni categoría.
- Estado de cuenta por socio: aportes por negocio, total, y clasificación (capital/préstamo).
- Vista de movimientos intercompañía.

### 15.4 HYDREX — Costeo e inventario
- Catálogo de insumos (impermeables, stickers, cajas) y productos vendibles (individual, caja).
- Componentes de costo configurables (la lista de "toggles": publicidad, comisiones, impuestos).
- Calculadora de venta: al elegir canal + cantidad + producto, muestra costo total, ganancia y margen en vivo (igual que el Excel).
- Inventario actual: stock disponible por combinación (tipo + talla).
- Proveedores y compras registradas.
- Gastos fijos de HYDREX y punto de equilibrio.
- Base de clientes de HYDREX.

### 15.5 Documentos
Explorador tipo carpetas (conectado a OneDrive), con filtro por negocio y categoría, botón para subir archivo o crear carpeta nueva, y buscador.

### 15.6 Tareas
Tablero por negocio (lista o kanban) con estado de cada tarea/caso; al entrar a una tarea se ve su historial completo.

### 15.7 Configuración
- Parámetros generales de HYDREX (componentes de costo, valores de comisiones, impuestos).
- Porcentajes de participación de los socios por negocio.
- Gestión de usuarios y roles (superadmin / usuario normal) — pensado para cuando haya más gente, aunque hoy solo la usen Tomás y Samuel.

---

## 16. Flujo de trabajo por fases

Para ejecutar el desarrollo sin perder el control del avance general, se trabaja así:

1. **Este chat principal** (el de planeación) entrega, para cada fase, un **prompt de arranque**.
2. Se abre un **chat nuevo dentro de este mismo proyecto de Claude** y se pega ese prompt. Ese chat se encarga de: profundizar en el detalle técnico de la fase, generar el **prompt específico para Cursor** (las instrucciones que Cursor va a ejecutar para escribir el código real), y supervisar/revisar el resultado.
3. Al terminar la fase, ese chat entrega un **resumen corto** de lo construido.
4. Ese resumen se trae de vuelta a **este chat principal**, para mantener aquí la visión completa del proyecto y decidir la siguiente fase.

> **Importante**: para que los chats de cada fase tengan el contexto completo, hay que subir este documento (`STGL_Requerimientos_Plataforma.md`) como **archivo del proyecto de Claude** — así cualquier chat nuevo dentro del proyecto puede consultarlo sin que se le tenga que repetir todo.

## 17. Fases de desarrollo técnico

| Fase | Contenido | Módulos del documento |
|---|---|---|
| **1** | Configuración de infraestructura: cuentas y proyectos en Supabase, GitHub y Vercel | Sección 10, 12 |
| **2** | Estructura del repositorio + migraciones iniciales (negocios, socios, cuentas, transacciones, aportes, intercompañía) | Secciones 1, 2, 3, 11, 12 |
| **3** | Módulo de Contabilidad (pantallas, conexión a Bold, formularios) | Secciones 3, 15.3 |
| **4** | HYDREX — Costeo e Inventario (insumos, componentes de costo, motor de cálculo, proveedores, compras) | Sección 4 completa, 15.4 |
| **5** | Documentos (conexión OneDrive vía Microsoft Graph) | Sección 6, 15.5 |
| **6** | Tareas y clientes (HANGARC, VirtualWaiter) | Secciones 4A, 5, 15.6 |
| **7** | Dashboard general y roles/configuración | Secciones 7, 13, 15.1, 15.7 |
| **8** (futuro) | Integraciones avanzadas: Shopify, Mercado Libre, Meta Ads | Sección 8 (fases 2 y 3) |

La **Fase 1** es la única que no necesita un chat de Claude ni un prompt para Cursor — son cuentas y clics que Tomás y Samuel hacen directamente. De la Fase 2 en adelante sí se sigue el flujo de la sección 16.

Se ejecutan en orden, una a la vez, siguiendo el flujo de la sección 16.

---

*Este documento es la base para iniciar el diseño técnico (modelo de datos y desarrollo). Una vez validado por Tomás y Samuel, se procede a la construcción.*
