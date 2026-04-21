import { NextRequest, NextResponse } from 'next/server'
import { calculateDistance } from '@/lib/utils/distanceCalculator'

export async function POST(request: NextRequest) {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = await request.json()

    // Hitung jarak
    const distance = calculateDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    // Tentukan tarif berdasarkan jarak
    let fare = 0
    let range_name = ''
    let min_km = 0
    let max_km = 0

    if (distance <= 4) {
      fare = 15000
      range_name = 'dekat'
      min_km = 0
      max_km = 4
    } else if (distance <= 8) {
      fare = 25000
      range_name = 'menengah'
      min_km = 4
      max_km = 8
    } else if (distance <= 15) {
      fare = 50000
      range_name = 'jauh'
      min_km = 8
      max_km = 15
    } else {
      return NextResponse.json(
        { error: 'Jarak melebihi batas maksimal 15km' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      distance: Math.round(distance * 10) / 10,
      fare,
      range_name,
      min_km,
      max_km
    })
  } catch (error) {
    console.error('Error calculating fare:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
