'use client'

interface RideCompleteModalProps {
  ride: {
    fare_amount: number
    tip_amount: number
    total_amount: number
  }
  onClose: () => void
}

export default function RideCompleteModal({ ride, onClose }: RideCompleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-4">
          <div className="text-6xl mb-2 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-green-700">Perjalanan Selesai!</h2>
          <p className="text-gray-500">Terima kasih telah mengemudi dengan aman</p>
        </div>

        <div className="bg-gray-100 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Tarif Dasar:</span>
            <span className="font-bold">Rp {ride.fare_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Tip dari Penumpang:</span>
            <span className="font-bold text-orange-600">+ Rp {ride.tip_amount.toLocaleString()}</span>
          </div>
          <div className="border-t-2 border-dashed pt-3 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-bold">TOTAL DITERIMA:</span>
              <span className="text-2xl font-bold text-green-700">
                Rp {ride.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-3 mb-6 text-center text-sm text-green-700">
          💡 Tip akan ditambahkan ke saldo Anda hari ini
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-blue-600 text-white p-5 rounded-xl text-xl font-bold"
        >
          ✅ OK, SIAP ORDER LAGI
        </button>
      </div>
    </div>
  )
}
