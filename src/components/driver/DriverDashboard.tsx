'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase/client'
import { DriverProfile, TIER_CONFIG, SCORE_COMPONENTS } from '@/types'

// ── Types lokal ───────────────────────────────────────────────
interface ActiveRide {
  id: string
  passenger_id: string
  pickup_address?: string
  dropoff_address?: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  fare_amount: number
  total_amount: number
  commission_rate: number
  driver_earning: number
  status: string
  arrived_at?: string
  passenger_boarded_at?: string
  created_at: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// ── Format helpers ────────────────────────────────────────────
const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`
const pct = (n: number) => `${Math.round(n)}%`

export default function DriverDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [waitingRides, setWaitingRides] = useState<ActiveRide[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'home' | 'score' | 'wallet' | 'notif'>('home')
  const [accepting, setAccepting] = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)

  // ── Redirect jika belum login ─────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/driver/login')
  }, [status, router])

  // ── Load data driver ──────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!session?.user) return
    const userId = (session?.user as any)?.id

    const { data } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) setProfile(data as DriverProfile)
    setLoading(false)
  }, [session])

  // ── Load order yang menunggu ──────────────────────────────
  const loadWaitingRides = useCallback(async () => {
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(5)

    if (data) setWaitingRides(data as ActiveRide[])
  }, [])

  // ── Load active ride milik driver ini ─────────────────────
  const loadActiveRide = useCallback(async () => {
    if (!session?.user) return
    const userId = (session?.user as any)?.id

    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', userId)
      .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) setActiveRide(data as ActiveRide)
    else setActiveRide(null)
  }, [session])

  // ── Load notifikasi ───────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!session?.user) return
    const userId = (session?.user as any)?.id

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotifications(data as Notification[])
  }, [session])

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile()
      loadWaitingRides()
      loadActiveRide()
      loadNotifications()
    }
  }, [status, loadProfile, loadWaitingRides, loadActiveRide, loadNotifications])

  // ── Realtime: order baru masuk ────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('waiting-rides')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
        filter: 'status=eq.waiting',
      }, () => {
        loadWaitingRides()
        // Bunyi notifikasi
        try { new Audio('/audio/new-order.mp3').play() } catch {}
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadWaitingRides])

  // ── Toggle online/offline ─────────────────────────────────
  const toggleOnline = async () => {
    if (!profile) return
    setTogglingOnline(true)
    await supabase
      .from('driver_profiles')
      .update({ is_online: !profile.is_online })
      .eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, is_online: !prev.is_online } : null)
    setTogglingOnline(false)
  }

  // ── Terima order ──────────────────────────────────────────
  const acceptRide = async (rideId: string) => {
    setAccepting(true)
    try {
      const res = await fetch('/api/driver/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId }),
      })
      const data = await res.json()
      if (data.success) {
        await loadActiveRide()
        await loadWaitingRides()
      } else {
        alert(data.error ?? 'Gagal mengambil order')
      }
    } finally {
      setAccepting(false)
    }
  }

  // ── Update status ride ────────────────────────────────────
  const updateRideStatus = async (rideId: string, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus }
    const now = new Date().toISOString()
    if (newStatus === 'en_route')    updates.en_route_at = now
    if (newStatus === 'arrived')     updates.arrived_at = now
    if (newStatus === 'in_progress') updates.passenger_boarded_at = now

    if (newStatus === 'completed') {
      const driverOntime   = activeRide?.arrived_at ? true : false
      const passengerReady = activeRide?.passenger_boarded_at
        ? (new Date(now).getTime() - new Date(activeRide.passenger_boarded_at).getTime()) < 120000
        : false

      await fetch('/api/driver/complete-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          driverWasOntime:   driverOntime,
          passengerWasReady: passengerReady,
        }),
      })
      setActiveRide(null)
      await loadProfile()
      await loadNotifications()
      return
    }

    await supabase.from('rides').update(updates).eq('id', rideId)
    await loadActiveRide()
  }

  // ── Mark notif as read ────────────────────────────────────
  const markAllRead = async () => {
    if (!session?.user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', (session.user as any).id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛺</div>
          <p className="text-gray-500 animate-pulse">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Profile tidak ditemukan</h2>
          <p className="text-gray-500 text-sm">Hubungi admin untuk mendaftarkan akun driver Anda.</p>
        </div>
      </div>
    )
  }

  const tier = TIER_CONFIG[profile.tier]
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-100 pb-24">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {session?.user?.name?.split(' ')[0] ?? 'Driver'} 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.color }}
              >
                {tier.label}
              </span>
              <span className="text-xs text-gray-500">
                Skor {Math.round(profile.score_total)}/1000
              </span>
            </div>
          </div>

          {/* Toggle Online */}
          <button
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
              profile.is_online
                ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            {profile.is_online ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl py-2">
            <div className="text-lg font-bold text-gray-800">{profile.total_trips}</div>
            <div className="text-xs text-gray-500">Trip</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-2">
            <div className="text-lg font-bold text-orange-600">{profile.avg_rating.toFixed(1)} ⭐</div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-2">
            <div className="text-lg font-bold text-green-600">{profile.streak_perfect_trips}</div>
            <div className="text-xs text-gray-500">Streak 🔥</div>
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────── */}

      {/* HOME TAB */}
      {tab === 'home' && (
        <div className="p-4 space-y-4">

          {/* Wallet card */}
          <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-5">
            <div className="text-sm opacity-80 mb-1">Saldo Wallet</div>
            <div className="text-3xl font-bold mb-3">{fmt(profile.wallet_balance)}</div>
            <div className="flex justify-between text-sm">
              <div>
                <div className="opacity-70">Total Penghasilan</div>
                <div className="font-semibold">{fmt(profile.total_earnings)}</div>
              </div>
              <div className="text-right">
                <div className="opacity-70">Komisi Saat Ini</div>
                <div className="font-semibold">{pct(profile.commission_rate * 100)}</div>
              </div>
            </div>
          </div>

          {/* Active ride */}
          {activeRide && (
            <div className="bg-white rounded-2xl p-4 border-2 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-500 text-lg">🛺</span>
                <span className="font-bold text-orange-600">Trip Aktif</span>
                <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  {activeRide.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                📍 {activeRide.pickup_address ?? `${activeRide.pickup_lat.toFixed(4)}, ${activeRide.pickup_lng.toFixed(4)}`}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                🏁 {activeRide.dropoff_address ?? `${activeRide.dropoff_lat.toFixed(4)}, ${activeRide.dropoff_lng.toFixed(4)}`}
              </div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs text-gray-500">Pendapatan Anda</div>
                  <div className="text-xl font-bold text-green-600">{fmt(activeRide.driver_earning)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Tarif Total</div>
                  <div className="font-semibold">{fmt(activeRide.total_amount)}</div>
                </div>
              </div>

              {/* Action buttons berdasarkan status */}
              <div className="grid grid-cols-1 gap-2">
                {activeRide.status === 'accepted' && (
                  <button
                    onClick={() => updateRideStatus(activeRide.id, 'en_route')}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold"
                  >
                    🚗 Menuju Lokasi Jemput
                  </button>
                )}
                {activeRide.status === 'en_route' && (
                  <button
                    onClick={() => updateRideStatus(activeRide.id, 'arrived')}
                    className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold"
                  >
                    📍 Sudah Tiba di Lokasi
                  </button>
                )}
                {activeRide.status === 'arrived' && (
                  <button
                    onClick={() => updateRideStatus(activeRide.id, 'in_progress')}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold"
                  >
                    ✅ Penumpang Naik
                  </button>
                )}
                {activeRide.status === 'in_progress' && (
                  <button
                    onClick={() => updateRideStatus(activeRide.id, 'completed')}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold"
                  >
                    🏁 Selesaikan Perjalanan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Order masuk */}
          {!activeRide && profile.is_online && (
            <div>
              <h2 className="font-bold text-gray-700 mb-2 px-1">
                Order Masuk {waitingRides.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {waitingRides.length}
                  </span>
                )}
              </h2>
              {waitingRides.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-2">🕐</div>
                  <p className="text-gray-400">Menunggu order masuk...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitingRides.map(ride => (
                    <div key={ride.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">
                            📍 {ride.pickup_address ?? 'Lokasi jemput'}
                          </div>
                          <div className="text-sm text-gray-600">
                            🏁 {ride.dropoff_address ?? 'Tujuan'}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-lg font-bold text-green-600">
                            {fmt(ride.driver_earning || ride.total_amount * (1 - profile.commission_rate))}
                          </div>
                          <div className="text-xs text-gray-400">{fmt(ride.total_amount)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptRide(ride.id)}
                        disabled={accepting}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {accepting ? '⏳ Memproses...' : '✅ Ambil Order'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!activeRide && !profile.is_online && (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-5xl mb-3">💤</div>
              <p className="font-bold text-gray-700 mb-1">Anda sedang Offline</p>
              <p className="text-gray-400 text-sm">Aktifkan Online untuk menerima order</p>
            </div>
          )}
        </div>
      )}

      {/* SCORE TAB */}
      {tab === 'score' && (
        <div className="p-4 space-y-4">
          {/* Total score */}
          <div
            className="rounded-2xl p-6 text-white text-center"
            style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}99)` }}
          >
            <div className="text-6xl font-bold mb-1">{Math.round(profile.score_total)}</div>
            <div className="text-sm opacity-80 mb-3">dari 1000 poin</div>
            <div className="text-xl font-bold">{tier.label}</div>
            {profile.tier !== 'platinum' && (
              <div className="text-xs opacity-70 mt-1">
                {Math.round(Object.values(TIER_CONFIG).find(t => t.minScore > profile.score_total)?.minScore ?? 1000) - Math.round(profile.score_total)} poin lagi ke tier berikutnya
              </div>
            )}
          </div>

          {/* Progress bar total */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Progress Keseluruhan</span>
              <span className="font-bold" style={{ color: tier.color }}>{Math.round(profile.score_total / 10)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${profile.score_total / 10}%`, backgroundColor: tier.color }}
              />
            </div>
          </div>

          {/* 5 komponen skor — transparan */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-gray-700 mb-4">Breakdown Skor Anda</h3>
            <div className="space-y-4">
              {SCORE_COMPONENTS.map(comp => {
                const value = profile[comp.key as keyof DriverProfile] as number ?? 0
                const weighted = value * comp.weight
                return (
                  <div key={comp.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{comp.label}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-800">{Math.round(value)}</span>
                        <span className="text-gray-400 text-xs"> × {pct(comp.weight * 100)} = </span>
                        <span className="font-bold text-green-600">{weighted.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          backgroundColor: value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#dc2626'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Badge */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-gray-700 mb-3">Badge</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl text-center border-2 ${profile.badge_professional ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 opacity-40'}`}>
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-xs font-bold">Profesional</div>
                <div className="text-xs text-gray-500">10 trip sempurna</div>
              </div>
              <div className={`p-3 rounded-xl text-center border-2 ${profile.badge_excellent ? 'border-purple-400 bg-purple-50' : 'border-gray-100 opacity-40'}`}>
                <div className="text-2xl mb-1">💎</div>
                <div className="text-xs font-bold">Excellent</div>
                <div className="text-xs text-gray-500">50 trip sempurna</div>
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-700">Streak Trip Sempurna 🔥</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Driver ontime + penumpang langsung naik
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-500">{profile.streak_perfect_trips}</div>
                <div className="text-xs text-gray-400">Rekor: {profile.streak_best}</div>
              </div>
            </div>
          </div>

          {/* Reward info */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <h3 className="font-bold text-green-800 mb-2">💡 Cara Tingkatkan Penghasilan</h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <span>✅</span>
                <span>Tiba tepat waktu → Bonus <strong>1% dari tarif</strong> masuk wallet langsung</span>
              </div>
              <div className="flex items-start gap-2">
                <span>✅</span>
                <span>Penumpang langsung naik → Cashback <strong>2%</strong> untuk penumpang, trip makin banyak</span>
              </div>
              <div className="flex items-start gap-2">
                <span>✅</span>
                <span>Keduanya sempurna → Streak naik, menuju Badge Profesional</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALLET TAB */}
      {tab === 'wallet' && (
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-6 text-center">
            <div className="text-sm opacity-80 mb-1">Saldo Wallet</div>
            <div className="text-4xl font-bold">{fmt(profile.wallet_balance)}</div>
            <div className="text-sm opacity-70 mt-2">Total Penghasilan: {fmt(profile.total_earnings)}</div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-gray-700 mb-3">Info Komisi</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-600">Tier saat ini</span>
                <span className="font-bold" style={{ color: tier.color }}>{tier.label}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-600">Komisi platform</span>
                <span className="font-bold">{pct(profile.commission_rate * 100)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-600">Bagian Anda</span>
                <span className="font-bold text-green-600">{pct((1 - profile.commission_rate) * 100)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Bonus ontime (per trip)</span>
                <span className="font-bold text-orange-500">+1% tarif</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            <strong>Naik ke tier Platinum</strong> → komisi turun ke 8%, Anda bawa pulang 92% dari setiap tarif.
          </div>
        </div>
      )}

      {/* NOTIFIKASI TAB */}
      {tab === 'notif' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-700">Notifikasi</h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 font-medium">
                Tandai semua dibaca
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-gray-400">Belum ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`rounded-2xl p-4 ${notif.is_read ? 'bg-white' : 'bg-blue-50 border border-blue-100'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {notif.type === 'reward' ? '🎁' :
                       notif.type === 'tier_change' ? '🏆' :
                       notif.type === 'dispute' ? '⚖️' : '🔔'}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800">{notif.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{notif.body}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM NAV ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 grid grid-cols-4 gap-1">
        {[
          { key: 'home',   icon: '🏠', label: 'Home' },
          { key: 'score',  icon: '📊', label: 'Skor' },
          { key: 'wallet', icon: '💰', label: 'Wallet' },
          { key: 'notif',  icon: '🔔', label: 'Notif', badge: unreadCount },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as any)}
            className={`flex flex-col items-center py-2 rounded-xl transition-all relative ${
              tab === item.key ? 'bg-green-50' : ''
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs mt-0.5 font-medium ${tab === item.key ? 'text-green-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
            {item.badge ? (
              <span className="absolute top-1 right-3 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
