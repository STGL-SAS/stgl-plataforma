# Módulo de Contabilidad (Fase 3)

Ledger central, clasificación Bold, aportes de socios e intercompañía.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/contabilidad` | Resumen y accesos rápidos |
| `/contabilidad/transacciones` | Lista con filtros |
| `/contabilidad/transacciones/nueva` | Alta manual (ya clasificada) |
| `/contabilidad/bold-pendientes` | Cola de clasificación Bold |
| `/contabilidad/socios` | Estado de cuenta por socio |
| `/contabilidad/intercompania` | Préstamos entre negocios |

## Esquema (ajustes vs. prompt)

El código usa los nombres reales de Fase 2:

- `cuenta_id` (no `cuenta_bancaria_id`)
- `origen_referencia_id` (no `bold_transaction_id`)
- `origen` enum: `manual | bold | shopify`
- `aportes_socios` extiende una fila en `transacciones` tipo `aporte`

## Migraciones pendientes

```bash
supabase db push
```

Aplica `20260831035123_bold_webhook_events.sql` y `20260831035124_ajustes_contabilidad.sql`.

## Bold — pendiente de configuración en producción

1. **Vercel**: `BOLD_WEBHOOK_SECRET` — llave de pruebas en Preview/Development, llave real en Production.
2. **Panel Bold** → Integraciones → Webhooks: registrar `https://<dominio>/api/webhooks/bold`.
3. Probar con webhook de pruebas o checkout de prueba antes de producción.
4. Referencia: [developers.bold.co/webhook](https://developers.bold.co/webhook)

## Server actions

Usan `SUPABASE_SERVICE_ROLE_KEY` vía `createAdminClient()` hasta activar auth (Fase 7).
