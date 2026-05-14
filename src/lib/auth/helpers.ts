import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Profile, DriverProfile, PassengerProfile } from '@/types'
import { NextResponse } from 'next/server'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  if (!session?.user) return null
  return (session.user as any).id ?? null
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession()
  const userId = (session?.user as any)?.id
  if (!userId) return null
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data as Profile | null
}

export async function getDriverProfile(userId: string): Promise<DriverProfile | null> {
  const { data } = await supabaseAdmin
    .from('driver_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as DriverProfile | null
}

export async function getPassengerProfile(userId: string): Promise<PassengerProfile | null> {
  const { data } = await supabaseAdmin
    .from('passenger_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as PassengerProfile | null
}

export async function requireAuth() {
  const session = await getSession()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, error: null }
}

export async function requireDriver() {
  const { session, error } = await requireAuth()
  if (error || !session) return { session: null, profile: null, driverProfile: null, error: error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const profile = await getProfile()
  if (!profile || profile.role !== 'driver') {
    return { session: null, profile: null, driverProfile: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const driverProfile = await getDriverProfile(profile.id)
  if (!driverProfile) {
    return { session: null, profile: null, driverProfile: null, error: NextResponse.json({ error: 'Driver profile tidak ditemukan' }, { status: 404 }) }
  }

  return { session, profile, driverProfile, error: null }
}

export async function ensureProfile(userId: string, userData: {
  email?: string; full_name?: string; phone?: string; role?: 'passenger' | 'driver'
}): Promise<Profile | null> {
  const { data: existing } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (existing) return existing as Profile

  const { data, error } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    phone: userData.phone ?? '',
    full_name: userData.full_name ?? '',
    role: userData.role ?? 'passenger',
  }).select().single()

  if (error || !data) return null

  if (userData.role === 'driver') {
    await supabaseAdmin.from('driver_profiles').insert({ user_id: userId })
  } else {
    await supabaseAdmin.from('passenger_profiles').insert({ user_id: userId })
  }

  return data as Profile
}
