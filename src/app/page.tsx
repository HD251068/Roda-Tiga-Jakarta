'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [role, setRole] = useState<'passenger' | 'driver' | null>(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-700 to-green-500">
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">🚛⚡</div>
        <h1 className="text-4xl font-bold text-white mb-2">Bajaj Electric Jakarta</h1>
        <p className="text-white text-lg">Transportasi ramah lingkungan untuk Jakarta</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link href="/passenger">
          <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-2xl text-2xl font-bold shadow-lg transition-all">
            🧑 Saya Penumpang
          </button>
        </Link>

        <Link href="/driver">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl text-2xl font-bold shadow-lg transition-all">
            👨‍✈️ Saya Pengemudi
          </button>
        </Link>
      </div>

      <div className="mt-12 text-center text-white text-sm">
        <p>📞 Call Center: 1500-123</p>
        <p className="mt-1">💬 WhatsApp: 0812-3456-7890</p>
      </div>
    </div>
  )
}
