export interface FareResult {
  fare: number
  range: 'dekat' | 'menengah' | 'jauh'
  distance: number
  minKm: number
  maxKm: number
}

export function calculateFareByDistance(distance: number): FareResult {
  if (distance <= 4) {
    return {
      fare: 15000,
      range: 'dekat',
      distance,
      minKm: 0,
      maxKm: 4
    }
  } else if (distance <= 8) {
    return {
      fare: 25000,
      range: 'menengah',
      distance,
      minKm: 4,
      maxKm: 8
    }
  } else if (distance <= 15) {
    return {
      fare: 50000,
      range: 'jauh',
      distance,
      minKm: 8,
      maxKm: 15
    }
  }
  throw new Error('Jarak melebihi batas maksimal 15 km')
}

export function getFareDescription(range: string): string {
  switch(range) {
    case 'dekat': return '📍 Jarak dekat (0-4 km)'
    case 'menengah': return '🚶 Jarak menengah (4-8 km)'
    case 'jauh': return '🏃 Jarak jauh (8-15 km)'
    default: return 'Jarak tidak valid'
  }
}

export function getFareColor(range: string): string {
  switch(range) {
    case 'dekat': return 'text-green-600'
    case 'menengah': return 'text-blue-600'
    case 'jauh': return 'text-orange-600'
    default: return 'text-gray-600'
  }
}
