import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pickup, destination, fare, tip, total, distance } = body

    if (!pickup || !destination) {
      return NextResponse.json(
        { error: 'Lokasi jemput dan tujuan harus diisi' },
        { status: 400 }
      )
    }

    // Simpan ke database
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        passenger_id: 'temp-user-id', // TODO: dari auth session
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_lat: destination.lat,
        dropoff_lng: destination.lng,
        distance_km: distance,
        fare_amount: fare,
        tip_amount: tip,
        total_amount: total,
        status: 'waiting',
        payment_status: 'unpaid',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal menyimpan pesanan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rideId: ride.id,
      message: 'Pesanan berhasil dibuat'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
