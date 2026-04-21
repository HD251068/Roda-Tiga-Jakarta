'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import EarningsCard from '@/components/driver/EarningsCard'
import RideCompleteModal from '@/components/driver/RideCompleteModal'

export default function DriverDashboardPage() {
  const [activeRide, setActiveRide] = useState<any>(null)
  const [todayEarnings, setTodayEarnings] = useState({ fare: 0, tip: 0, total: 0 })
  const [isOnline, setIsOnline] = useState(true)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completedRide, setCompletedRide] = useState<any>(null)

  useEffect(() => {
    fetchTodayEarnings()
    
    // Subscribe ke order baru
    const subscription = supabase
      .channel('rides')
      .on('INSERT', (payload) => {
        if (isOnline) {
          setActiveRide(payload.new)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isOnline])

  const fetchTodayEarnings = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('rides')
      .select('fare_amount, tip_amount')
      .gte('created_at', today)
      .eq('payment_status', 'paid')

    const totalFare = data?.reduce((sum, ride) => sum + (ride.fare_amount || 0), 0) || 0
    const totalTip = data?.reduce((sum, ride) => sum + (ride.tip_amount || 0), 0) || 0

    setTodayEarnings({
      fare: totalFare,
      tip: totalTip,
      total: totalFare + totalTip
    })
  }

  const acceptRide = async () => {
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: 'mock-driver-id', status: 'accepted' })
      .eq('id', activeRide.id)

    if (!error) {
      setActiveRide({ ...activeRide, status: 'accepted' })
    }
  }

  const completeRide = async () => {
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', activeRide.id)

    if (!error) {
      setCompletedRide(activeRide)
      setShowCompleteModal(true)
      setActiveRide(null)
      fetchTodayEarnings()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header Status */}
      <div className={`${isOnline ? 'bg-green-700' : 'bg-gray-700'} text-white p-5`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm">Status</div>
            <div className="text-2xl font-bold">
              {isOnline ? '✅ ONLINE' : '⭕ OFFLINE'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm">Baterai</div>
            <div className="text-2xl font-bold">🔋 85%</div>
          </div>
        </div>
        
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`mt-3 w-full py-3 rounded-xl font-bold ${
            isOnline ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {isOnline ? 'Offline' : 'Online'}
        </button>
      </div>

      {/* Earnings Card */}
      <EarningsCard earnings={todayEarnings} />

      {/* Active Order Modal */}
      {activeRide && activeRide.status === 'waiting' && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🟡</div>
              <h2 className="text-2xl font-bold">ADA ORDER MASUK!</h2>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl mb-4">
              <div className="flex justify-between mb-2 text-lg">
                <span>💰 Tarif:</span>
                <span className="font-bold">Rp {activeRide.fare_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2 text-lg">
                <span>💝 Tip:</span>
                <span className="font-bold text-orange-600">
                  Rp {activeRide.tip_amount?.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>💰 TOTAL:</span>
                  <span className="text-green-700">
                    Rp {(activeRide.fare_amount + activeRide.tip_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={acceptRide}
              className="w-full bg-green-600 text-white p-5 rounded-xl text-2xl font-bold mb-3"
            >
              ✅ TERIMA ORDER
            </button>
            
            {activeRide.status === 'accepted' && (
              <button 
                onClick={completeRide}
                className="w-full bg-blue-600 text-white p-5 rounded-xl text-2xl font-bold"
              >
                🏁 SELESAIKAN PERJALANAN
              </button>
            )}
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && completedRide && (
        <RideCompleteModal 
          ride={completedRide}
          onClose={() => setShowCompleteModal(false)}
        />
      )}

      {/* Menu Buttons */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <button className="w-full bg-purple-600 text-white p-6 rounded-xl text-xl font-bold">
          💰 PENGHASILAN
        </button>
        <button className="w-full bg-blue-600 text-white p-6 rounded-xl text-xl font-bold">
          🔋 CARI CHARGING
        </button>
      </div>
    </div>
  )
}
