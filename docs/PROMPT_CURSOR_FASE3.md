# PROMPT PARA CURSOR — FASE 3: Módulo de Contabilidad (STGL)

Pega este prompt completo en Cursor, dentro del repo ya existente (`stgl-plataforma`,
con la estructura y migraciones de la Fase 2 ya aplicadas).

---

## 0. Antes de escribir nada: verifica el esquema real

Los nombres de columna usados en este prompt son la convención esperada según el
documento de requerimientos, pero pueden diferir en detalle de lo que quedó en las
migraciones de la Fase 2. Antes de tocar código:

1. Revisa `supabase/migrations/00*.sql` ya aplicados (o corre `supabase db pull` /
   consulta `information_schema.columns` para `negocios`, `socios`,
   `socios_participacion`, `cuentas_bancarias`, `transacciones`, `aportes_socios`,
   `movimientos_intercompania`).
2. Si algún nombre de columna difiere de los usados abajo, ajusta las migraciones
   nuevas y el código de este prompt para que coincidan — no renombres las columnas
   existentes.

---

## 1. Migraciones nuevas

### `supabase/migrations/007_bold_webhook_events.sql`

```sql
-- Buffer/auditoría de eventos crudos recibidos desde el webhook de Bold,
-- antes de convertirlos en filas de `transacciones`. Evita duplicados
-- (bold_transaction_id es UNIQUE) y deja rastro de qué llegó exactamente.

CREATE TABLE IF NOT EXISTS bold_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- bold_transaction_id corresponde al campo `subject` (= data.payment_id)
    -- del payload de Bold — es el identificador real de la transacción.
    -- El campo `id` del payload identifica cada notificación puntual y NO
    -- sirve para idempotencia: Bold puede reenviar varias notificaciones
    -- para la misma transacción (política de reintentos documentada).
    bold_transaction_id TEXT NOT NULL,
    -- SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    monto NUMERIC(14,2),
    descripcion_original TEXT,
    fecha_bold TIMESTAMPTZ,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    procesado BOOLEAN NOT NULL DEFAULT false,
    procesado_at TIMESTAMPTZ,
    transaccion_id UUID REFERENCES transacciones(id) ON DELETE SET NULL,
    error_mensaje TEXT,
    recibido_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Una misma transacción puede pasar por varios eventos en su vida
    -- (aprobada y luego anulada, por ejemplo) — la unicidad es por la
    -- combinación de transacción + tipo de evento, no por transacción sola.
    UNIQUE (bold_transaction_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_bold_events_procesado
    ON bold_webhook_events(procesado);

ALTER TABLE bold_webhook_events ENABLE ROW LEVEL SECURITY;

-- Los socios autenticados pueden leer el log (auditoría de lo que llegó).
CREATE POLICY "bold_events_select_authenticated" ON bold_webhook_events
    FOR SELECT
    TO authenticated
    USING (true);

-- Sin policy de INSERT para 'authenticated': el único que inserta aquí es
-- el endpoint del webhook, usando el service role key (que bypassa RLS).
-- El frontend nunca escribe directamente en esta tabla.
```

### `supabase/migrations/008_ajustes_contabilidad.sql`

```sql
-- Índices para los filtros de la lista de transacciones (sección 15.3).
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_negocio ON transacciones(negocio_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);

CREATE INDEX IF NOT EXISTS idx_aportes_socio ON aportes_socios(socio_id);
CREATE INDEX IF NOT EXISTS idx_aportes_negocio ON aportes_socios(negocio_id);

-- Si `movimientos_intercompania` NO tiene todavía una columna de estado
-- (pendiente / saldado) para saber si el préstamo entre negocios ya se
-- devolvió, agrégala. Si ya existe algo equivalente, omite este bloque.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movimientos_intercompania'
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE movimientos_intercompania
            ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'
            CHECK (estado IN ('pendiente', 'saldado'));
    END IF;
END $$;
```

Aplica ambas con el Supabase CLI ya vinculado al proyecto real (no le des las
credenciales del service role al agente — corre `supabase db push` tú mismo si el
flujo de este repo lo pide, igual que en la Fase 2).

---

## 2. Estructura de archivos a crear

```
src/modules/contabilidad/
├── types.ts
├── actions/
│   ├── transacciones.ts        # createTransaccionManual, clasificarTransaccionBold
│   ├── aportes.ts               # getEstadoCuentaSocio, createAporteSocio
│   └── intercompania.ts         # getMovimientosIntercompania, createMovimientoIntercompania
├── hooks/
│   ├── useTransacciones.ts      # lista + filtros
│   ├── useBoldPendientes.ts
│   ├── useEstadoCuentaSocio.ts
│   └── useIntercompania.ts
└── components/
    ├── TransaccionesTable.tsx
    ├── TransaccionFiltros.tsx
    ├── TransaccionFormManual.tsx
    ├── BoldPendientesList.tsx
    ├── BoldClasificarModal.tsx
    ├── EstadoCuentaSocio.tsx
    └── IntercompaniaTable.tsx

src/app/(contabilidad)/
├── contabilidad/
│   ├── page.tsx                          # resumen del módulo + accesos rápidos
│   ├── transacciones/
│   │   ├── page.tsx                      # lista + filtros
│   │   └── nueva/page.tsx                # formulario manual
│   ├── bold-pendientes/page.tsx
│   ├── socios/page.tsx                   # estado de cuenta por socio
│   └── intercompania/page.tsx

src/app/api/webhooks/bold/
└── route.ts
```

---

## 3. Tipos (`types.ts`)

```typescript
export type EstadoTransaccion = 'pendiente_revision' | 'clasificada';
export type TipoTransaccion = 'ingreso' | 'egreso';
export type OrigenTransaccion = 'bold' | 'manual' | 'shopify' | 'mercado_libre' | 'rappi' | 'distribuidor' | 'persona';
export type ClasificacionAporte = 'capital' | 'prestamo';
export type EstadoIntercompania = 'pendiente' | 'saldado';

export interface Transaccion {
  id: string;
  negocio_id: string;
  cuenta_bancaria_id: string;
  tipo: TipoTransaccion;
  categoria: string | null;
  monto: number;
  fecha: string; // ISO date
  estado: EstadoTransaccion;
  origen: OrigenTransaccion;
  nombre_original: string | null;
  nombre_interno: string | null;
  observaciones: string | null;
  bold_transaction_id: string | null;
  created_at: string;
}

export interface TransaccionFiltros {
  estado?: EstadoTransaccion;
  negocio_id?: string;
  categoria?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface AporteSocio {
  id: string;
  negocio_id: string;
  socio_id: string;
  monto: number;
  fecha: string;
  clasificacion: ClasificacionAporte;
  observaciones: string | null;
}

export interface MovimientoIntercompania {
  id: string;
  negocio_origen_id: string;
  negocio_destino_id: string;
  monto: number;
  fecha: string;
  concepto: string;
  observaciones: string | null;
  estado: EstadoIntercompania;
}
```

---

## 4. Server actions clave

**`clasificarTransaccionBold(id, nombre_interno, categoria)`**
Update sobre `transacciones`: setea `nombre_interno`, `categoria`, y cambia
`estado` de `pendiente_revision` a `clasificada`. Esta es la única forma en que
una transacción de Bold pasa a contar en reportes — no hay clasificación
automática por reglas, siempre la hace un socio a mano (sección 3.4 del
documento).

**`createTransaccionManual(data)`**
Insert directo en `transacciones` con `origen = 'manual'`, `estado =
'clasificada'` (una transacción manual ya nace con nombre y categoría, no pasa
por el limbo de "pendiente").

**`getEstadoCuentaSocio(socio_id)`**
Query a `aportes_socios` agrupado por `negocio_id`, sumando `monto` y separando
por `clasificacion`. Devuelve también el total general del socio. No mezcla
esto con `socios_participacion` (eso es para utilidad repartible, que es de la
Fase 7 / dashboard, no de este módulo).

**`createMovimientoIntercompania(data)`**
Insert en `movimientos_intercompania`. No crea automáticamente una transacción
espejo en `transacciones` — es un movimiento de su propia naturaleza (sección
3.1: "debe quedar registrado como movimiento especial para que el balance de
cada negocio sea exacto y no se mezcle").

---

## 5. Pantallas

### 5.1 Lista de transacciones (`/contabilidad/transacciones`)
- `TransaccionFiltros`: selects de estado, negocio, categoría + rango de fecha.
- `TransaccionesTable`: fecha, negocio, tipo, categoría, nombre interno (o
  nombre original si sigue pendiente), monto, estado (badge), origen.
- Fila pendiente → link directo a clasificar (reusa el modal de 5.3).

### 5.2 Formulario manual (`/contabilidad/transacciones/nueva`)
- Campos: negocio, cuenta bancaria, tipo (ingreso/egreso), categoría (input
  con sugerencias de categorías usadas antes, no una lista cerrada — ver
  sección 9 del documento), monto, fecha, nombre interno, observaciones.
- Al guardar: `estado = 'clasificada'`, `origen = 'manual'`.

### 5.3 Bold pendientes (`/contabilidad/bold-pendientes`)
- `BoldPendientesList`: muestra `nombre_original` tal cual lo mandó Bold,
  monto, fecha — ordenado por fecha descendente, las más viejas primero
  destacadas (llevan más tiempo sin clasificar).
- `BoldClasificarModal`: inputs de nombre interno + categoría + observaciones
  opcionales. Al confirmar, llama `clasificarTransaccionBold`.

### 5.4 Estado de cuenta por socio (`/contabilidad/socios`)
- Selector de socio (Tomás / Samuel).
- Tabla: negocio, total aportado, capital vs. préstamo (dos columnas o un
  desglose), y total general del socio al final.
- Botón para registrar un aporte nuevo (negocio, monto, fecha, clasificación,
  observaciones).

### 5.5 Intercompañía (`/contabilidad/intercompania`)
- `IntercompaniaTable`: negocio origen → negocio destino, monto, fecha,
  concepto, estado (pendiente/saldado).
- Formulario para registrar un movimiento nuevo.
- Acción rápida para marcar un movimiento existente como "saldado".

---

## 6. Endpoint webhook de Bold (`src/app/api/webhooks/bold/route.ts`)

Implementación real, según [developers.bold.co/webhook](https://developers.bold.co/webhook)
(consultado para esta fase — última actualización de la doc: 28 ago 2026).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Usa el service role key (variable de entorno, nunca expuesta al frontend)
// porque este endpoint necesita bypassar RLS para insertar transacciones
// del sistema, no de un usuario autenticado.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verificación de firma real de Bold:
// 1. Body crudo -> Base64
// 2. HMAC-SHA256 del Base64 usando la "Llave Botón de pagos" (la que aplica
//    para pagos en línea vía Botón de pagos / Link de pago — el caso de
//    HYDREX, que no usa datáfono) -> hex
// 3. Comparar (timing-safe) contra el header x-bold-signature
// En modo pruebas la llave secreta es un string vacío.
function verifyBoldSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.BOLD_WEBHOOK_SECRET ?? '';
  if (!signatureHeader) return false;
  const encoded = Buffer.from(rawBody, 'utf-8').toString('base64');
  const hashed = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(signatureHeader));
  } catch {
    return false; // longitudes distintas -> firma inválida
  }
}

export async function POST(req: NextRequest) {
  // IMPORTANTE: leer el body crudo (sin bodyParser/JSON automático) porque
  // la firma se calcula sobre el texto exacto recibido, no sobre el objeto
  // ya parseado y re-serializado.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-bold-signature');
  const signatureVerified = verifyBoldSignature(rawBody, signatureHeader);

  const payload = JSON.parse(rawBody);

  // `subject` (= payload.data.payment_id) es el identificador real de la
  // transacción. `payload.id` identifica la notificación puntual y puede
  // repetirse en reintentos — no sirve para idempotencia.
  const boldTransactionId: string = payload.subject;
  const eventType: string = payload.type; // SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED
  const monto: number = payload.data?.amount?.total;
  const fechaBold: string = payload.data?.created_at; // ISO 8601, tz América/Bogotá
  const metodoPago: string = payload.data?.payment_method; // CARD_WEB, NEQUI, PSE, BOTON_BANCOLOMBIA...
  const referenciaExterna: string | null = payload.data?.metadata?.reference ?? null;
  const payerEmail: string | null = payload.data?.payer_email ?? null;

  // Bold no manda un campo de "nombre/descripción" libre — el "nombre
  // original" que pide la sección 3.4 del documento se arma con lo que sí
  // manda: método de pago + referencia externa (si el checkout la definió)
  // + correo del pagador.
  const nombreOriginal = referenciaExterna
    ? `${metodoPago} - ${referenciaExterna}`
    : `${metodoPago}${payerEmail ? ' - ' + payerEmail : ''}`;

  // Idempotencia (Bold recomienda explícitamente esto: pueden llegar
  // notificaciones repetidas para la misma transacción).
  const { data: existing } = await supabase
    .from('bold_webhook_events')
    .select('id')
    .eq('bold_transaction_id', boldTransactionId)
    .eq('event_type', eventType)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ status: 'ya procesado' }, { status: 200 });
  }

  const { data: eventRow, error: eventError } = await supabase
    .from('bold_webhook_events')
    .insert({
      bold_transaction_id: boldTransactionId,
      event_type: eventType,
      payload,
      monto,
      descripcion_original: nombreOriginal,
      fecha_bold: fechaBold,
      signature_verified: signatureVerified,
    })
    .select()
    .single();

  if (eventError) {
    console.error('Error guardando evento de Bold:', eventError);
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }

  // Solo se crea una transacción cuando la firma es válida Y el evento es
  // una venta aprobada. SALE_REJECTED no genera nada. VOID_APPROVED
  // (anulación de una venta ya notificada) queda guardado en el log para
  // que un socio la revise manualmente y ajuste la transacción original —
  // automatizar la reversión se puede evaluar en una fase futura, no ahora.
  if (signatureVerified && eventType === 'SALE_APPROVED') {
    // negocio_id y cuenta_bancaria_id de HYDREX/Bold: Bold solo recibe
    // ventas del canal Web de HYDREX (sección 2 y 3.3 del documento) —
    // resolver estos IDs desde la tabla `cuentas_bancarias`, no fijarlos.
    const { data: cuentaBold } = await supabase
      .from('cuentas_bancarias')
      .select('id, negocio_id')
      .eq('nombre', 'Bold')
      .single();

    const { data: transaccion, error: transaccionError } = await supabase
      .from('transacciones')
      .insert({
        negocio_id: cuentaBold?.negocio_id,
        cuenta_bancaria_id: cuentaBold?.id,
        tipo: 'ingreso',
        monto,
        fecha: fechaBold,
        estado: 'pendiente_revision',
        origen: 'bold',
        nombre_original: nombreOriginal,
        bold_transaction_id: boldTransactionId,
      })
      .select()
      .single();

    if (!transaccionError && transaccion) {
      await supabase
        .from('bold_webhook_events')
        .update({
          procesado: true,
          procesado_at: new Date().toISOString(),
          transaccion_id: transaccion.id,
        })
        .eq('id', eventRow.id);
    } else {
      await supabase
        .from('bold_webhook_events')
        .update({ error_mensaje: transaccionError?.message })
        .eq('id', eventRow.id);
    }
  }

  // Bold espera 200 en máx. 2 segundos; si no, reintenta hasta 5 veces
  // (15 min, 1h, 4h, 8h, 24h). Responder siempre rápido, sin lógica pesada
  // antes del return.
  return NextResponse.json({ status: 'recibido' }, { status: 200 });
}
```

**Nota sobre pruebas**: Bold ofrece un webhook de pruebas configurable desde
Panel de Comercios → Integraciones → Webhooks → Webhooks de prueba, y para
integraciones en línea (Botón de pagos / Link de pago) hay una opción
"Probar el webhook" al finalizar una compra de prueba — sirve para validar
este endpoint antes de ir a producción, sin necesitar transacciones reales.

---

## 7. Variables de entorno pendientes (documentar en `.env.example`, no rellenar)

```
# "Llave secreta" del Panel de Comercios de Bold > Integraciones >
# Llaves de integración para botón de pagos. Firma los webhooks de pagos en
# línea (Botón de pagos / Link de pago) — el caso de HYDREX, que no usa
# datáfono. La "Llave de identidad" de esa misma pantalla es OTRA cosa (va
# en el código del botón de pago, no aquí) — no confundirlas.
#
# Se configura en Vercel como la MISMA variable con dos valores según el
# entorno (Project Settings > Environment Variables):
#   - BOLD_WEBHOOK_SECRET = llave secreta de PRUEBAS -> marcada solo para
#     "Preview" y "Development"
#   - BOLD_WEBHOOK_SECRET = llave secreta de PRODUCCIÓN -> marcada solo
#     para "Production"
# El código no cambia entre entornos: solo lee process.env.BOLD_WEBHOOK_SECRET,
# y Vercel resuelve cuál valor corresponde según dónde corre el deployment.
BOLD_WEBHOOK_SECRET=

# Opcional, no se usa en esta fase — solo si más adelante se implementa el
# servicio de fallback/consulta de transacciones de Bold
# (GET /payments/webhook/notifications/{payment_id}), que se autentica con
# la "Llave de identidad" como header "x-api-key".
BOLD_LLAVE_IDENTIDAD=
```

Lo que falta para conectar de verdad (dejar anotado en el README del módulo,
no resolverlo en esta fase):
- En Vercel: crear `BOLD_WEBHOOK_SECRET` dos veces — una con la llave secreta
  de **pruebas** (scope Preview + Development) y otra con la de
  **producción** (scope Production) — siguiendo el punto anterior.
- Registrar la URL pública del endpoint
  (`https://<dominio-vercel>/api/webhooks/bold`) en Panel de Comercios →
  Integraciones → Webhooks → Configurar webhook (hasta 5 endpoints permitidos).
- Probar primero con el **webhook de pruebas** (mismo panel) o con la opción
  "Probar el webhook" al finalizar una compra de prueba en línea, usando las
  llaves de pruebas, antes de registrar el endpoint de producción con las
  llaves reales.
- Correr `supabase db push` con las migraciones 007 y 008 en el proyecto real.

Referencia completa consultada para esta fase: [developers.bold.co/webhook](https://developers.bold.co/webhook).

---

## 8. Checklist de aceptación

- [ ] Migraciones 007 y 008 aplicadas sin error.
- [ ] Lista de transacciones filtra correctamente por estado, negocio, fecha y categoría.
- [ ] Formulario manual crea una transacción ya `clasificada`.
- [ ] Una transacción Bold pendiente puede clasificarse y pasa a `clasificada`.
- [ ] Estado de cuenta por socio muestra aportes correctos por negocio y su clasificación.
- [ ] Movimiento intercompañía se registra y se puede marcar como saldado.
- [ ] `POST /api/webhooks/bold` guarda el evento crudo aunque la firma no sea válida, y solo crea la transacción cuando la firma es válida Y el evento es `SALE_APPROVED`.
- [ ] La idempotencia usa `subject` (payment_id) + `type` del payload, no `id` — una notificación repetida no debe duplicar el evento ni la transacción.
- [ ] El endpoint responde 200 en menos de 2 segundos incluso si algo falla después (no dejar que Bold reintente por timeout).
- [ ] RLS de `bold_webhook_events` no permite insert desde el cliente autenticado, solo select.
- [ ] Probado contra el webhook de pruebas de Bold (o la opción "Probar el webhook" del checkout) antes de registrar el endpoint de producción.

---

## 9. Orden sugerido de ejecución

1. Migraciones 007 y 008.
2. Tipos y server actions.
3. Pantallas de lista + formulario manual (lo más usado desde ya).
4. Bold pendientes + endpoint webhook (aunque no haya credenciales reales todavía).
5. Estado de cuenta por socio.
6. Intercompañía.
7. Checklist de aceptación.
