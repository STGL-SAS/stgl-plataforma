export const TAREA_ESTADOS = ['pendiente', 'en_curso', 'esperando', 'resuelto'] as const
export type TareaEstado = (typeof TAREA_ESTADOS)[number]

export const TAREA_TIPOS = ['tarea', 'caso'] as const
export type TareaTipo = (typeof TAREA_TIPOS)[number]

export const HISTORIAL_TIPOS = [
  'creacion',
  'cambio_estado',
  'cambio_responsable',
  'comentario',
  'documento_adjunto',
] as const
export type HistorialTipoEvento = (typeof HISTORIAL_TIPOS)[number]

export type SocioOption = {
  id: string
  nombre: string
}

export type NegocioOption = {
  id: string
  codigo: string
  nombre: string
}

export type TareaRow = {
  id: string
  negocio_id: string
  titulo: string
  descripcion: string | null
  tipo: TareaTipo
  responsable_id: string | null
  estado: TareaEstado
  fecha_limite: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  negocios?: { codigo: string; nombre: string } | null
  socios?: { id: string; nombre: string } | null
}

export type TareaHistorialRow = {
  id: string
  tarea_id: string
  tipo_evento: HistorialTipoEvento
  valor_anterior: string | null
  valor_nuevo: string | null
  comentario: string | null
  documento_id: string | null
  created_by: string | null
  created_at: string
  documentos?: { id: string; nombre: string; onedrive_web_url: string | null } | null
}

export const ESTADO_LABEL: Record<TareaEstado, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  esperando: 'Esperando',
  resuelto: 'Resuelto',
}

export const TIPO_LABEL: Record<TareaTipo, string> = {
  tarea: 'Tarea',
  caso: 'Caso',
}

export const EVENTO_LABEL: Record<HistorialTipoEvento, string> = {
  creacion: 'Creación',
  cambio_estado: 'Cambio de estado',
  cambio_responsable: 'Cambio de responsable',
  comentario: 'Comentario',
  documento_adjunto: 'Documento adjunto',
}
