'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Icons dengan animasi
const createBajajIcon = (rotation: number = 0) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease;">
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
          <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🚕</text>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'bajaj-marker'
  })
}

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzM1ODBmZiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iNiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iI2VmNDQ0NCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHRleHQgeD0iMjAiIHk9IjI3IiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+8J+OrzwvdGV4dD48L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

// Simulate route calculation (in production, use OSRM or Google Directions API)
function calculateRoute(start: [number, number], end: [number, number]): [number, number][] {
  const steps = 50
  const route: [number, number][] = []
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Add some curve to make it more realistic
    const curveFactor = Math.sin(t * Math.PI) * 0.01
    const lat = start[0] + (end[0] - start[0]) * t + curveFactor
    const lng = start[1] + (end[1] - start[1]) * t + curveFactor * 1.5
    route.push([lat, lng])
  }
  
  return route
}

// Calculate bearing/rotation for bajaj icon
function calculateBearing(start: [number, number], end: [number, number]): number {
  const lat1 = start[0] * Math.PI / 180
  const lat2 = end[0] * Math.PI / 180
  const lng1 = start[1] * Math.PI / 180
  const lng2 = end[1] * Math.PI / 180
  
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  const bearing = Math.atan2(y, x) * 180 / Math.PI
  
  return (bearing + 360) % 360
}

// Auto-center map to show route
function AutoFitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [bounds, map])
  
  return null
}

interface OSMMapProps {
  userLocation?: [number, number]
  destination?: [number, number]
  isDriverMode?: boolean
  showLiveTracking?: boolean
}

export default function OSMMap({ 
  userLocation, 
  destination,
  isDriverMode = false,
  showLiveTracking = false 
}: OSMMapProps) {
  const [mounted, setMounted] = useState(false)
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null)
  const [route, setRoute] = useState<[number, number][]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [bearing, setBearing] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  
  // Default center (Jakarta)
  const defaultCenter: [number, number] = [-6.2088, 106.8456]
  const center = userLocation || defaultCenter

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate route when user and destination are set
  useEffect(() => {
    if (userLocation && destination) {
      const calculatedRoute = calculateRoute(userLocation, destination)
      setRoute(calculatedRoute)
      
      // Simulate driver starting from a nearby location
      const driverStart: [number, number] = [
        userLocation[0] + (Math.random() - 0.5) * 0.01,
        userLocation[1] + (Math.random() - 0.5) * 0.01
      ]
      setDriverPosition(driverStart)
      setCurrentStep(0)
    }
  }, [userLocation, destination])

  // Simulate real-time driver movement
  useEffect(() => {
    if (showLiveTracking && route.length > 0 && isMoving) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= route.length - 1) {
            setIsMoving(false)
            return prev
          }
          
          const nextStep = prev + 1
          const newPosition = route[nextStep]
          setDriverPosition(newPosition)
          
          // Calculate bearing for icon rotation
          if (nextStep < route.length - 1) {
            const nextBearing = calculateBearing(route[nextStep], route[nextStep + 1])
            setBearing(nextBearing)
          }
          
          return nextStep
        })
      }, 200) // Update every 200ms for smooth animation
      
      return () => clearInterval(interval)
    }
  }, [showLiveTracking, route, isMoving])

  if (!mounted) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🗺️</div>
          <p className="text-orange-600 font-medium">Loading map...</p>
        </div>
      </div>
    )
  }

  const bounds: [[number, number], [number, number]] | undefined = 
    userLocation && destination 
      ? [[Math.min(userLocation[0], destination[0]), Math.min(userLocation[1], destination[1])],
         [Math.max(userLocation[0], destination[0]), Math.max(userLocation[1], destination[1])]]
      : undefined

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bounds && <AutoFitBounds bounds={bounds} />}
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-blue-600">📍 Lokasi Anda</p>
                <p className="text-xs text-gray-600 mt-1">Titik Penjemputan</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Destination Marker */}
        {destination && (
          <Marker position={destination} icon={destinationIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-red-600">🎯 Tujuan</p>
                <p className="text-xs text-gray-600 mt-1">Lokasi Antar</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Route Polyline */}
        {route.length > 0 && (
          <Polyline 
            positions={route} 
            color="#3b82f6" 
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
        
        {/* Driver Position (Live Tracking) */}
        {showLiveTracking && driverPosition && (
          <Marker position={driverPosition} icon={createBajajIcon(bearing)}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-green-600">🚕 Driver</p>
                <p className="text-xs text-gray-600 mt-1">
                  {isMoving ? 'Sedang Menuju...' : 'Driver Siap'}
                </p>
                <p className="text-xs font-bold text-green-600 mt-1">
                  {Math.round((currentStep / route.length) * 100)}% perjalanan
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Control Buttons */}
      {showLiveTracking && route.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
          <button
            onClick={() => setIsMoving(!isMoving)}
            className={`px-4 py-2 rounded-full font-bold shadow-lg transition-all active:scale-95 ${
              isMoving 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {isMoving ? '⏸️ Pause' : '▶️ Start Trip'}
          </button>
          
          {!isMoving && currentStep > 0 && (
            <button
              onClick={() => {
                setCurrentStep(0)
                setDriverPosition(route[0])
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow-lg active:scale-95 transition-all"
            >
              🔄 Reset
            </button>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {showLiveTracking && route.length > 0 && (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Progress Trip</span>
              <span className="text-xs font-bold text-green-600">
                {Math.round((currentStep / route.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-200"
                style={{ width: `${(currentStep / route.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}