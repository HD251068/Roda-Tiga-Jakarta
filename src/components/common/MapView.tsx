'use client'

import { useEffect, useRef, useState } from 'react'

interface MapViewProps {
  pickup?: { lat: number; lng: number } | null
  destination?: { lat: number; lng: number } | null
  onPickupSelect?: (location: { lat: number; lng: number }) => void
  onDestinationSelect?: (location: { lat: number; lng: number }) => void
  showChargingStations?: boolean
}

// Simple map component without Mapbox (to avoid token issues)
// Replace with actual map integration when token is available
export default function MapView({ 
  pickup, 
  destination, 
  onPickupSelect, 
  onDestinationSelect,
  showChargingStations = false 
}: MapViewProps) {
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null)

  // Mock map click handler
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Mock coordinates (Jakarta area)
    const lat = -6.2 + (y / rect.height) * 0.1
    const lng = 106.8 + (x / rect.width) * 0.1
    
    setClickPosition({ x, y })
    
    if (onPickupSelect && !pickup) {
      onPickupSelect({ lat, lng })
    } else if (onDestinationSelect && pickup && !destination) {
      onDestinationSelect({ lat, lng })
    }
    
    // Hilangkan marker setelah 2 detik
    setTimeout(() => setClickPosition(null), 2000)
  }

  return (
    <div 
      onClick={handleMapClick}
      className="relative w-full h-full bg-gradient-to-b from-green-100 to-green-200 cursor-pointer overflow-hidden"
    >
      {/* Mock Map Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-green-400 rounded-full blur-3xl"></div>
      </div>
      
      {/* Grid lines */}
      <div className="absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full border-t border-gray-300" style={{ top: `${i * 10}%` }}></div>
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full border-l border-gray-300" style={{ left: `${i * 10}%` }}></div>
        ))}
      </div>

      {/* Marker untuk pickup */}
      {pickup && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="text-3xl animate-bounce">📍</div>
          <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap mt-1">
            Jemput
          </div>
        </div>
      )}

      {/* Marker untuk destination */}
      {destination && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="text-3xl animate-bounce">🎯</div>
          <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap mt-1">
            Tujuan
          </div>
        </div>
      )}

      {/* Click indicator */}
      {clickPosition && (
        <div 
          className="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping"
          style={{ left: clickPosition.x - 16, top: clickPosition.y - 16 }}
        />
      )}

      {/* Center indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-600 text-sm bg-white bg-opacity-80 px-3 py-1 rounded-full">
            Klik peta untuk pilih lokasi
          </p>
        </div>
      </div>

      {/* Informasi lokasi terpilih */}
      {(pickup || destination) && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-xl text-sm z-30">
          {pickup && !destination && (
            <div>✅ Lokasi jemput dipilih. Klik peta lagi untuk pilih tujuan.</div>
          )}
          {pickup && destination && (
            <div>✅ Lokasi jemput dan tujuan sudah dipilih.</div>
          )}
        </div>
      )}
    </div>
  )
}
