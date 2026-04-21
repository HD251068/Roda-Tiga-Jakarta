import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { rideId } = await request.json()

    const { error } = await supabaseAdmin
      .from('rides')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', rideId)

    if (error) {
      return NextResponse.json(
        { error: 'Gagal menyelesaikan perjalanan' },
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
