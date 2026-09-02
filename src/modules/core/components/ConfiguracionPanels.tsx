'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  deleteParticipacion,
  saveUsuarioRol,
  setParticipacionConComplemento,
  type ParticipacionRow,
  type UsuarioRolRow,
} from '../lib/configuracion'

type Socio = { id: string; nombre: string }
type Negocio = { id: string; codigo: string; nombre: string }

export function ConfigHydrexLinks() {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">Parámetros HYDREX</h2>
      <p className="text-sm text-zinc-600">Accesos a pantallas ya existentes del módulo.</p>
      <ul className="space-y-1 text-sm">
        <li>
          <Link href="/inventario-hydrex/componentes-costo" className="text-blue-700 hover:underline">
            Componentes de costo →
          </Link>
        </li>
        <li>
          <Link href="/inventario-hydrex/catalogo" className="text-blue-700 hover:underline">
            Catálogo de insumos →
          </Link>
        </li>
      </ul>
    </section>
  )
}

export function ConfigParticipacion({
  initial,
  socios,
  negocios,
  canEdit,
}: {
  initial: ParticipacionRow[]
  socios: Socio[]
  negocios: Negocio[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((r) => [`${r.negocio_id}:${r.socio_id}`, String(r.porcentaje)]))
  )
  const [negocioId, setNegocioId] = useState(negocios[0]?.id ?? '')
  const [socioId, setSocioId] = useState(socios[0]?.id ?? '')
  const [pct, setPct] = useState('50')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRows(initial)
    setDrafts(
      Object.fromEntries(initial.map((r) => [`${r.negocio_id}:${r.socio_id}`, String(r.porcentaje)]))
    )
  }, [initial])

  function rowKey(r: { negocio_id: string; socio_id: string }) {
    return `${r.negocio_id}:${r.socio_id}`
  }

  function confirmMessage(negocio_id: string, socio_id: string, porcentaje: number): string {
    const socio = socios.find((s) => s.id === socio_id)
    const negocio = negocios.find((n) => n.id === negocio_id)
    const delNegocio = rows.filter((r) => r.negocio_id === negocio_id)
    const otro = delNegocio.find((r) => r.socio_id !== socio_id)
    const pct = Math.round(porcentaje * 100) / 100

    if (otro && delNegocio.length === 2) {
      const complemento = Math.round((100 - pct) * 100) / 100
      return (
        `¿Confirmar participación en ${negocio?.nombre ?? 'este negocio'}?\n\n` +
        `• ${socio?.nombre ?? 'Socio'}: ${pct}%\n` +
        `• ${otro.socio_nombre ?? 'El otro socio'}: ${complemento}% (ajuste automático)\n\n` +
        `Total: 100%`
      )
    }

    return (
      `¿Guardar ${pct}% para ${socio?.nombre ?? 'este socio'} ` +
      `en ${negocio?.nombre ?? 'este negocio'}?`
    )
  }

  async function applyPct(negocio_id: string, socio_id: string, porcentaje: number) {
    if (!canEdit) return
    if (Number.isNaN(porcentaje)) return

    if (!window.confirm(confirmMessage(negocio_id, socio_id, porcentaje))) {
      setDrafts(
        Object.fromEntries(rows.map((r) => [`${r.negocio_id}:${r.socio_id}`, String(r.porcentaje)]))
      )
      return
    }

    setBusy(true)
    setError(null)
    try {
      const next = await setParticipacionConComplemento({
        negocio_id,
        socio_id,
        porcentaje,
      })
      setRows(next)
      setDrafts(
        Object.fromEntries(next.map((r) => [`${r.negocio_id}:${r.socio_id}`, String(r.porcentaje)]))
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setDrafts(
        Object.fromEntries(rows.map((r) => [`${r.negocio_id}:${r.socio_id}`, String(r.porcentaje)]))
      )
    } finally {
      setBusy(false)
    }
  }

  async function saveNew(e: React.FormEvent) {
    e.preventDefault()
    await applyPct(negocioId, socioId, Number(pct))
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Participación societaria</h2>
      <p className="text-sm text-zinc-600">
        Si el negocio tiene dos socios, al cambiar el % de uno el otro se ajusta solo a completar
        100%.
      </p>
      {!canEdit && (
        <p className="text-xs text-amber-800">Solo un superadmin puede editar esta sección.</p>
      )}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2">Negocio</th>
              <th className="px-4 py-2">Socio</th>
              <th className="px-4 py-2">%</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const key = rowKey(r)
              return (
                <tr key={key} className="border-b border-zinc-100">
                  <td className="px-4 py-2">{r.negocio_nombre}</td>
                  <td className="px-4 py-2">{r.socio_nombre}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0.01}
                      max={99.99}
                      step={0.01}
                      disabled={!canEdit || busy}
                      className="w-20 rounded border px-2 py-1"
                      value={drafts[key] ?? String(r.porcentaje)}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      onBlur={(e) => {
                        const v = Number(e.target.value)
                        if (Number.isNaN(v) || v === r.porcentaje) return
                        void applyPct(r.negocio_id, r.socio_id, v)
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canEdit && (
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await deleteParticipacion(r.negocio_id, r.socio_id)
                            setRows((prev) =>
                              prev.filter(
                                (x) =>
                                  !(x.negocio_id === r.negocio_id && x.socio_id === r.socio_id)
                              )
                            )
                            router.refresh()
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Error')
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <form onSubmit={saveNew} className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Negocio</span>
            <select
              className="rounded-md border px-2 py-1.5"
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
            >
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Socio</span>
            <select
              className="rounded-md border px-2 py-1.5"
              value={socioId}
              onChange={(e) => setSocioId(e.target.value)}
            >
              {socios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">%</span>
            <input
              type="number"
              min={0.01}
              max={99.99}
              step={0.01}
              className="w-24 rounded-md border px-2 py-1.5"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Agregar / actualizar
          </button>
        </form>
      )}
    </section>
  )
}

export function ConfigUsuariosRoles({
  initial,
  socios,
  canEdit,
}: {
  initial: UsuarioRolRow[]
  socios: Socio[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function save(row: UsuarioRolRow) {
    if (!canEdit) return
    setBusyId(row.user_id)
    setError(null)
    try {
      await saveUsuarioRol({
        user_id: row.user_id,
        rol: row.rol,
        socio_id: row.socio_id,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Usuarios y roles</h2>
      <p className="text-sm text-zinc-600">
        Asigna rol a usuarios que ya existen en Supabase Auth. La invitación por correo llega en
        Fase 10.
      </p>
      {!canEdit && (
        <p className="text-xs text-amber-800">Solo un superadmin puede cambiar roles.</p>
      )}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Socio asociado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No hay usuarios en Auth todavía.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.user_id} className="border-b border-zinc-100">
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2">
                  <select
                    disabled={!canEdit}
                    className="rounded border px-2 py-1"
                    value={r.rol}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.user_id === r.user_id
                            ? {
                                ...x,
                                rol: e.target.value as 'superadmin' | 'usuario_normal',
                              }
                            : x
                        )
                      )
                    }
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="usuario_normal">Usuario normal</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    disabled={!canEdit}
                    className="rounded border px-2 py-1"
                    value={r.socio_id ?? ''}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.user_id === r.user_id
                            ? { ...x, socio_id: e.target.value || null }
                            : x
                        )
                      )
                    }
                  >
                    <option value="">—</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-right">
                  {canEdit && (
                    <button
                      type="button"
                      disabled={busyId === r.user_id}
                      className="rounded-md bg-zinc-900 px-3 py-1 text-xs text-white disabled:opacity-50"
                      onClick={() => void save(r)}
                    >
                      {busyId === r.user_id ? '…' : 'Guardar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
