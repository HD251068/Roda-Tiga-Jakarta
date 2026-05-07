'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center mb-6 shadow-xl">
        <span className="text-6xl">⚡</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Bajaj Elektrik</h1>
      <p className="text-gray-500 text-center mb-10">Platform Transportasi Ramah Lingkungan Jakarta</p>
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => router.push('/passenger')}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
        >
          🧑 Saya Penumpang
        </button>
        <button
          onClick={() => router.push('/driver')}
          className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
        >
          🚗 Saya Driver
        </button>
        <button
          onClick={() => router.push('/station')}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
        >
          🏪 Stasiun Pengisian
        </button>
      </div>
    </div>
  )
}
