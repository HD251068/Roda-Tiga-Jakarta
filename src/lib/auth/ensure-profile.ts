import { supabaseAdmin } from '@/lib/supabase/admin'
import { Profile } from '@/types'

export async function ensureProfile(userId: string, userData: {
  email?: string; full_name?: string; phone?: string; role?: 'passenger' | 'driver'
}): Promise<Profile | null> {
  const { data: existing } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (existing) return existing as Profile

  const { data, error } = await supabaseAdmin.from('profiles').insert({
    id: userId, phone: userData.phone ?? '', full_name: userData.full_name ?? '',
    email: userData.email, role: userData.role ?? 'passenger', is_active: true,
  }).select().single()

  if (error || !data) return null

  if (userData.role === 'driver') {
    await supabaseAdmin.from('driver_profiles').insert({ user_id: userId })
  } else {
    await supabaseAdmin.from('passenger_profiles').insert({ user_id: userId })
  }

  return data as Profile
}
