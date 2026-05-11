// src/app/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1A4A42 0%, #2D6B5F 45%, #F0F7F5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-p {
          width: 100%; padding: 18px 20px;
          background: #B5421A; color: #FFFFFF;
          border: none; border-radius: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 14px;
          min-height: 64px; transition: background .15s, transform .1s;
          box-shadow: 0 4px 16px rgba(181,66,26,.4);
        }
        .btn-p:hover { background: #8F3314; }
        .btn-p:active { transform: scale(.97); }
        .btn-d {
          width: 100%; padding: 18px 20px;
          background: #FFFFFF; color: #1A4A42;
          border: 3px solid #1A4A42; border-radius: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 14px;
          min-height: 64px; transition: background .15s, transform .1s;
        }
        .btn-d:hover { background: #E8F4F1; }
        .btn-d:active { transform: scale(.97); }
        .btn-s {
          width: 100%; padding: 16px 20px;
          background: rgba(255,255,255,.12); color: rgba(255,255,255,.9);
          border: 2px solid rgba(255,255,255,.3); border-radius: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 14px;
          min-height: 56px; transition: background .15s, transform .1s;
        }
        .btn-s:hover { background: rgba(255,255,255,.2); }
        .btn-s:active { transform: scale(.97); }
      `}</style>

      {/* Brand section */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 340 }}>

        {/* KSI badge */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.95)',
            border: '1.5px solid rgba(255,255,255,.3)',
            padding: '5px 16px', borderRadius: 20,
            fontSize: 12, fontWeight: 700,
          }}>
            Koperasi Syarikat Islam
          </span>
        </div>

        {/* Logo */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: '#B5421A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          border: '4px solid rgba(255,255,255,.3)',
          boxShadow: '0 8px 32px rgba(181,66,26,.5)',
          fontSize: 48,
        }}>
          <span role="img" aria-label="petir">&#9889;</span>
        </div>

        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 30, fontWeight: 800,
          color: '#FFFFFF', marginBottom: 8, lineHeight: 1.2,
        }}>
          Bajaj Listrik Jakarta
        </h1>

        <p style={{
          fontSize: 15, fontWeight: 500,
          color: 'rgba(255,255,255,.8)',
          lineHeight: 1.5, marginBottom: 20,
        }}>
          Transportasi ramah lingkungan berbasis koperasi untuk warga Jakarta
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,.1)',
          borderRadius: 14, padding: '12px 0',
          border: '1.5px solid rgba(255,255,255,.2)',
        }}>
          {[
            { ic: '🛺', val: '500+', lbl: 'Armada' },
            { ic: '⚡', val: '100%', lbl: 'Listrik' },
            { ic: '🌿', val: '0 Emisi', lbl: 'CO2' },
          ].map((s, i) => (
            <div key={s.lbl} style={{
              flex: 1, textAlign: 'center',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,.2)' : 'none',
              padding: '0 8px',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.ic}</div>
              <div style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 16, fontWeight: 700, color: '#FFFFFF',
              }}>{s.val}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>

        <button className="btn-p" onClick={() => router.push('/passenger')}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>👤</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Saya Penumpang</div>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: .85, marginTop: 1 }}>Pesan bajaj listrik sekarang</div>
          </div>
          <span style={{ fontSize: 20, opacity: .8 }}>&#8594;</span>
        </button>

        <button className="btn-d" onClick={() => router.push('/driver')}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#E8F4F1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🛺</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1A4A42' }}>Saya Driver</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#5A7A76', marginTop: 1 }}>Mulai terima order hari ini</div>
          </div>
          <span style={{ fontSize: 20, color: '#1A4A42', opacity: .6 }}>&#8594;</span>
        </button>

        <button className="btn-s" onClick={() => router.push('/station')}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>🏪</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Stasiun Pengisian</div>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: .75, marginTop: 1 }}>Cari SPKLU terdekat</div>
          </div>
        </button>

      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28, textAlign: 'center',
        fontSize: 12, fontWeight: 500,
        color: 'rgba(255,255,255,.55)', lineHeight: 1.6,
      }}>
        2025 Koperasi Syarikat Islam · Bajaj Listrik Jakarta
      </div>

    </div>
  )
}
