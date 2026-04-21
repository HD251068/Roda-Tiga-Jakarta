'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtimeRide(rideId: string | null) {
  const [ride, setRide] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!rideId) return

    // Fetch initial data
    const fetchRide = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single()
      
      setRide(data)
      setLoading(false)
    }

    fetchRide()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          setRide(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [rideId])

  return { ride, loading }
}
