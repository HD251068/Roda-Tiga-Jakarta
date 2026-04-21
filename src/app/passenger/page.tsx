'use client'

import { useState, useEffect } from 'react'
import MapView from '@/components/common/MapView'
import OrderForm from '@/components/passenger/OrderForm'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function PassengerPage() {
  const [step, setStep] = useState<'pickup' | 'destination' | 'order'>('pickup')
  const [pickupLocation, setPickupLocation] = useState(null)
  const [destinationLocation, setDestinationLocation] = useState(null)
  const { location, error } = useGeolocation()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-700 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold">Pesan Bajaj</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Map View */}
      <div className="h-64 relative">
        <MapView 
          pickup={pickupLocation}
          destination={destinationLocation}
          onPickupSelect={setPickupLocation}
          onDestinationSelect={setDestinationLocation}
        />
      </div>

      {/* Order Form */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-20 p-6">
        <OrderForm 
          pickup={pickupLocation}
          destination={destinationLocation}
          onNext={setStep}
        />
      </div>

      {/* Informasi Tarif Cepat */}
      <div className="fixed bottom-4 left-4 right-4 bg-gray-900 text-white p-3 rounded-xl text-center text-sm">
        💰 Tarif: 0-4km=Rp15.000 | 4-8km=Rp25.000 | 8-15km=Rp50.000
      </div>
    </div>
  )
}
