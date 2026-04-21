'use client'

import { useState } from 'react'
import FareDisplay from '@/components/common/FareDisplay'
import TipSelector from '@/components/common/TipSelector'

interface OrderFormProps {
  pickup: any
  destination: any
  onNext: (step: string) => void
}

export default function OrderForm({ pickup, destination, onNext }: OrderFormProps) {
  const [fareData, setFareData] = useState(null)
  const [tipAmount, setTipAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  const calculateFare = async () => {
    if (!pickup || !destination) {
      alert('Silakan pilih lokasi jemput dan tujuan terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/calculate-fare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: destination.lat,
          dropoff_lng: destination.lng
        })
      })
      
      const data = await response.json()
      setFareData(data)
    } catch (error) {
      console.error('Error calculating fare:', error)
      alert('Gagal menghitung tarif. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async () => {
    if (!fareData) return

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
    
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl
    }
  }

  return (
    <div className="space-y-4">
      {/* Pilih Lokasi */}
      <div className="space-y-3">
        <button 
          onClick={() => onNext('pickup')}
          className="w-full bg-blue-500 text-white p-5 rounded-xl text-left text-lg font-semibold"
        >
          📍 {pickup ? 'Lokasi jemput dipilih' : 'Pilih lokasi jemput'}
        </button>
        
        <button 
          onClick={() => onNext('destination')}
          className="w-full bg-blue-500 text-white p-5 rounded-xl text-left text-lg font-semibold"
        >
          🎯 {destination ? 'Tujuan dipilih' : 'Pilih tujuan'}
        </button>
      </div>

      {/* Hitung Tarif */}
      {pickup && destination && !fareData && (
        <button 
          onClick={calculateFare}
          disabled={loading}
          className="w-full bg-yellow-500 text-white p-5 rounded-xl text-xl font-bold"
        >
          {loading ? 'Menghitung...' : '🧮 Hitung Tarif'}
        </button>
      )}

      {/* Hasil Tarif */}
      {fareData && (
        <>
          <FareDisplay fareData={fareData} />
          
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
            <div className="text-xs text-gray-600 mt-1">
              Termasuk tip untuk driver
            </div>
          </div>

          <button 
            onClick={createOrder}
            className="w-full bg-green-700 text-white p-6 rounded-xl text-2xl font-bold shadow-lg"
          >
            🚖 PESAN SEKARANG
          </button>
        </>
      )}
    </div>
  )
}
