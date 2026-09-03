'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getBalancePorNegocio, type BalanceNegocioDetalle } from '@/modules/contabilidad/actions/balance'
import { getGastosFijosNegocio, getGastosOcasionalesNegocio } from '@/modules/hardtech/lib/queries'
import { getTareas } from '@/modules/tareas/lib/actions'

const ESTADOS_ABIERTAS = ['pendiente', 'en_curso', 'esperando'] as const

export type ResumenGastoFijo = {
  id: string
  concepto: string
  monto: number
  periodicidad: string
}

export type ResumenGastoOcasional = {
  id: string
  concepto: string
  monto: number
  fecha: string
}

export type ResumenTarea = {
  id: string
  titulo: string
  estado: string
  fecha_limite: string | null
  responsable: string | null
}

export type ResumenDocumento = {
  id: string
  nombre: string
  categoria: string
  fecha: string | null
  onedrive_web_url: string | null
  es_carpeta: boolean
}

export type ResumenNegocioData = {
  balance: BalanceNegocioDetalle
  gastosFijos: ResumenGastoFijo[]
  gastosFijosTotal: number
  gastosOcasionales: ResumenGastoOcasional[]
  gastosOcasionalesTotal: number
  tareasAbiertas: ResumenTarea[]
  tareasAbiertasTotal: number
  documentos: ResumenDocumento[]
  documentosTotal: number
}

export async function getResumenNegocioData(negocioId: string): Promise<ResumenNegocioData> {
  const supabase = createAdminClient()

  const [balance, fijos, ocasionales, tareasRaw, docsRes, docsCountRes] = await Promise.all([
    getBalancePorNegocio(negocioId),
    getGastosFijosNegocio(negocioId),
    getGastosOcasionalesNegocio(negocioId),
    getTareas(negocioId),
    supabase
      .from('documentos')
      .select('id, nombre, categoria, fecha, onedrive_web_url, es_carpeta')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false, nullsFirst: false })
      .order('nombre')
      .limit(5),
    supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocioId),
  ])

  if (docsRes.error) throw new Error(docsRes.error.message)

  const tareasAbiertasAll = (tareasRaw ?? []).filter((t) =>
    ESTADOS_ABIERTAS.includes(t.estado as (typeof ESTADOS_ABIERTAS)[number])
  )

  const tareasAbiertas: ResumenTarea[] = tareasAbiertasAll.slice(0, 5).map((t) => {
    const socio = t.socios as { nombre: string } | { nombre: string }[] | null
    const socioNombre = Array.isArray(socio) ? socio[0]?.nombre : socio?.nombre
    return {
      id: t.id as string,
      titulo: t.titulo as string,
      estado: t.estado as string,
      fecha_limite: (t.fecha_limite as string | null) ?? null,
      responsable: socioNombre ?? null,
    }
  })

  return {
    balance,
    gastosFijos: fijos.slice(0, 4).map((g) => ({
      id: g.id,
      concepto: g.concepto,
      monto: g.monto,
      periodicidad: g.periodicidad,
    })),
    gastosFijosTotal: fijos.length,
    gastosOcasionales: ocasionales.slice(0, 4).map((g) => ({
      id: g.id,
      concepto: g.concepto,
      monto: g.monto,
      fecha: g.fecha,
    })),
    gastosOcasionalesTotal: ocasionales.length,
    tareasAbiertas,
    tareasAbiertasTotal: tareasAbiertasAll.length,
    documentos: (docsRes.data ?? []).map((d) => ({
      id: d.id as string,
      nombre: d.nombre as string,
      categoria: d.categoria as string,
      fecha: (d.fecha as string | null) ?? null,
      onedrive_web_url: (d.onedrive_web_url as string | null) ?? null,
      es_carpeta: Boolean(d.es_carpeta),
    })),
    documentosTotal: docsCountRes.count ?? 0,
  }
}
