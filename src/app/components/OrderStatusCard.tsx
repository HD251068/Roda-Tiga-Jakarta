'use client'

import { useState, useEffect } from 'react'

export type OrderStatus =
  | 'idle' | 'scheduled' | 'searching' | 'driver_assigned'
  | 'driver_en_route' | 'cancel_locked' | 'driver_arrived'
  | 'no_show' | 'completed' | 'cancelled'

export interface OrderData {
  id: string
  status: OrderStatus
  isScheduled: boolean
  scheduledAt?: number
  pickup: string
  pickupLat: number
  pickupLng: number
  destination: string
  tarif: number
  distanceKm: number
  driverName?: string
  driverPhone?: string
  driverPlate?: string
  driverRating?: number
  createdAt: number
  enRouteAt?: number
  arrivedAt?: number
}

export const ORDER_KEY  = 'bajaj_active_order'
export const WALLET_KEY = 'bajaj_wallet'
export const CANCEL_MS  = 5  * 60 * 1000
export const NOSHOW_MS  = 30 * 60 * 1000

export const MOCK_DRIVERS = [
  { name: 'Budi Santoso', phone: '0812-3456-7890', plate: 'B 1234 XY', rating: 4.8 },
  { name: 'Suharto W.',   phone: '0856-7890-1234', plate: 'B 5678 AB', rating: 4.9 },
  { name: 'Agus Pradana', phone: '0878-9012-3456', plate: 'B 9012 CD', rating: 4.7 },
]

export function getBalance(): number {
  return JSON.parse(localStorage.getItem(WALLET_KEY) || '{"balance":150000}').balance
}

export function debitWallet(amount: number, reason: string) {
  const w = JSON.parse(localStorage.getItem(WALLET_KEY) || '{"balance":150000}')
  w.balance = Math.max(0, w.balance - amount)
  w.transactions = [...(w.transactions || []), { amount: -amount, reason, date: new Date().toISOString() }]
  localStorage.setItem(WALLET_KEY, JSON.stringify(w))
}

export function pushNotif(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

export function fmtMs(ms: number): string {
  if (ms <= 0) return '00:00'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const STEPS: { key: OrderStatus[]; label: string; icon: string }[] = [
  { key: ['searching'],                        label: 'Cari Driver',   icon: '🔍' },
  { key: ['driver_assigned'],                  label: 'Driver OK',     icon: '✅' },
  { key: ['driver_en_route', 'cancel_locked'], label: 'Menuju Lokasi', icon: '🚗' },
  { key: ['driver_arrived'],                   label: 'Driver Tiba',   icon: '📍' },
  { key: ['completed', 'no_show'],             label: 'Selesai',       icon: '🏁' },
]

const STATUS_LABELS: Partial<Record<OrderStatus, { text: string; color: string }>> = {
  scheduled:       { text: 'Terjadwal',             color: 'bg-blue-100 text-blue-700' },
  searching:       { text: 'Mencari Driver...',     color: 'bg-yellow-100 text-yellow-700' },
  driver_assigned: { text: 'Driver Ditemukan',      color: 'bg-green-100 text-green-700' },
  driver_en_route: { text: 'Driver Menuju Lokasi',  color: 'bg-orange-100 text-orange-700' },
  cancel_locked:   { text: 'Tidak Bisa Dibatalkan', color: 'bg-red-100 text-red-700' },
  driver_arrived:  { text: 'Driver Sudah Tiba!',    color: 'bg-green-100 text-green-800' },
  no_show:         { text: 'No-Show — Terdebit',    color: 'bg-red-100 text-red-800' },
  completed:       { text: 'Selesai',               color: 'bg-gray-100 text-gray-700' },
  cancelled:       { text: 'Dibatalkan',            color: 'bg-gray-100 text-gray-500' },
}

export default function OrderStatusCard({
  order,
  onCancel,
  onSimulateEnRoute,
  onSimulateArrived,
  onSimulateComplete,
}: {
  order: OrderData
  onCancel: () => void
  onSimulateEnRoute: () => void
  onSimulateArrived: () => void
  onSimulateComplete: () => void
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const cancelRemaining = order.enRouteAt ? Math.max(0, CANCEL_MS - (now - order.enRouteAt)) : null
  const noshowRemaining = order.arrivedAt  ? Math.max(0, NOSHOW_MS - (now - order.arrivedAt)) : null
  const stepIdx = STEPS.findIndex(s => s.key.includes(order.status))
  const canCancel = ['searching', 'driver_assigned', 'driver_en_route'].includes(order.status)
  const statusLabel = STATUS_LABELS[order.status]

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-3xl shadow-xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Order #{order.id.slice(-6).toUpperCase()}</p>
            {statusLabel && (
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${statusLabel.color}`}>
                {statusLabel.text}
              </span>
            )}
          </div>
          {order.isScheduled && order.scheduledAt && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Dijadwalkan</p>
              <p className="text-xs font-semibold text-blue-600">
                {new Date(order.scheduledAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex flex-col items-center flex-1 ${i <= stepIdx ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                  i < stepIdx   ? 'bg-green-500 text-white' :
                  i === stepIdx ? 'bg-orange-500 text-white ring-4 ring-orange-200' :
                  'bg-gray-200'
                }`}>{step.icon}</div>
                <p className="text-[9px] text-center text-gray-500 leading-tight">{step.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-5 mx-0.5 rounded ${i < stepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Route */}
        <div className="bg-gray-50 rounded-2xl p-3 space-y-2 mb-3">
          <div className="flex gap-2 items-start">
            <span className="text-green-500 font-bold text-sm mt-0.5">A</span>
            <p className="text-xs text-gray-700 flex-1">{order.pickup}</p>
          </div>
          <div className="w-px h-3 bg-gray-300 ml-2.5" />
          <div className="flex gap-2 items-start">
            <span className="text-red-500 font-bold text-sm mt-0.5">B</span>
            <p className="text-xs text-gray-700 flex-1">{order.destination}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Estimasi tarif</span>
          <span className="font-bold text-orange-600">Rp {order.tarif.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Driver Card */}
      {order.driverName && (
        <div className="bg-white rounded-3xl shadow p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">🚗</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{order.driverName}</p>
              <p className="text-xs text-gray-500">{order.driverPlate} · ⭐ {order.driverRating}</p>
            </div>
            <a href={`tel:${order.driverPhone}`}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white active:scale-95">
              📞
            </a>
          </div>
        </div>
      )}

      {/* Cancel window countdown */}
      {cancelRemaining !== null && cancelRemaining > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between">
          <p className="text-xs text-yellow-700 font-semibold">⏱ Batas batal pesanan</p>
          <span className="text-sm font-bold text-yellow-700 font-mono">{fmtMs(cancelRemaining)}</span>
        </div>
      )}

      {/* No-show countdown */}
      {noshowRemaining !== null && noshowRemaining > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-700 font-semibold">⚠️ Driver sudah di lokasi!</p>
            <p className="text-[10px] text-red-500">Auto-debit jika tidak muncul dalam:</p>
          </div>
          <span className="text-lg font-bold text-red-600 font-mono">{fmtMs(noshowRemaining)}</span>
        </div>
      )}

      {order.status === 'no_show' && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700">💳 Saldo didebet Rp {order.tarif.toLocaleString('id-ID')}</p>
          <p className="text-xs text-red-500 mt-1">Penumpang tidak muncul dalam 30 menit. Pesanan ditutup otomatis.</p>
        </div>
      )}

      <div className="flex gap-2">
        {canCancel && (
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-red-300 text-red-500 font-bold text-sm active:scale-95">
            Batalkan Pesanan
          </button>
        )}
        {['no_show', 'completed', 'cancelled'].includes(order.status) && (
          <button onClick={onSimulateComplete}
            className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm active:scale-95">
            Pesan Lagi
          </button>
        )}
      </div>

      {/* Demo controls */}
      {['driver_assigned', 'driver_en_route', 'cancel_locked'].includes(order.status) && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-3">
          <p className="text-[10px] text-gray-400 font-semibold mb-2 text-center">🔧 DEMO — Simulasi aksi driver</p>
          <div className="flex gap-2">
            {order.status === 'driver_assigned' && (
              <button onClick={onSimulateEnRoute}
                className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold active:scale-95">
                ▶ Driver Berangkat
              </button>
            )}
            {['driver_en_route', 'cancel_locked'].includes(order.status) && (
              <button onClick={onSimulateArrived}
                className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold active:scale-95">
                📍 Driver Tiba
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
