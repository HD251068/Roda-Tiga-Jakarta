import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError || !session) return authError!

    const { pickup, destination, fare, tip, total, distance } = await request.json()
    if (!pickup || !destination)
      return NextResponse.json({ error: 'Lokasi jemput dan tujuan harus diisi' }, { status: 400 })

    const commissionRate   = 0.10
    const commissionAmount = Math.round(total * commissionRate)
    const driverEarning    = total - commissionAmount

    const { data: ride, error } = await supabaseAdmin.from('rides').insert({
      passenger_id:      (session.user as any).id,
      pickup_lat:        pickup.lat,
      pickup_lng:        pickup.lng,
      pickup_address:    pickup.address ?? null,
      dropoff_lat:       destination.lat,
      dropoff_lng:       destination.lng,
      dropoff_address:   destination.address ?? null,
      distance_km:       distance,
      fare_amount:       fare,
      tip_amount:        tip ?? 0,
      total_amount:      total,
      commission_rate:   commissionRate,
      commission_amount: commissionAmount,
      driver_earning:    driverEarning,
      status:            'waiting',
      payment_status:    'unpaid',
      created_at:        new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 })
    return NextResponse.json({ success: true, rideId: ride.id, message: 'Pesanan berhasil dibuat' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
