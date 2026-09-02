'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  deleteGastoFijoNegocio,
  deleteGastoOcasional,
  upsertGastoFijoHardtech,
  upsertGastoOcasionalHardtech,
} from '../actions/mutations'
import { GastosFijosLista, type GastoFijoRow, type SocioOption } from './GastosFijosLista'
import { GastosOcasionalesLista, type GastoOcasionalRow } from './GastosOcasionalesLista'

interface Props {
  gastosFijos: GastoFijoRow[]
  gastosOcasionales: GastoOcasionalRow[]
  socios: SocioOption[]
}

export function GastosHardtechPanel({ gastosFijos, gastosOcasionales, socios }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'fijos' | 'ocasionales'>('fijos')
  const refresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-zinc-200 pb-2">
        {(
          [
            { id: 'fijos', label: 'Fijos' },
            { id: 'ocasionales', label: 'Ocasionales' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fijos' ? (
        <GastosFijosLista
          gastos={gastosFijos}
          socios={socios}
          mostrarPagoPersonal
          onSave={async (input) => {
            await upsertGastoFijoHardtech(input)
          }}
          onDelete={deleteGastoFijoNegocio}
          onRefresh={refresh}
        />
      ) : (
        <GastosOcasionalesLista
          gastos={gastosOcasionales}
          socios={socios}
          mostrarPagoPersonal
          onSave={async (input) => {
            await upsertGastoOcasionalHardtech(input)
          }}
          onDelete={deleteGastoOcasional}
          onRefresh={refresh}
        />
      )}
    </div>
  )
}
