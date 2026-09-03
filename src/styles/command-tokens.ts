export const commandColors = {
  bg: '#181B23',
  bgDeep: '#151820',
  panel: '#1F232D',
  border: '#333845',
  text: '#F5F5F7',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  growth: '#34D399',
  decline: '#F87171',
  alert: '#FF3B30',
  businesses: {
    HYDREX: '#22D3EE',
    HANGARC: '#F59E0B',
    VIRTUALWAITER: '#A3E635',
    HARDTECH: '#C084FC',
    STGL: '#8A8578',
  } as Record<string, string>,
}

export const businessMeta: Record<
  string,
  { nombre: string; descripcion: string; href: string; logo: string }
> = {
  HYDREX: {
    nombre: 'HYDREX',
    descripcion: 'Impermeables — venta online y distribución',
    href: '/inventario-hydrex',
    logo: '/logos/hydrex.jpg',
  },
  HANGARC: {
    nombre: 'HANGARC',
    descripcion: 'Aeromodelismo y experiencias de vuelo',
    href: '/negocios/hangarc',
    logo: '/logos/hangarc.png',
  },
  VIRTUALWAITER: {
    nombre: 'VirtualWaiter',
    descripcion: 'Software para restaurantes',
    href: '/negocios/virtualwaiter',
    logo: '/logos/virtual.png',
  },
  STGL: {
    nombre: 'STGL / General',
    descripcion: 'Gastos, documentos y tareas de la sociedad',
    href: '/negocios/stgl',
    logo: '',
  },
  HARDTECH: {
    nombre: 'HARDTECH',
    descripcion: 'Ventas bajo pedido y mantenimientos',
    href: '/hardtech/resumen',
    logo: '/logos/hardtech.jpg',
  },
}
