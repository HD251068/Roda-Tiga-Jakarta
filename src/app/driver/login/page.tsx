'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DriverLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, role: 'driver', redirect: false,
    })
    if (res?.ok) {
      router.push('/driver')
    } else {
      setError('Email atau password salah')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1A4A42 0%, #2D6B5F 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛺</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A4A42', margin: 0 }}>Login Driver</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Roda Tiga Jakarta</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="driver@email.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: loading ? '#9CA3AF' : '#1A4A42', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← Kembali ke beranda</a>
        </div>
      </div>
    </div>
  )
}
