'use client'

import { useState, useEffect } from 'react'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: { lat: -6.2088, lng: 106.8456 }, // Default Jakarta
        error: 'Browser tidak support geolocation',
        loading: false
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          error: null,
          loading: false
        })
      },
      (error) => {
        setState({
          location: { lat: -6.2088, lng: 106.8456 }, // Default Jakarta
          error: error.message,
          loading: false
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [])

  return state
}
