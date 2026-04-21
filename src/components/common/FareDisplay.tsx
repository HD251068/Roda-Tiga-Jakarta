interface FareDisplayProps {
  fareData: {
    distance: number
    fare: number
    range_name: string
    min_km: number
    max_km: number
  }
}

export default function FareDisplay({ fareData }: FareDisplayProps) {
  const getRangeColor = (range: string) => {
    switch(range) {
      case 'dekat': return 'text-green-600'
      case 'menengah': return 'text-blue-600'
      case 'jauh': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-500">Jarak Perjalanan</div>
        <div className="text-3xl font-bold">{fareData.distance} km</div>
      </div>

      <div className="text-center mb-4">
        <div className="text-sm text-gray-500">Kategori</div>
        <div className={`text-xl font-bold ${getRangeColor(fareData.range_name)}`}>
          {fareData.range_name === 'dekat' && '📍 Jarak Dekat'}
          {fareData.range_name === 'menengah' && '🚶 Jarak Menengah'}
          {fareData.range_name === 'jauh' && '🏃 Jarak Jauh'}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-500">Tarif Dasar</div>
        <div className="text-4xl font-bold text-green-700">
          Rp {fareData.fare.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
