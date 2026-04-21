import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { rideId } = await request.json()

    // Ambil data ride
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()

    if (error || !ride) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // TODO: Integrasi Midtrans di sini
    // Untuk sementara, return mock payment URL
    const mockPaymentUrl = `https://example.com/pay/${rideId}`

    // Update payment status
    await supabaseAdmin
      .from('rides')
      .update({ payment_status: 'pending' })
      .eq('id', rideId)

    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl
    })
    
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat pembayaran' },
      { status: 500 }
    )
  }
}
