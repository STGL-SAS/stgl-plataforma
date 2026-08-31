import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase no configurado')
  return createClient(url, key)
}

// TODO: quitar tras diagnosticar firma Bold
function verifyBoldSignature(rawBody: string, signatureHeader: string | null): {
  verified: boolean
  debugMensaje: string
} {
  const secret = process.env.BOLD_WEBHOOK_SECRET ?? ''
  const encoded = Buffer.from(rawBody, 'utf-8').toString('base64')
  const hashed = crypto.createHmac('sha256', secret).update(encoded).digest('hex')
  const debugMensaje = [
    signatureHeader ?? 'null',
    hashed,
    rawBody.slice(0, 80),
  ].join(' | ')

  if (!signatureHeader) {
    return { verified: false, debugMensaje }
  }

  try {
    const verified = crypto.timingSafeEqual(
      Buffer.from(hashed),
      Buffer.from(signatureHeader)
    )
    return { verified, debugMensaje }
  } catch {
    return { verified: false, debugMensaje }
  }
}

function parseFechaBold(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return iso.slice(0, 10)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()

  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('x-bold-signature')
    const { verified: signatureVerified, debugMensaje } = verifyBoldSignature(
      rawBody,
      signatureHeader
    )

    const payload = JSON.parse(rawBody)

    const boldTransactionId: string = payload.subject
    const eventType: string = payload.type
    const monto: number = payload.data?.amount?.total
    const fechaBold: string = payload.data?.created_at
    const metodoPago: string = payload.data?.payment_method ?? 'DESCONOCIDO'
    const referenciaExterna: string | null = payload.data?.metadata?.reference ?? null
    const payerEmail: string | null = payload.data?.payer_email ?? null

    const nombreOriginal = referenciaExterna
      ? `${metodoPago} - ${referenciaExterna}`
      : `${metodoPago}${payerEmail ? ' - ' + payerEmail : ''}`

    const { data: existing } = await supabase
      .from('bold_webhook_events')
      .select('id')
      .eq('bold_transaction_id', boldTransactionId)
      .eq('event_type', eventType)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ status: 'ya procesado' }, { status: 200 })
    }

    const { data: eventRow, error: eventError } = await supabase
      .from('bold_webhook_events')
      .insert({
        bold_transaction_id: boldTransactionId,
        event_type: eventType,
        payload,
        monto,
        descripcion_original: nombreOriginal,
        fecha_bold: fechaBold,
        signature_verified: signatureVerified,
        error_mensaje: debugMensaje,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error guardando evento de Bold:', eventError)
      return NextResponse.json({ error: 'error interno' }, { status: 500 })
    }

    if (signatureVerified && eventType === 'SALE_APPROVED') {
      const [{ data: cuentaBold }, { data: negocioHydrex }] = await Promise.all([
        supabase.from('cuentas_bancarias').select('id').eq('nombre', 'Bold').single(),
        supabase.from('negocios').select('id').eq('codigo', 'HYDREX').single(),
      ])

      if (!cuentaBold || !negocioHydrex) {
        await supabase
          .from('bold_webhook_events')
          .update({ error_mensaje: 'No se encontró cuenta Bold o negocio HYDREX' })
          .eq('id', eventRow.id)
      } else {
        const { data: transaccionExistente } = await supabase
          .from('transacciones')
          .select('id')
          .eq('origen', 'bold')
          .eq('origen_referencia_id', boldTransactionId)
          .maybeSingle()

        if (transaccionExistente) {
          await supabase
            .from('bold_webhook_events')
            .update({
              procesado: true,
              procesado_at: new Date().toISOString(),
              transaccion_id: transaccionExistente.id,
            })
            .eq('id', eventRow.id)
        } else {
          const { data: transaccion, error: transaccionError } = await supabase
            .from('transacciones')
            .insert({
              negocio_id: negocioHydrex.id,
              cuenta_id: cuentaBold.id,
              tipo: 'ingreso',
              monto,
              fecha: parseFechaBold(fechaBold),
              estado: 'pendiente_revision',
              origen: 'bold',
              nombre_original: nombreOriginal,
              origen_referencia_id: boldTransactionId,
            })
            .select()
            .single()

          if (!transaccionError && transaccion) {
            await supabase
              .from('bold_webhook_events')
              .update({
                procesado: true,
                procesado_at: new Date().toISOString(),
                transaccion_id: transaccion.id,
              })
              .eq('id', eventRow.id)
          } else {
            await supabase
              .from('bold_webhook_events')
              .update({ error_mensaje: transaccionError?.message })
              .eq('id', eventRow.id)
          }
        }
      }
    }

    return NextResponse.json({ status: 'recibido' }, { status: 200 })
  } catch (e) {
    console.error('Webhook Bold error:', e)
    return NextResponse.json({ status: 'recibido' }, { status: 200 })
  }
}
