'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertConfigSuperadmin } from './dashboard'

export type ParticipacionRow = {
  id?: string
  negocio_id: string
  socio_id: string
  porcentaje: number
  negocio_nombre?: string
  socio_nombre?: string
}

export async function getParticipaciones(): Promise<ParticipacionRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('socios_participacion')
    .select('negocio_id, socio_id, porcentaje, negocios(nombre), socios(nombre)')
    .order('negocio_id')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => {
    const negocios = r.negocios as { nombre: string } | { nombre: string }[] | null
    const socios = r.socios as { nombre: string } | { nombre: string }[] | null
    const neg = Array.isArray(negocios) ? negocios[0] : negocios
    const soc = Array.isArray(socios) ? socios[0] : socios
    return {
      negocio_id: r.negocio_id as string,
      socio_id: r.socio_id as string,
      porcentaje: Number(r.porcentaje),
      negocio_nombre: neg?.nombre,
      socio_nombre: soc?.nombre,
    }
  })
}

export async function upsertParticipacion(input: {
  negocio_id: string
  socio_id: string
  porcentaje: number
}) {
  await assertConfigSuperadmin()
  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('socios_participacion')
    .select('socio_id')
    .eq('negocio_id', input.negocio_id)
    .eq('socio_id', input.socio_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('socios_participacion')
      .update({ porcentaje: input.porcentaje })
      .eq('negocio_id', input.negocio_id)
      .eq('socio_id', input.socio_id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('socios_participacion').insert({
      negocio_id: input.negocio_id,
      socio_id: input.socio_id,
      porcentaje: input.porcentaje,
    })
    if (error) throw new Error(error.message)
  }
}

/**
 * Actualiza el % de un socio y, si el negocio tiene exactamente otro socio,
 * ajusta el complementario a 100 − % (con UPDATE explícito — no upsert —
 * para no disparar el trigger de INSERT con suma incorrecta).
 */
export async function setParticipacionConComplemento(input: {
  negocio_id: string
  socio_id: string
  porcentaje: number
}): Promise<ParticipacionRow[]> {
  await assertConfigSuperadmin()
  const pct = Math.round(Number(input.porcentaje) * 100) / 100
  if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
    throw new Error('El porcentaje debe ser mayor a 0 y como máximo 100.')
  }

  const supabase = createAdminClient()
  const { data: existentes, error: listError } = await supabase
    .from('socios_participacion')
    .select('negocio_id, socio_id, porcentaje')
    .eq('negocio_id', input.negocio_id)
  if (listError) throw new Error(listError.message)

  const actual = (existentes ?? []).find((r) => r.socio_id === input.socio_id)
  const otros = (existentes ?? []).filter((r) => r.socio_id !== input.socio_id)

  async function writeSelf(porcentaje: number) {
    if (actual) {
      const { error } = await supabase
        .from('socios_participacion')
        .update({ porcentaje })
        .eq('negocio_id', input.negocio_id)
        .eq('socio_id', input.socio_id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('socios_participacion').insert({
        negocio_id: input.negocio_id,
        socio_id: input.socio_id,
        porcentaje,
      })
      if (error) throw new Error(error.message)
    }
  }

  if (otros.length === 1) {
    if (pct >= 100) {
      throw new Error(
        'Con dos socios el porcentaje debe ser menor a 100 (el otro queda con el resto).'
      )
    }
    const complemento = Math.round((100 - pct) * 100) / 100
    if (complemento <= 0) {
      throw new Error('El otro socio quedaría en 0%. Ajusta el porcentaje.')
    }

    const otro = otros[0]
    const actualPct = actual ? Number(actual.porcentaje) : 0

    // Primero bajar quien hace subir la suma temporal, solo con UPDATE/INSERT
    if (!actual || pct > actualPct) {
      const { error: e1 } = await supabase
        .from('socios_participacion')
        .update({ porcentaje: complemento })
        .eq('negocio_id', input.negocio_id)
        .eq('socio_id', otro.socio_id)
      if (e1) throw new Error(e1.message)
      await writeSelf(pct)
    } else {
      await writeSelf(pct)
      const { error: e2 } = await supabase
        .from('socios_participacion')
        .update({ porcentaje: complemento })
        .eq('negocio_id', input.negocio_id)
        .eq('socio_id', otro.socio_id)
      if (e2) throw new Error(e2.message)
    }
  } else {
    await writeSelf(pct)
  }

  return getParticipaciones()
}

export async function deleteParticipacion(negocio_id: string, socio_id: string) {
  await assertConfigSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('socios_participacion')
    .delete()
    .eq('negocio_id', negocio_id)
    .eq('socio_id', socio_id)
  if (error) throw new Error(error.message)
}

export type UsuarioRolRow = {
  user_id: string
  email: string
  rol: 'superadmin' | 'usuario_normal'
  socio_id: string | null
  socio_nombre: string | null
}

export async function getUsuariosRoles(): Promise<UsuarioRolRow[]> {
  const admin = createAdminClient()
  const { data: roles, error } = await admin
    .from('usuarios_roles')
    .select('user_id, rol, socio_id, socios(nombre)')
  if (error) throw new Error(error.message)

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 200,
  })
  if (authError) throw new Error(authError.message)

  const byId = new Map(
    (roles ?? []).map((r) => {
      const socios = r.socios as { nombre: string } | { nombre: string }[] | null
      const soc = Array.isArray(socios) ? socios[0] : socios
      return [
        r.user_id as string,
        {
          rol: r.rol as 'superadmin' | 'usuario_normal',
          socio_id: (r.socio_id as string | null) ?? null,
          socio_nombre: soc?.nombre ?? null,
        },
      ]
    })
  )

  return (authData.users ?? []).map((u) => {
    const meta = byId.get(u.id)
    return {
      user_id: u.id,
      email: u.email ?? '(sin email)',
      rol: meta?.rol ?? 'usuario_normal',
      socio_id: meta?.socio_id ?? null,
      socio_nombre: meta?.socio_nombre ?? null,
    }
  })
}

export async function saveUsuarioRol(input: {
  user_id: string
  rol: 'superadmin' | 'usuario_normal'
  socio_id: string | null
}) {
  await assertConfigSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('usuarios_roles').upsert(
    {
      user_id: input.user_id,
      rol: input.rol,
      socio_id: input.socio_id || null,
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
}

export async function getSociosYNegocios() {
  const supabase = createAdminClient()
  const [{ data: socios, error: e1 }, { data: negocios, error: e2 }] = await Promise.all([
    supabase.from('socios').select('id, nombre').order('nombre'),
    supabase.from('negocios').select('id, codigo, nombre').order('codigo'),
  ])
  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)
  return { socios: socios ?? [], negocios: negocios ?? [] }
}
