import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4">
      <main className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">STGL Plataforma</h1>
        <p className="mt-2 text-zinc-600">
          Gestión interna HYDREX · HANGARC · VirtualWaiter
        </p>
        <Link
          href="/contabilidad"
          className="mt-8 inline-flex rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Ir a Contabilidad
        </Link>
      </main>
    </div>
  )
}
