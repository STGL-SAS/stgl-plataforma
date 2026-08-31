-- Índices para los filtros de la lista de transacciones (sección 15.3).
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_negocio ON transacciones(negocio_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);

CREATE INDEX IF NOT EXISTS idx_aportes_socio ON aportes_socios(socio_id);
CREATE INDEX IF NOT EXISTS idx_aportes_negocio ON aportes_socios(negocio_id);

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
