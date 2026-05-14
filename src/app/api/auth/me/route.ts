import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth, getProfile } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const profile = await getProfile()
    if (!profile) return NextResponse.json({ error: 'Profile tidak ditemukan' }, { status: 404 })

    const table = profile.role === 'driver' ? 'driver_profiles' : 'passenger_profiles'
    const { data: subProfile } = await supabaseAdmin.from(table).select('*').eq('user_id', profile.id).single()

    return NextResponse.json({ profile, subProfile })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
