'use client'

interface EarningsCardProps {
  earnings: {
    fare: number
    tip: number
    total: number
  }
}

export default function EarningsCard({ earnings }: EarningsCardProps) {
  return (
    <div className="bg-gradient-to-r from-green-700 to-green-500 text-white mx-4 mt-4 rounded-2xl p-5 shadow-lg">
      <div className="text-center mb-3">
        <div className="text-sm opacity-80">💵 PENGHASILAN HARI INI</div>
        <div className="text-3xl font-bold mt-1">
          Rp {earnings.total.toLocaleString()}
        </div>
      </div>
      
      <div className="flex justify-around pt-3 border-t border-green-400">
        <div className="text-center">
          <div className="text-xs opacity-80">Dari Tarif</div>
          <div className="text-xl font-bold">Rp {earnings.fare.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs opacity-80">Dari Tip</div>
          <div className="text-xl font-bold text-yellow-300">Rp {earnings.tip.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
