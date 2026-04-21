'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const rideId = params.rideId as string
  const [ride, setRide] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchRideDetails()
  }, [rideId])

  const fetchRideDetails = async () => {
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()
    
    setRide(data)
    setLoading(false)
  }

  const createPayment = async () => {
    setLoading(true)
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId })
    })
    
    const result = await response.json()
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl
    } else {
      alert('Gagal membuat pembayaran')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">⏳ Memuat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-2xl font-bold">Pembayaran</h1>
          <p className="text-gray-500">Selesaikan pembayaran Anda</p>
        </div>

        <div className="bg-gray-100 p-4 rounded-xl mb-6">
          <div className="flex justify-between mb-2">
            <span>Tarif:</span>
            <span className="font-bold">Rp {ride?.fare_amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Tip Driver:</span>
            <span className="font-bold text-orange-600">+ Rp {ride?.tip_amount?.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-green-700">Rp {ride?.total_amount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={createPayment}
          disabled={loading}
          className="w-full bg-green-600 text-white p-5 rounded-xl text-xl font-bold mb-3 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : '💰 Bayar Sekarang'}
        </button>

        <button
          onClick={() => router.push('/passenger')}
          className="w-full bg-gray-300 text-gray-700 p-4 rounded-xl text-lg font-bold"
        >
          Kembali
        </button>
      </div>
    </div>
  )
}
