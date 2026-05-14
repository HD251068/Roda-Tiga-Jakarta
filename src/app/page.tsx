'use client'

import { useRouter } from 'next/navigation'
import './landing.css'

export default function Home() {
  const router = useRouter()

  return (
    <div className="landing-root">
      <div className="brand-section">
        <div className="ksi-badge">Koperasi Syarikat Islam</div>

        <div className="logo-box">⚡</div>

        <h1 className="brand-title">Bajaj Listrik Jakarta</h1>
        <p className="brand-subtitle">
          Transportasi ramah lingkungan berbasis koperasi untuk warga Jakarta
        </p>

        <div className="stats-row">
          {[
            { ic: '🛺', val: '500+',    lbl: 'Armada' },
            { ic: '⚡', val: '100%',    lbl: 'Listrik' },
            { ic: '🌿', val: '0 Emisi', lbl: 'CO2' },
          ].map((s, i) => (
            <div key={s.lbl} className={`stat-item ${i > 0 ? 'stat-border' : ''}`}>
              <div className="stat-ic">{s.ic}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn-p" onClick={() => router.push('/passenger')}>
          <div className="btn-icon">👤</div>
          <div className="btn-text">
            <div className="btn-title">Saya Penumpang</div>
            <div className="btn-sub">Pesan bajaj listrik sekarang</div>
          </div>
          <span className="btn-arrow">→</span>
        </button>

        <button className="btn-d" onClick={() => router.push('/driver')}>
          <div className="btn-icon btn-icon-d">🛺</div>
          <div className="btn-text">
            <div className="btn-title btn-title-d">Saya Driver</div>
            <div className="btn-sub btn-sub-d">Mulai terima order hari ini</div>
          </div>
          <span className="btn-arrow btn-arrow-d">→</span>
        </button>

        <button className="btn-s" onClick={() => router.push('/station')}>
          <div className="btn-icon btn-icon-s">🏪</div>
          <div className="btn-text">
            <div className="btn-title">Stasiun Pengisian</div>
            <div className="btn-sub">Cari SPKLU terdekat</div>
          </div>
        </button>
      </div>

      <div className="footer">
        2025 Koperasi Syarikat Islam · Bajaj Listrik Jakarta
      </div>
    </div>
  )
}
