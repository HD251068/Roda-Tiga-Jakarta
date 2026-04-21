import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = await req.json()

    // Haversine formula
    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371
      const dLat = deg2rad(lat2 - lat1)
      const dLon = deg2rad(lon2 - lon1)
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }

    function deg2rad(deg: number): number {
      return deg * (Math.PI/180)
    }

    const distance = getDistanceFromLatLonInKm(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

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
      return new Response(
        JSON.stringify({ error: 'Jarak melebihi batas maksimal 15km' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        distance: Math.round(distance * 10) / 10,
        fare,
        range_name,
        min_km,
        max_km
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
