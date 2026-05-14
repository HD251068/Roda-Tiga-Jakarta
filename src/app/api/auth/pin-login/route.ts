import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

function hashPin(pin: string): string {
  return createHash('sha256').update(pin + 'roda3jkt').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { phone, pin } = await request.json()

    if (!phone || !pin) {
      return NextResponse.json({ error: 'HP dan PIN wajib diisi' }, { status: 400 })
    }

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN harus 6 digit angka' }, { status: 400 })
    }

    // Cari profile berdasarkan HP
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, pin_hash, is_active')
      .eq('phone', phone)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Nomor HP tidak terdaftar' }, { status: 404 })
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Akun tidak aktif' }, { status: 403 })
    }

    if (!profile.pin_hash) {
      return NextResponse.json({ error: 'PIN belum diatur. Hubungi admin.' }, { status: 403 })
    }

    // Verifikasi PIN
    const inputHash = hashPin(pin)
    if (inputHash !== profile.pin_hash) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id:        profile.id,
        name:      profile.full_name,
        phone:     profile.phone,
        role:      profile.role,
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
