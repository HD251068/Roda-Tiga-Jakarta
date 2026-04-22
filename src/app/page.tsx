export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">🚕 Bajaj Elektrik Jakarta</h1>
        <p className="text-xl mb-8">Platform Transportasi Ramah Lingkungan</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 border rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">🔋 100% Elektrik</h2>
            <p>Zero emisi, hemat energi</p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">💰 Hemat 60%</h2>
            <p>Biaya operasional lebih murah</p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">🌱 Ramah Lingkungan</h2>
            <p>Udara Jakarta lebih bersih</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Pesan Sekarang
          </button>
        </div>
      </div>
    </main>
  )
}
