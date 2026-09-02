import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { getAuthorizationUrl } from '@/lib/msgraph'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'

export async function GET() {
  try {
    await assertCanManageOneDrive()
    const state = randomBytes(16).toString('hex')
    const cookieStore = await cookies()
    cookieStore.set('msgraph_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
      secure: process.env.NODE_ENV === 'production',
    })
    return NextResponse.redirect(getAuthorizationUrl(state))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al iniciar OAuth'
    const base = process.env.MSGRAPH_REDIRECT_URI
      ? new URL(process.env.MSGRAPH_REDIRECT_URI).origin
      : 'http://localhost:3000'
    return NextResponse.redirect(`${base}/documentos?error=${encodeURIComponent(msg)}`)
  }
}
