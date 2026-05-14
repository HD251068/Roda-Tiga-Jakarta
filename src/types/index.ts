export type UserRole = 'passenger' | 'driver' | 'admin'
export type DriverTier = 'probation' | 'silver' | 'gold' | 'platinum'
export type RideStatus = 'waiting' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed'
export type DisputeStatus = 'open' | 'investigating' | 'resolved_driver' | 'resolved_passenger' | 'inconclusive'

export interface Profile {
  id: string
  phone: string
  full_name: string
  email?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  user_id: string
  vehicle_type: string
  vehicle_brand?: string
  vehicle_plate?: string
  vehicle_year?: number
  battery_capacity_kwh?: number
  wallet_balance: number
  total_earnings: number
  commission_rate: number
  tier: DriverTier
  score_total: number
  score_rating: number
  score_acceptance: number
  score_punctuality: number
  score_cancellation: number
  score_complaints: number
  total_trips: number
  avg_rating: number
  acceptance_rate: number
  ontime_rate: number
  cancel_rate: number
  streak_perfect_trips: number
  streak_best: number
  badge_professional: boolean
  badge_excellent: boolean
  accountability_score: number
  is_online: boolean
  current_lat?: number
  current_lng?: number
  last_location_at?: string
  created_at: string
  updated_at: string
}

export interface PassengerProfile {
  id: string
  user_id: string
  wallet_balance: number
  reliability_score: number
  total_rides: number
  late_cancel_count: number
  noshow_count: number
  avg_wait_time_sec: number
  badge_trusted: boolean
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id?: string
  passenger_phone?: string
  driver_phone?: string
  pickup_lat: number
  pickup_lng: number
  pickup_address?: string
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address?: string
  distance_km: number
  fare_amount: number
  tip_amount: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  driver_earning: number
  driver_bonus: number
  passenger_cashback: number
  status: RideStatus
  payment_status: PaymentStatus
  payment_method?: string
  driver_was_ontime: boolean
  passenger_was_ready: boolean
  both_perfect: boolean
  cancel_fee_charged: number
  cancel_reason?: string
  cancelled_by?: string
  passenger_rating?: number
  driver_rating?: number
  created_at: string
  accepted_at?: string
  en_route_at?: string
  arrived_at?: string
  passenger_boarded_at?: string
  completed_at?: string
  wait_time_sec?: number
}

export interface SessionUser {
  id: string
  email?: string
  name?: string
  role: UserRole
}

export const TIER_CONFIG: Record<DriverTier, {
  label: string
  minScore: number
  commissionRate: number
  color: string
}> = {
  platinum: { label: 'Platinum',  minScore: 900, commissionRate: 0.08, color: '#7C3AED' },
  gold:     { label: 'Gold',      minScore: 750, commissionRate: 0.09, color: '#D97706' },
  silver:   { label: 'Silver',    minScore: 600, commissionRate: 0.10, color: '#6B7280' },
  probation:{ label: 'Probation', minScore: 0,   commissionRate: 0.10, color: '#DC2626' },
}

export const SCORE_COMPONENTS = [
  { key: 'score_rating',       label: 'Rating Penumpang',   weight: 0.30 },
  { key: 'score_acceptance',   label: 'Acceptance Rate',    weight: 0.20 },
  { key: 'score_punctuality',  label: 'Ketepatan Pickup',   weight: 0.20 },
  { key: 'score_cancellation', label: 'Tingkat Pembatalan', weight: 0.15 },
  { key: 'score_complaints',   label: 'Keluhan Valid',      weight: 0.15 },
] as const
