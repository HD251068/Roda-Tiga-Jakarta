export interface User {
  id: string
  email: string
  role: 'passenger' | 'driver' | 'station_owner'
  full_name: string
  phone: string
  avatar_url?: string
  is_approved: boolean
  created_at: string
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id?: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  distance_km: number
  fare_amount: number
  tip_amount: number
  total_amount: number
  status: 'waiting' | 'accepted' | 'started' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed'
  created_at: string
  completed_at?: string
}

export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  slots_total: number
  slots_available: number
  address: string
}

export interface FareRule {
  id: string
  range_name: 'dekat' | 'menengah' | 'jauh'
  min_km: number
  max_km: number
  fare_amount: number
}

export interface Earnings {
  date: string
  fare: number
  tip: number
  total: number
  rides_count: number
}
