export type ClienteContacto = {
  telefono?: string
  email?: string
  direccion?: string
}

export function buildClienteContacto(input: {
  telefono?: string
  email?: string
  direccion?: string
}): ClienteContacto {
  const contacto: ClienteContacto = {}
  const telefono = input.telefono?.trim()
  const email = input.email?.trim()
  const direccion = input.direccion?.trim()
  if (telefono) contacto.telefono = telefono
  if (email) contacto.email = email
  if (direccion) contacto.direccion = direccion
  return contacto
}

export function contactoFromRecord(contacto: Record<string, unknown> | null | undefined): {
  telefono: string
  email: string
  direccion: string
} {
  const c = contacto ?? {}
  return {
    telefono: String(c.telefono ?? ''),
    email: String(c.email ?? ''),
    direccion: String(c.direccion ?? ''),
  }
}

/** Teléfono primero; si no hay, email. */
export function resumenContactoCliente(contacto: Record<string, unknown> | null | undefined): string | null {
  const { telefono, email } = contactoFromRecord(contacto)
  if (telefono.trim()) return telefono.trim()
  if (email.trim()) return email.trim()
  return null
}
