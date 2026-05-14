import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, role } = await request.json()
    if (!email || !password || !full_name || !phone)
      return NextResponse.json({ error: 'Email, password, nama, dan HP wajib diisi' }, { status: 400 })

    const { data: { user }, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name, phone, role },
    })
    if (signUpError || !user) {
      if (signUpError?.message?.includes('already'))
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
      return NextResponse.json({ error: signUpError?.message ?? 'Gagal membuat akun' }, { status: 500 })
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: user.id, phone, full_name, email, role: role ?? 'passenger', is_active: true,
    })
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Gagal membuat profile' }, { status: 500 })
    }

    if (role === 'driver') {
      await supabaseAdmin.from('driver_profiles').insert({ user_id: user.id })
    } else {
      await supabaseAdmin.from('passenger_profiles').insert({ user_id: user.id })
    }

    return NextResponse.json({ success: true, message: 'Akun berhasil dibuat', userId: user.id })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
