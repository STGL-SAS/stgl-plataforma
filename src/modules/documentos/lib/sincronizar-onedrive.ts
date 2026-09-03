import {
  fetchDriveDelta,
  getStoredDeltaLink,
  GraphRequestError,
  saveDeltaLink,
} from '@/lib/msgraph'
import { procesarEliminacionesSync } from '@/modules/documentos/lib/delete-documento'
import { importarDesdeOneDrive, type ImportarOneDriveResult } from '@/modules/documentos/lib/importar-onedrive'

export type SincronizarOneDriveResult = ImportarOneDriveResult & {
  documentos_eliminados: number
  tareas_actualizadas: number
  omitidos: number
  eliminaciones_detectadas: number
}

async function sincronizarOneDriveEliminaciones() {
  const storedLink = await getStoredDeltaLink()
  let deltaResult

  try {
    deltaResult = await fetchDriveDelta(storedLink)
  } catch (e) {
    if (e instanceof GraphRequestError && (e.status === 410 || e.status === 404)) {
      deltaResult = await fetchDriveDelta(null)
    } else {
      throw e
    }
  }

  const syncResult = await procesarEliminacionesSync(deltaResult.deletedOnedriveIds)

  if (deltaResult.deltaLink) {
    await saveDeltaLink(deltaResult.deltaLink)
  }

  return {
    ...syncResult,
    eliminaciones_detectadas: deltaResult.deletedOnedriveIds.length,
  }
}

/** Importa novedades + refleja eliminaciones detectadas en OneDrive. */
export async function sincronizarOneDrive(userId: string | null): Promise<SincronizarOneDriveResult> {
  const importResult = await importarDesdeOneDrive(userId)
  const elimResult = await sincronizarOneDriveEliminaciones()
  return { ...importResult, ...elimResult }
}
