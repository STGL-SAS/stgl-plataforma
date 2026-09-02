import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForTokens } from '@/lib/msgraph'

function appOrigin(): string {
  const redirect = process.env.MSGRAPH_REDIRECT_URI
  if (redirect) {
    try {
      return new URL(redirect).origin
    } catch {
      /* fallthrough */
    }
  }
  return 'http://localhost:3000'
}

export async function GET(req: NextRequest) {
  const origin = appOrigin()
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err =
    url.searchParams.get('error_description') || url.searchParams.get('error')

  if (err) {
    return NextResponse.redirect(`${origin}/documentos?error=${encodeURIComponent(err)}`)
  }

  const cookieStore = await cookies()
  const expected = cookieStore.get('msgraph_oauth_state')?.value
  cookieStore.delete('msgraph_oauth_state')

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(
      `${origin}/documentos?error=${encodeURIComponent('Estado OAuth inválido. Reintentá conectar.')}`
    )
  }

  try {
    await exchangeCodeForTokens(code)
    return NextResponse.redirect(`${origin}/documentos?conectado=1`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al conectar OneDrive'
    return NextResponse.redirect(`${origin}/documentos?error=${encodeURIComponent(msg)}`)
  }
}
