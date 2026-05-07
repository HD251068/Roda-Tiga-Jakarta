'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MapView from '@/components/common/MapView'
import FareDisplay from '@/components/common/FareDisplay'
import TipSelector from '@/components/common/TipSelector'
import { calculateFare as calcFare } from "@/lib/utils/distanceCalculator"

export default function OrderPage() {
  const router = useRouter()
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [step, setStep] = useState<'pickup' | 'destination' | 'fare'>('pickup')
  const [fareData, setFareData] = useState<{ fare: number; range_name: string; min_km: number; max_km: number; distance: number } | null>(null)
  const [tipAmount, setTipAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  const calculateFare = () => {
    if (!pickup || !destination) return
    
    // Hitung jarak (mock - seharusnya panggil API)
    const distance = 5.2 // mock distance
    const fareResult = calcFare(distance)
    
    setFareData({
      fare: fareResult.fare,
      range_name: fareResult.range,
      min_km: 0,
      max_km: 0,
      distance: distance
    })
    setStep('fare')
  }

  const createOrder = async () => {
    if (!fareData) return
    
    setLoading(true)
    const totalAmount = fareData.fare + tipAmount
    
    const response = await fetch('/api/create-ride', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup,
        destination,
        fare: fareData.fare,
        tip: tipAmount,
        total: totalAmount,
        distance: fareData.distance
      })
    })

    const result = await response.json()
    setLoading(false)
    
    if (result.rideId) {
      router.push(`/passenger/payment/${result.rideId}`)
    } else {
      alert('Gagal membuat pesanan')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-700 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => window.history.back()} className="text-2xl mr-4">←</button>
          <h1 className="text-xl font-bold">Pesan Bajaj</h1>
        </div>
      </div>

      {/* Map */}
      <div className="h-80 relative">
        <MapView 
          pickup={pickup}
          destination={destination}
          onPickupSelect={step === 'pickup' ? setPickup : undefined}
          onDestinationSelect={step === 'destination' ? setDestination : undefined}
        />
      </div>

      {/* Form */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-20 p-6">
        {step === 'pickup' && (
          <div className="text-center">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="text-xl font-bold mb-2">Pilih Lokasi Jemput</h2>
            <p className="text-gray-500 mb-4">Klik di peta untuk memilih lokasi jemput Anda</p>
            {pickup && (
              <button 
                onClick={() => setStep('destination')}
                className="w-full bg-green-600 text-white p-4 rounded-xl text-lg font-bold"
              >
                Lanjut ke Tujuan →
              </button>
            )}
          </div>
        )}

        {step === 'destination' && (
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold mb-2">Pilih Tujuan</h2>
            <p className="text-gray-500 mb-4">Klik di peta untuk memilih tujuan Anda</p>
            {destination && (
              <button 
                onClick={calculateFare}
                className="w-full bg-yellow-500 text-white p-4 rounded-xl text-lg font-bold"
              >
                Hitung Tarif →
              </button>
            )}
          </div>
        )}

        {step === 'fare' && fareData && (
          <div className="space-y-4">
            <FareDisplay
              fareData={fareData}
            />
            
            <TipSelector 
              onTipSelect={setTipAmount}
              selectedTip={tipAmount}
            />
            
            <div className="bg-orange-100 p-4 rounded-xl">
              <div className="flex justify-between text-xl font-bold">
                <span>💰 Total Bayar:</span>
                <span className="text-orange-700">
                  Rp {(fareData.fare + tipAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              onClick={createOrder}
              disabled={loading}
              className="w-full bg-green-700 text-white p-5 rounded-xl text-2xl font-bold shadow-lg disabled:opacity-50"
            >
              {loading ? 'Memproses...' : '🚖 PESAN SEKARANG'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
