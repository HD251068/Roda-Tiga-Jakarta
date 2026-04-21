import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verifikasi signature (TODO: implement)
    const { order_id, transaction_status, payment_type, gross_amount } = body

    // Update status pembayaran
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      await supabaseAdmin
        .from('rides')
        .update({ 
          payment_status: 'paid',
          payment_method: payment_type
        })
        .eq('id', order_id)

      // Catat di tabel payments
      await supabaseAdmin
        .from('payments')
        .insert({
          ride_id: order_id,
          amount: gross_amount,
          gateway_transaction_id: body.transaction_id,
          status: 'paid',
          payment_method: payment_type
        })
    }

    return NextResponse.json({ status: 'OK' })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
