#!/bin/bash
# ============================================================
#  RODA TIGA JAKARTA — Patch Script
#  Auth & Session + Types + Supabase Clients
#
#  Cara pakai:
#  1. Taruh file ini di ROOT folder project
#  2. Jalankan di Git Bash: bash patch.sh
#  3. Semua file langsung terbuat di path yang benar
# ============================================================

set -e  # stop jika ada error

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/src"

echo "=================================================="
echo " Roda Tiga Jakarta — Patching Auth & Session"
echo " Root: $ROOT"
echo "=================================================="

# ── Buat semua direktori yang dibutuhkan ─────────────────────
mkdir -p "$SRC/types"
mkdir -p "$SRC/lib/supabase"
mkdir -p "$SRC/lib/auth"
mkdir -p "$SRC/app/api/auth/[...nextauth]"
mkdir -p "$SRC/app/api/auth/register"
mkdir -p "$SRC/app/api/auth/me"
mkdir -p "$SRC/app/api/create-ride"
mkdir -p "$SRC/app/api/driver/accept-ride"
mkdir -p "$SRC/app/api/driver/complete-ride"

echo "✓ Direktori siap"

# ============================================================
#  1. TYPES
# ============================================================
cat > "$SRC/types/index.ts" << 'ENDOFFILE'
export type UserRole = 'passenger' | 'driver' | 'admin'
export type DriverTier = 'probation' | 'silver' | 'gold' | 'platinum'
export type RideStatus = 'waiting' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed'
export type DisputeStatus = 'open' | 'investigating' | 'resolved_driver' | 'resolved_passenger' | 'inconclusive'

export interface Profile {
  id: string
  phone: string
  full_name: string
  email?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  user_id: string
  vehicle_type: string
  vehicle_brand?: string
  vehicle_plate?: string
  vehicle_year?: number
  battery_capacity_kwh?: number
  wallet_balance: number
  total_earnings: number
  commission_rate: number
  tier: DriverTier
  score_total: number
  score_rating: number
  score_acceptance: number
  score_punctuality: number
  score_cancellation: number
  score_complaints: number
  total_trips: number
  avg_rating: number
  acceptance_rate: number
  ontime_rate: number
  cancel_rate: number
  streak_perfect_trips: number
  streak_best: number
  badge_professional: boolean
  badge_excellent: boolean
  accountability_score: number
  is_online: boolean
  current_lat?: number
  current_lng?: number
  last_location_at?: string
  created_at: string
  updated_at: string
}

export interface PassengerProfile {
  id: string
  user_id: string
  wallet_balance: number
  reliability_score: number
  total_rides: number
  late_cancel_count: number
  noshow_count: number
  avg_wait_time_sec: number
  badge_trusted: boolean
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id?: string
  passenger_phone?: string
  driver_phone?: string
  pickup_lat: number
  pickup_lng: number
  pickup_address?: string
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address?: string
  distance_km: number
  fare_amount: number
  tip_amount: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  driver_earning: number
  driver_bonus: number
  passenger_cashback: number
  status: RideStatus
  payment_status: PaymentStatus
  payment_method?: string
  driver_was_ontime: boolean
  passenger_was_ready: boolean
  both_perfect: boolean
  cancel_fee_charged: number
  cancel_reason?: string
  cancelled_by?: string
  passenger_rating?: number
  driver_rating?: number
  created_at: string
  accepted_at?: string
  en_route_at?: string
  arrived_at?: string
  passenger_boarded_at?: string
  completed_at?: string
  wait_time_sec?: number
}

export interface SessionUser {
  id: string
  email?: string
  name?: string
  role: UserRole
}

export const TIER_CONFIG: Record<DriverTier, {
  label: string
  minScore: number
  commissionRate: number
  color: string
}> = {
  platinum: { label: 'Platinum',  minScore: 900, commissionRate: 0.08, color: '#7C3AED' },
  gold:     { label: 'Gold',      minScore: 750, commissionRate: 0.09, color: '#D97706' },
  silver:   { label: 'Silver',    minScore: 600, commissionRate: 0.10, color: '#6B7280' },
  probation:{ label: 'Probation', minScore: 0,   commissionRate: 0.10, color: '#DC2626' },
}

export const SCORE_COMPONENTS = [
  { key: 'score_rating',       label: 'Rating Penumpang',   weight: 0.30 },
  { key: 'score_acceptance',   label: 'Acceptance Rate',    weight: 0.20 },
  { key: 'score_punctuality',  label: 'Ketepatan Pickup',   weight: 0.20 },
  { key: 'score_cancellation', label: 'Tingkat Pembatalan', weight: 0.15 },
  { key: 'score_complaints',   label: 'Keluhan Valid',      weight: 0.15 },
] as const
ENDOFFILE
echo "✓ types/index.ts"

# ============================================================
#  2. SUPABASE CLIENTS
# ============================================================
cat > "$SRC/lib/supabase/admin.ts" << 'ENDOFFILE'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
ENDOFFILE
echo "✓ lib/supabase/admin.ts"

cat > "$SRC/lib/supabase/browser.ts" << 'ENDOFFILE'
import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
ENDOFFILE
echo "✓ lib/supabase/browser.ts"

cat > "$SRC/lib/supabase/server.ts" << 'ENDOFFILE'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createSupabaseServer = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
ENDOFFILE
echo "✓ lib/supabase/server.ts"

# ============================================================
#  3. AUTH OPTIONS
# ============================================================
cat > "$SRC/lib/auth/options.ts" << 'ENDOFFILE'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureProfile } from '@/lib/auth/helpers'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone:    { label: 'Phone',    type: 'text' },
        role:     { label: 'Role',     type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: { user }, error } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        if (error || !user) return null

        const profile = await ensureProfile(user.id, {
          email:     user.email,
          full_name: user.user_metadata?.full_name ?? credentials.email,
          phone:     credentials.phone ?? user.user_metadata?.phone ?? '',
          role:      (credentials.role as 'passenger' | 'driver') ?? 'passenger',
        })
        if (!profile) return null

        return {
          id:    user.id,
          email: user.email ?? '',
          name:  profile.full_name,
          role:  profile.role,
          phone: profile.phone,
        }
      }
    })
  ],
  pages: { signIn: '/', error: '/' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id
        token.role  = (user as any).role
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id    = token.sub
        ;(session.user as any).role  = token.role
        ;(session.user as any).phone = token.phone
      }
      return session
    }
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
ENDOFFILE
echo "✓ lib/auth/options.ts"

# ============================================================
#  4. AUTH HELPERS
# ============================================================
cat > "$SRC/lib/auth/helpers.ts" << 'ENDOFFILE'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Profile, DriverProfile, PassengerProfile } from '@/types'
import { NextResponse } from 'next/server'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession()
  if (!session?.user?.id) return null
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', (session.user as any).id).single()
  return data as Profile | null
}

export async function getDriverProfile(userId: string): Promise<DriverProfile | null> {
  const { data } = await supabaseAdmin.from('driver_profiles').select('*').eq('user_id', userId).single()
  return data as DriverProfile | null
}

export async function getPassengerProfile(userId: string): Promise<PassengerProfile | null> {
  const { data } = await supabaseAdmin.from('passenger_profiles').select('*').eq('user_id', userId).single()
  return data as PassengerProfile | null
}

export async function requireAuth() {
  const session = await getSession()
  if (!(session?.user as any)?.id) {
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
ENDOFFILE
echo "✓ lib/auth/helpers.ts"

# ============================================================
#  5. API ROUTES
# ============================================================
cat > "$SRC/app/api/auth/[...nextauth]/route.ts" << 'ENDOFFILE'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/options'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
ENDOFFILE
echo "✓ api/auth/[...nextauth]/route.ts"

cat > "$SRC/app/api/auth/register/route.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "✓ api/auth/register/route.ts"

cat > "$SRC/app/api/auth/me/route.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "✓ api/auth/me/route.ts"

cat > "$SRC/app/api/create-ride/route.ts" << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError || !session) return authError!

    const { pickup, destination, fare, tip, total, distance } = await request.json()
    if (!pickup || !destination)
      return NextResponse.json({ error: 'Lokasi jemput dan tujuan harus diisi' }, { status: 400 })

    const commissionRate   = 0.10
    const commissionAmount = Math.round(total * commissionRate)
    const driverEarning    = total - commissionAmount

    const { data: ride, error } = await supabaseAdmin.from('rides').insert({
      passenger_id:      (session.user as any).id,
      pickup_lat:        pickup.lat,
      pickup_lng:        pickup.lng,
      pickup_address:    pickup.address ?? null,
      dropoff_lat:       destination.lat,
      dropoff_lng:       destination.lng,
      dropoff_address:   destination.address ?? null,
      distance_km:       distance,
      fare_amount:       fare,
      tip_amount:        tip ?? 0,
      total_amount:      total,
      commission_rate:   commissionRate,
      commission_amount: commissionAmount,
      driver_earning:    driverEarning,
      status:            'waiting',
      payment_status:    'unpaid',
      created_at:        new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 })
    return NextResponse.json({ success: true, rideId: ride.id, message: 'Pesanan berhasil dibuat' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
ENDOFFILE
echo "✓ api/create-ride/route.ts"

cat > "$SRC/app/api/driver/accept-ride/route.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "✓ api/driver/accept-ride/route.ts"

cat > "$SRC/app/api/driver/complete-ride/route.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "✓ api/driver/complete-ride/route.ts"

# ============================================================
#  6. ENV CHECK
# ============================================================
echo ""
echo "=================================================="
echo " Checking .env.local..."
echo "=================================================="

if [ -f "$ROOT/.env.local" ]; then
  if grep -q "NEXTAUTH_SECRET" "$ROOT/.env.local"; then
    echo "✓ NEXTAUTH_SECRET sudah ada"
  else
    echo "" >> "$ROOT/.env.local"
    echo "# NextAuth" >> "$ROOT/.env.local"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'ganti-dengan-random-string-32-karakter')" >> "$ROOT/.env.local"
    echo "NEXTAUTH_URL=http://localhost:3000" >> "$ROOT/.env.local"
    echo "✓ NEXTAUTH_SECRET ditambahkan ke .env.local"
  fi
else
  echo "⚠ .env.local tidak ditemukan — buat manual"
fi

echo ""
echo "=================================================="
echo " PATCH SELESAI"
echo ""
echo " File yang dibuat/diupdate:"
echo "  src/types/index.ts"
echo "  src/lib/supabase/admin.ts"
echo "  src/lib/supabase/browser.ts"
echo "  src/lib/supabase/server.ts"
echo "  src/lib/auth/options.ts"
echo "  src/lib/auth/helpers.ts"
echo "  src/app/api/auth/[...nextauth]/route.ts"
echo "  src/app/api/auth/register/route.ts"
echo "  src/app/api/auth/me/route.ts"
echo "  src/app/api/create-ride/route.ts"
echo "  src/app/api/driver/accept-ride/route.ts"
echo "  src/app/api/driver/complete-ride/route.ts"
echo ""
echo " Langkah berikutnya:"
echo "  1. cd ke folder project"
echo "  2. npm install (jika belum)"
echo "  3. npm run dev"
echo "=================================================="
