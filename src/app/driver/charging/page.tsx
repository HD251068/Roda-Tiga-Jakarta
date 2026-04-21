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

export default function ChargingPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

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

  const bookStation = async (station: Station) => {
    if (station.slots_available === 0) {
      alert('Maaf, stasiun ini sedang penuh')
      return
    }

    const { error } = await supabase
      .from('charging_bookings')
      .insert({
        station_id: station.id,
        driver_id: 'mock-driver-id',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString()
      })

    if (!error) {
      // Update slots available
      await supabase
        .from('stations')
        .update({ slots_available: station.slots_available - 1 })
        .eq('id', station.id)
      
      alert('Slot berhasil dipesan!')
      fetchStations()
      setSelectedStation(null)
    } else {
      alert('Gagal memesan slot')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">⏳ Memuat stasiun...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl p-5 mb-4">
        <h1 className="text-2xl font-bold text-center">🔋 Stasiun Charging Bajaj</h1>
        <p className="text-center text-gray-500 mt-1">Pilih stasiun terdekat</p>
      </div>

      <div className="space-y-3">
        {stations.map((station) => (
          <div key={station.id} className="bg-white rounded-xl p-5 shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{station.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{station.address}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{station.slots_available}</div>
                <div className="text-xs text-gray-500">dari {station.slots_total} slot</div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-3">
              <button 
                onClick={() => setSelectedStation(station)}
                className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold"
              >
                📍 Lihat Lokasi
              </button>
              <button 
                onClick={() => bookStation(station)}
                disabled={station.slots_available === 0}
                className="flex-1 bg-green-600 text-white p-4 rounded-xl font-bold disabled:bg-gray-400"
              >
                {station.slots_available > 0 ? '🔋 Pesan Slot' : '⭕ Penuh'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {stations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-3">📍</div>
          <p className="text-gray-500">Belum ada stasiun charging</p>
        </div>
      )}
    </div>
  )
}
