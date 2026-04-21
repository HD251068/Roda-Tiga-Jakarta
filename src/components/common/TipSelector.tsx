interface TipSelectorProps {
  onTipSelect: (amount: number) => void
  selectedTip: number
}

export default function TipSelector({ onTipSelect, selectedTip }: TipSelectorProps) {
  const tipOptions = [
    { value: 0, label: 'Tanpa Tip', icon: '🙅' },
    { value: 2000, label: 'Rp 2.000', icon: '🙏' },
    { value: 5000, label: 'Rp 5.000', icon: '👍' },
    { value: 10000, label: 'Rp 10.000', icon: '⭐' }
  ]

  return (
    <div className="border-t pt-4">
      <p className="font-bold text-lg mb-3 text-center">💝 Tip untuk Driver (Opsional)</p>
      <div className="grid grid-cols-2 gap-3">
        {tipOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onTipSelect(option.value)}
            className={`p-4 rounded-xl text-center transition-all ${
              selectedTip === option.value 
                ? 'bg-green-600 text-white scale-105 shadow-lg' 
                : 'bg-gray-100 text-gray-800 border-2 border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">{option.icon}</div>
            <div className="font-bold">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
