import type { NavLink } from './navigation-types'

export type { NavLink }

export const OPS_LINKS: NavLink[] = [
  { href: '/contabilidad', label: 'Contabilidad', exact: true },
  { href: '/tareas', label: 'Tareas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/documentos', label: 'Documentos' },
]

export const HARDTECH_LINKS: NavLink[] = [
  { href: '/hardtech/resumen', label: 'Resumen', exact: true },
  { href: '/hardtech/ventas', label: 'Ventas' },
  { href: '/hardtech/mantenimientos', label: 'Mantenimientos' },
  { href: '/hardtech/gastos', label: 'Gastos' },
  { href: '/hardtech/tareas', label: 'Tareas' },
  { href: '/hardtech/pagos-socios', label: 'Pagos entre socios' },
  { href: '/hardtech/divisas', label: 'Cuenta USD' },
  { href: '/hardtech/clientes', label: 'Clientes' },
  { href: '/hardtech/documentos', label: 'Documentos' },
]

export const HYDREX_LINKS: NavLink[] = [
  { href: '/inventario-hydrex', label: 'Resumen', exact: true },
  { href: '/inventario-hydrex/catalogo', label: 'Catálogo' },
  { href: '/inventario-hydrex/componentes-costo', label: 'Componentes' },
  { href: '/inventario-hydrex/calculadora', label: 'Calculadora' },
  { href: '/inventario-hydrex/stock', label: 'Stock' },
  { href: '/inventario-hydrex/proveedores', label: 'Proveedores' },
  { href: '/inventario-hydrex/gastos-fijos', label: 'Gastos fijos' },
  { href: '/inventario-hydrex/tareas', label: 'Tareas' },
  { href: '/inventario-hydrex/clientes', label: 'Clientes' },
  { href: '/inventario-hydrex/documentos', label: 'Documentos' },
]

/** Sub-navegación de la vista por negocio (HANGARC, VirtualWaiter, STGL). */
export function negocioLinks(slug: string): NavLink[] {
  const base = `/negocios/${slug}`
  return [
    { href: base, label: 'Resumen', exact: true },
    { href: `${base}/gastos`, label: 'Gastos' },
    { href: `${base}/tareas`, label: 'Tareas' },
    { href: `${base}/documentos`, label: 'Documentos' },
  ]
}

export const CONTABILIDAD_LINKS: NavLink[] = [
  { href: '/contabilidad', label: 'Resumen', exact: true },
  { href: '/contabilidad/transacciones', label: 'Transacciones' },
  { href: '/contabilidad/bold-pendientes', label: 'Bold pendientes' },
  { href: '/contabilidad/socios', label: 'Socios' },
  { href: '/contabilidad/intercompania', label: 'Intercompañía' },
]

export function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
