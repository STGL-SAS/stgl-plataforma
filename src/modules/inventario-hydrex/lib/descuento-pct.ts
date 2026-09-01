/** Convierte porcentaje de UI (10 = 10%) a fracción en BD (0.1). */
export function descuentoPctUiToFraction(pct: number): number {
  if (!Number.isFinite(pct)) return 0
  return Math.min(1, Math.max(0, pct / 100))
}

/** Convierte fracción en BD (0.1) a porcentaje de UI (10). */
export function descuentoFractionToPctUi(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0
  return Math.round(fraction * 10000) / 100
}
