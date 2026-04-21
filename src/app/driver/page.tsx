'use client'

import { useState, useEffect } from 'react'
import DriverDashboard from '@/components/driver/DriverDashboard'
import { supabase } from '@/lib/supabase/client'

export default function DriverPage() {
  const [driver, setDriver] = useState(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Cek login driver
    checkDriverSession()
  }, [])

  const checkDriverSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'driver') {
        setDriver(profile)
      }
    }
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'driver@bajaj.com',
      password: 'driver123'
    })
    
    if (!error) {
      window.location.reload()
    }
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">👨‍✈️</div>
          <h2 className="text-2xl font-bold mb-4">Login Pengemudi</h2>
          <button 
            onClick={handleLogin}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold"
          >
            Masuk sebagai Driver
          </button>
          <p className="mt-4 text-sm text-gray-600">
            Demo: driver@bajaj.com / driver123
          </p>
        </div>
      </div>
    )
  }

  return <DriverDashboard driver={driver} isOnline={isOnline} setIsOnline={setIsOnline} />
}
