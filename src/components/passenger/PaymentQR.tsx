'use client'

import { useState, useEffect } from 'react'

interface PaymentQRProps {
  rideId: string
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentQR({ rideId, amount, onSuccess, onCancel }: PaymentQRProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending')

  useEffect(() => {
    generateQRCode()
    
    // Polling untuk cek status pembayaran
    const interval = setInterval(checkPaymentStatus, 3000)
    
    return () => clearInterval(interval)
  }, [rideId])

  const generateQRCode = async () => {
    setLoading(true)
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId, amount })
    })
    const data = await response.json()
    setQrCode(data.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + rideId)
    setLoading(false)
  }

  const checkPaymentStatus = async () => {
    const response = await fetch(`/api/check-payment?rideId=${rideId}`)
    const data = await response.json()
    
    if (data.status === 'paid') {
      setPaymentStatus('paid')
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💳</div>
          <h2 className="text-xl font-bold">Bayar dengan QRIS</h2>
          <p className="text-gray-500 text-sm">Scan QR Code menggunakan aplikasi banking</p>
        </div>

        <div className="bg-white p-4 rounded-xl mb-4">
          <div className="text-center mb-2">
            <div className="text-sm text-gray-500">Total Pembayaran</div>
            <div className="text-2xl font-bold text-green-700">Rp {amount.toLocaleString()}</div>
          </div>
          
          <div className="flex justify-center py-4">
            {loading ? (
              <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-gray-400">Loading QR...</span>
              </div>
            ) : (
              <img src={qrCode!} alt="QR Code" className="w-48 h-48" />
            )}
          </div>
          
          <p className="text-center text-xs text-gray-400 mt-2">
            Scan dengan aplikasi OVO, GoPay, atau mobile banking
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 p-4 rounded-xl font-bold"
          >
            Batal
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold"
          >
            Refresh QR
          </button>
        </div>
      </div>
    </div>
  )
}
