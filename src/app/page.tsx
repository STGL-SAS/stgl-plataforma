import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4">
      <main className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">STGL Plataforma</h1>
        <p className="mt-2 text-zinc-600">
          Gestión interna HYDREX · HARDTECH · HANGARC · VirtualWaiter
        </p>
        <Link
          href="/contabilidad"
          className="mt-8 inline-flex rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Ir a Contabilidad
        </Link>
        <Link
          href="/documentos"
          className="mt-3 inline-flex rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Documentos — OneDrive
        </Link>
        <Link
          href="/hardtech/ventas"
          className="mt-3 inline-flex rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          HARDTECH — Ventas y mantenimientos
        </Link>
        <Link
          href="/inventario-hydrex"
          className="mt-3 inline-flex rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          HYDREX — Costeo e inventario
        </Link>
      </main>
    </div>
  )
}
