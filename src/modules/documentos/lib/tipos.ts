export type DocumentoRow = {
  id: string
  negocio_id: string
  nombre: string
  categoria: string
  tipo_documento: string | null
  es_carpeta: boolean
  onedrive_item_id: string
  onedrive_parent_id: string | null
  onedrive_path: string | null
  onedrive_web_url: string | null
  fecha: string
  observaciones: string | null
  negocios?: { codigo: string; nombre: string } | null
}

export type NegocioOption = {
  id: string
  codigo: string
  nombre: string
  onedrive_root_folder_id: string | null
}
