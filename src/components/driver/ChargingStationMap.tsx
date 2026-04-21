'use client'

import { useState } from 'react'

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  slots_available: number
  distance: number
}

interface ChargingStationMapProps {
  stations: Station[]
  onSelectStation: (station: Station) => void
}

export default function ChargingStationMap({ stations, onSelectStation }: ChargingStationMapProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  return (
    <div className="bg-gray-200 rounded-xl overflow-hidden">
      {/* Mock Map */}
      <div className="h-64 bg-gradient-to-b from-green-100 to-green-200 relative">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        {/* Station Markers */}
        {stations.map((station, idx) => (
          <button
            key={station.id}
            onClick={() => {
              setSelectedStation(station)
              onSelectStation(station)
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${20 + (idx * 20)}%`, 
              top: `${30 + (idx * 15)}%` 
            }}
          >
            <div className="text-3xl hover:scale-125 transition-transform">
              🔋
            </div>
            <div className="bg-white rounded-full px-2 py-1 text-xs font-bold shadow-md mt-1">
              {station.name.split(' ')[0]}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Station Info */}
      {selectedStation && (
        <div className="p-4 bg-white border-t">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">{selectedStation.name}</h3>
              <p className="text-sm text-gray-500">
                Jarak: {selectedStation.distance} km | Slot: {selectedStation.slots_available}
              </p>
            </div>
            <button
              onClick={() => onSelectStation(selectedStation)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              Navigasi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
