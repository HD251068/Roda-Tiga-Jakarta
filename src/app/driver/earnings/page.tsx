'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DailyEarnings {
  date: string
  fare: number
  tip: number
  total: number
  rides_count: number
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<DailyEarnings[]>([])
  const [totalEarnings, setTotalEarnings] = useState({ fare: 0, tip: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    fetchEarnings()
  }, [selectedPeriod])

  const fetchEarnings = async () => {
    setLoading(true)
    
    const startDate = new Date()
    if (selectedPeriod === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const { data } = await supabase
      .from('rides')
      .select('fare_amount, tip_amount, total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })

    // Group by date
    const grouped: Record<string, DailyEarnings> = {}
    data?.forEach(ride => {
      const date = new Date(ride.created_at).toLocaleDateString('id-ID')
      if (!grouped[date]) {
        grouped[date] = { date, fare: 0, tip: 0, total: 0, rides_count: 0 }
      }
      grouped[date].fare += ride.fare_amount || 0
      grouped[date].tip += ride.tip_amount || 0
      grouped[date].total += ride.total_amount || 0
      grouped[date].rides_count += 1
    })

    const earningsList = Object.values(grouped)
    setEarnings(earningsList)

    const totalFare = earningsList.reduce((sum, e) => sum + e.fare, 0)
    const totalTip = earningsList.reduce((sum, e) => sum + e.tip, 0)
    setTotalEarnings({ fare: totalFare, tip: totalTip, total: totalFare + totalTip })

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 mb-4">
        <h1 className="text-2xl font-bold text-center">💰 Laporan Penghasilan</h1>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`flex-1 p-4 rounded-xl font-bold ${
            selectedPeriod === 'week' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Minggu Ini
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`flex-1 p-4 rounded-xl font-bold ${
            selectedPeriod === 'month' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Bulan Ini
        </button>
      </div>

      {/* Total Card */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-6 mb-4">
        <div className="text-center mb-3">
          <div className="text-sm opacity-80">Total Penghasilan</div>
          <div className="text-4xl font-bold">Rp {totalEarnings.total.toLocaleString()}</div>
        </div>
        <div className="flex justify-around pt-3 border-t border-green-400">
          <div className="text-center">
            <div className="text-xs opacity-80">Dari Tarif</div>
            <div className="text-xl font-bold">Rp {totalEarnings.fare.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-80">Dari Tip</div>
            <div className="text-xl font-bold">Rp {totalEarnings.tip.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Daily List */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold px-2">Riwayat Harian</h2>
        {loading ? (
          <div className="text-center py-8">⏳ Memuat...</div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl">
            <div className="text-5xl mb-2">📊</div>
            <p className="text-gray-500">Belum ada data penghasilan</p>
          </div>
        ) : (
          earnings.map((item) => (
            <div key={item.date} className="bg-white rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{item.date}</span>
                <span className="text-sm text-gray-500">{item.rides_count} perjalanan</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-gray-500">Tarif</div>
                  <div className="font-semibold">Rp {item.fare.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Tip</div>
                  <div className="font-semibold text-orange-600">Rp {item.tip.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-bold text-green-700">Rp {item.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
