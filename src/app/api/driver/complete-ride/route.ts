import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireDriver } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const { profile, driverProfile, error: authError } = await requireDriver()
    if (authError || !profile || !driverProfile) return authError!

    const { rideId, driverWasOntime, passengerWasReady } = await request.json()
    if (!rideId) return NextResponse.json({ error: 'rideId diperlukan' }, { status: 400 })

    const { data: ride } = await supabaseAdmin.from('rides').select('*').eq('id', rideId).eq('driver_id', profile.id).single()
    if (!ride) return NextResponse.json({ error: 'Ride tidak ditemukan' }, { status: 404 })

    const bothPerfect       = driverWasOntime && passengerWasReady
    const driverBonus       = driverWasOntime   ? Math.round(ride.fare_amount * 0.01) : 0
    const passengerCashback = passengerWasReady ? Math.round(ride.fare_amount * 0.02) : 0

    await supabaseAdmin.from('rides').update({
      status:              'completed',
      completed_at:        new Date().toISOString(),
      driver_was_ontime:   driverWasOntime   ?? false,
      passenger_was_ready: passengerWasReady ?? false,
      both_perfect:        bothPerfect,
      driver_bonus:        driverBonus,
      passenger_cashback:  passengerCashback,
    }).eq('id', rideId)

    // Kredit bonus driver
    if (driverBonus > 0) {
      const newBalance = driverProfile.wallet_balance + ride.driver_earning + driverBonus
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: profile.id, ride_id: rideId, amount: driverBonus,
        balance_after: newBalance, type: 'driver_bonus',
        note: `Bonus ontime trip ${rideId.slice(0, 8)}`,
      })
      await supabaseAdmin.from('driver_profiles').update({ wallet_balance: newBalance }).eq('user_id', profile.id)
    }

    // Kredit cashback penumpang
    if (passengerCashback > 0) {
      const { data: pp } = await supabaseAdmin.from('passenger_profiles').select('wallet_balance').eq('user_id', ride.passenger_id).single()
      if (pp) {
        const newBalance = pp.wallet_balance + passengerCashback
        await supabaseAdmin.from('wallet_transactions').insert({
          user_id: ride.passenger_id, ride_id: rideId, amount: passengerCashback,
          balance_after: newBalance, type: 'passenger_cashback',
          note: `Cashback ontime trip ${rideId.slice(0, 8)}`,
        })
        await supabaseAdmin.from('passenger_profiles').update({ wallet_balance: newBalance }).eq('user_id', ride.passenger_id)
      }
    }

    return NextResponse.json({ success: true, driverBonus, passengerCashback, bothPerfect })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
