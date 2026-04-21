'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  slots_total: number
  slots_available: number
  address: string
}

export default function StationPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('*')
      .order('name')
    
    setStations(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">⏳ Memuat stasiun...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-700 text-white p-5">
        <h1 className="text-2xl font-bold text-center">🔋 Stasiun Charging</h1>
        <p className="text-center text-green-100 text-sm mt-1">Lokasi charging bajaj listrik</p>
      </div>

      {/* Map Preview */}
      <div className="h-48 bg-gray-300 flex items-center justify-center m-4 rounded-xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-600">Peta stasiun (integrasi Mapbox)</p>
        </div>
      </div>

      {/* Station List */}
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-bold px-2">📍 Daftar Stasiun Terdekat</h2>
        
        {stations.map((station) => (
          <div key={station.id} className="bg-white rounded-xl p-5 shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold">{station.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{station.address}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${station.slots_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {station.slots_available}
                </div>
                <div className="text-xs text-gray-500">slot tersisa</div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <button className="flex-1 bg-blue-600 text-white p-3 rounded-xl text-sm font-bold">
                📍 Navigasi
              </button>
              <button 
                disabled={station.slots_available === 0}
                className="flex-1 bg-green-600 text-white p-3 rounded-xl text-sm font-bold disabled:bg-gray-400"
              >
                {station.slots_available > 0 ? '🔋 Booking' : '⭕ Penuh'}
              </button>
            </div>
          </div>
        ))}

        {stations.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-3">📍</div>
            <p className="text-gray-500">Belum ada stasiun charging</p>
            <p className="text-sm text-gray-400 mt-2">Stasiun akan segera ditambahkan</p>
          </div>
        )}
      </div>
    </div>
  )
}
