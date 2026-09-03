import { createAdminClient } from '@/lib/supabase/admin'

const GRAPH = 'https://graph.microsoft.com/v1.0'

export type GraphDriveItem = {
  id: string
  name: string
  webUrl?: string
  size?: number
  folder?: { childCount?: number }
  file?: { mimeType?: string }
  parentReference?: { id?: string; path?: string }
  createdDateTime?: string
  lastModifiedDateTime?: string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `Falta variable de entorno ${name}. Ver GUIA_MICROSOFT_ENTRA_FASE6 / Vercel env.`
    )
  }
  return v
}

function getConfig() {
  return {
    clientId: requireEnv('MSGRAPH_CLIENT_ID'),
    clientSecret: requireEnv('MSGRAPH_CLIENT_SECRET'),
    redirectUri: requireEnv('MSGRAPH_REDIRECT_URI'),
    // Tenant real del directorio de stglsas@hotmail.com — NO usar common/consumers
    // (provocó AADSTS16000 durante el registro).
    tenantId: requireEnv('MSGRAPH_TENANT'),
  }
}

function tokenEndpoint(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
}

function authorizeEndpoint(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
}

const SCOPES = 'Files.ReadWrite offline_access User.Read'

export function getAuthorizationUrl(state?: string): string {
  const { clientId, redirectUri, tenantId } = getConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES,
    state: state ?? 'stgl',
  })
  return `${authorizeEndpoint(tenantId)}?${params}`
}

async function requestToken(body: Record<string, string>) {
  const { clientId, clientSecret, redirectUri, tenantId } = getConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    ...body,
  })
  const res = await fetch(tokenEndpoint(tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const json = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Error al obtener token Microsoft')
  }
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_in: json.expires_in ?? 3600,
  }
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const tokens = await requestToken({
    grant_type: 'authorization_code',
    code,
    scope: SCOPES,
  })
  if (!tokens.refresh_token) {
    throw new Error('Microsoft no devolvió refresh_token. Revisá el scope offline_access.')
  }
  const supabase = createAdminClient()
  const expires_at = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const { error } = await supabase.from('ms_graph_tokens').upsert({
    id: 1,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function getValidAccessToken(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('ms_graph_tokens').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data?.refresh_token) {
    throw new Error('OneDrive no conectado. Usá «Conectar OneDrive» en Documentos.')
  }

  const expiresAt = new Date(data.expires_at as string).getTime()
  const skewMs = 5 * 60 * 1000
  if (data.access_token && expiresAt > Date.now() + skewMs) {
    return data.access_token as string
  }

  const refreshed = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: data.refresh_token as string,
    scope: SCOPES,
  })
  const expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  const { error: upError } = await supabase
    .from('ms_graph_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? data.refresh_token,
      expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  if (upError) throw new Error(upError.message)
  return refreshed.access_token
}

export async function isMsGraphConnected(): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('ms_graph_tokens')
      .select('id, refresh_token')
      .eq('id', 1)
      .maybeSingle()
    return Boolean(data?.refresh_token)
  } catch {
    return false
  }
}

async function graphFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken()
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && !(init.headers as Record<string, string>)?.['Content-Type']
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Graph ${res.status}: ${await res.text()}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function listChildren(folderId?: string): Promise<GraphDriveItem[]> {
  let nextUrl: string | null = folderId
    ? `${GRAPH}/me/drive/items/${folderId}/children?$top=200&$orderby=name`
    : `${GRAPH}/me/drive/root/children?$top=200&$orderby=name`

  const all: GraphDriveItem[] = []
  while (nextUrl) {
    const token = await getValidAccessToken()
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Graph ${res.status}: ${await res.text()}`)
    }
    const data = (await res.json()) as {
      value?: GraphDriveItem[]
      '@odata.nextLink'?: string
    }
    all.push(...(data.value ?? []))
    nextUrl = data['@odata.nextLink'] ?? null
  }
  return all
}

export async function createFolder(parentId: string, name: string): Promise<GraphDriveItem> {
  const path =
    parentId === 'root'
      ? `/me/drive/root/children`
      : `/me/drive/items/${parentId}/children`
  return graphFetch<GraphDriveItem>(path, {
    method: 'POST',
    body: JSON.stringify({
      name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    }),
  })
}

/**
 * Upload simple (&lt; ~4MB).
 * TODO: archivos más pesados requieren upload session
 * (createUploadSession) — no implementado en Fase 6.
 */
export async function uploadSmallFile(
  parentId: string,
  filename: string,
  fileBuffer: Buffer
): Promise<GraphDriveItem> {
  if (fileBuffer.byteLength > 4 * 1024 * 1024) {
    throw new Error(
      'Archivo mayor a 4 MB. Por ahora subí archivos más chicos o desde OneDrive (upload session pendiente).'
    )
  }
  const token = await getValidAccessToken()
  const encoded = encodeURIComponent(filename)
  const url =
    parentId === 'root'
      ? `${GRAPH}/me/drive/root:/${encoded}:/content`
      : `${GRAPH}/me/drive/items/${parentId}:/${encoded}:/content`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(fileBuffer),
  })
  if (!res.ok) {
    throw new Error(`Graph upload ${res.status}: ${await res.text()}`)
  }
  return (await res.json()) as GraphDriveItem
}

export class GraphRequestError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'GraphRequestError'
  }
}

/** Elimina un ítem en OneDrive. 404 = ya no existe (OK para limpieza en BD). */
export async function deleteDriveItem(itemId: string): Promise<'deleted' | 'not_found'> {
  const token = await getValidAccessToken()
  const res = await fetch(`${GRAPH}/me/drive/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return 'not_found'
  if (!res.ok) {
    throw new GraphRequestError(res.status, await res.text())
  }
  return 'deleted'
}

type DeltaPage = {
  value?: Array<GraphDriveItem & { '@removed'?: { reason?: string } }>
  '@odata.nextLink'?: string
  '@odata.deltaLink'?: string
}

export type DriveDeltaResult = {
  deletedOnedriveIds: string[]
  deltaLink: string | null
}

/** Recorre el delta del drive y devuelve IDs eliminados + nuevo deltaLink. */
export async function fetchDriveDelta(startUrl?: string | null): Promise<DriveDeltaResult> {
  const deletedOnedriveIds: string[] = []
  let nextUrl: string | null = startUrl ?? `${GRAPH}/me/drive/root/delta`
  let deltaLink: string | null = null

  while (nextUrl) {
    const token = await getValidAccessToken()
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new GraphRequestError(res.status, await res.text())
    }
    const data = (await res.json()) as DeltaPage
    for (const item of data.value ?? []) {
      if (item['@removed']) {
        deletedOnedriveIds.push(item.id)
      }
    }
    if (data['@odata.deltaLink']) {
      deltaLink = data['@odata.deltaLink']
      nextUrl = null
    } else {
      nextUrl = data['@odata.nextLink'] ?? null
    }
  }

  return { deletedOnedriveIds, deltaLink }
}

export async function getStoredDeltaLink(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ms_graph_tokens')
    .select('drive_delta_link')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.drive_delta_link as string | null) ?? null
}

export async function saveDeltaLink(deltaLink: string | null): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ms_graph_tokens')
    .update({ drive_delta_link: deltaLink, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw new Error(error.message)
}
