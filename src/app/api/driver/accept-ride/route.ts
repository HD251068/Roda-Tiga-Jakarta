import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { rideId, driverId } = await request.json()

    const { error } = await supabaseAdmin
      .from('rides')
      .update({ 
        driver_id: driverId, 
        status: 'accepted' 
      })
      .eq('id', rideId)
      .eq('status', 'waiting')

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
