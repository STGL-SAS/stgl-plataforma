'use client'

import { useState } from 'react'
import { EstadoCuentaSocioView } from '@/modules/contabilidad/components/EstadoCuentaSocio'
import { useEstadoCuentaSocio } from '@/modules/contabilidad/hooks/useEstadoCuentaSocio'
import type { Negocio, Socio } from '@/modules/contabilidad/types'

interface Props {
  socios: Socio[]
  negocios: Negocio[]
}

export function SociosPageClient({ socios, negocios }: Props) {
  const [socioId, setSocioId] = useState<string | null>(socios[0]?.id ?? null)
  const { data, loading, refetch } = useEstadoCuentaSocio(socioId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Estado de cuenta por socio</h2>
        <p className="text-sm text-zinc-600">
          Aportes registrados por negocio, separados en capital y préstamo.
        </p>
      </div>

      <EstadoCuentaSocioView
        socios={socios}
        negocios={negocios}
        socioId={socioId}
        onSocioChange={setSocioId}
        estado={data}
        loading={loading}
        onRefresh={refetch}
      />
    </div>
  )
}
