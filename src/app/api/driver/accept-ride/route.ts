import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireDriver } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const { profile, driverProfile, error: authError } = await requireDriver()
    if (authError || !profile || !driverProfile) return authError!

    const { rideId } = await request.json()
    if (!rideId) return NextResponse.json({ error: 'rideId diperlukan' }, { status: 400 })

    const { data: ride } = await supabaseAdmin.from('rides').select('id, status, total_amount').eq('id', rideId).eq('status', 'waiting').single()
    if (!ride) return NextResponse.json({ error: 'Order tidak ditemukan atau sudah diambil' }, { status: 404 })

    const tierRates: Record<string, number> = { platinum: 0.08, gold: 0.09, silver: 0.10, probation: 0.10 }
    const commissionRate   = tierRates[driverProfile.tier] ?? 0.10
    const commissionAmount = Math.round(ride.total_amount * commissionRate)
    const driverEarning    = ride.total_amount - commissionAmount

    const { error } = await supabaseAdmin.from('rides').update({
      driver_id:         profile.id,
      status:            'accepted',
      commission_rate:   commissionRate,
      commission_amount: commissionAmount,
      driver_earning:    driverEarning,
      accepted_at:       new Date().toISOString(),
    }).eq('id', rideId).eq('status', 'waiting')

    if (error) return NextResponse.json({ error: 'Gagal mengambil order' }, { status: 500 })
    return NextResponse.json({ success: true, commissionRate, driverEarning })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
