-- Buffer/auditoría de eventos crudos recibidos desde el webhook de Bold,
-- antes de convertirlos en filas de `transacciones`. Evita duplicados
-- (bold_transaction_id es UNIQUE) y deja rastro de qué llegó exactamente.

CREATE TABLE IF NOT EXISTS bold_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bold_transaction_id TEXT NOT NULL,
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
    UNIQUE (bold_transaction_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_bold_events_procesado
    ON bold_webhook_events(procesado);

ALTER TABLE bold_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bold_events_select_authenticated" ON bold_webhook_events
    FOR SELECT
    TO authenticated
    USING (true);
