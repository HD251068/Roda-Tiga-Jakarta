'use client'
import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DriverLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const pinStr = pin.join('')
    if (pinStr.length !== 6) {
      setError('Masukkan PIN 6 digit')
      return
    }
    if (!phone) {
      setError('Masukkan nomor HP')
      return
    }

    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      phone: phone.startsWith('0') ? phone : '0' + phone,
      pin: pinStr,
      redirect: false,
    })

    if (res?.ok) {
      router.push('/driver')
    } else {
      setError('Nomor HP atau PIN salah')
      setPin(['', '', '', '', '', ''])
      pinRefs.current[0]?.focus()
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1A4A42 0%, #2D6B5F 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 28px',
        width: '100%', maxWidth: 360,
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🛺</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A4A42', margin: 0 }}>
            Masuk sebagai Driver
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
            Roda Tiga Jakarta
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Input HP */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: '#374151',
              display: 'block', marginBottom: 8,
            }}>
              Nomor HP
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{
                padding: '13px 14px', background: '#F3F4F6',
                border: '2px solid #E5E7EB', borderRight: 'none',
                borderRadius: '12px 0 0 12px', fontSize: 15,
                color: '#6B7280', fontWeight: 600,
              }}>
                +62
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="8123456789"
                style={{
                  flex: 1, padding: '13px 14px',
                  border: '2px solid #E5E7EB', borderLeft: 'none',
                  borderRadius: '0 12px 12px 0',
                  fontSize: 15, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              Contoh: 08123456789 → ketik 8123456789
            </p>
          </div>

          {/* Input PIN */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: '#374151',
              display: 'block', marginBottom: 12,
            }}>
              PIN 6 Digit
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { pinRefs.current[index] = el }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(index, e)}
                  style={{
                    width: 46, height: 54,
                    textAlign: 'center', fontSize: 24, fontWeight: 700,
                    border: digit ? '2px solid #1A4A42' : '2px solid #E5E7EB',
                    borderRadius: 12, outline: 'none',
                    background: digit ? '#F0F7F5' : '#fff',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px',
              color: '#DC2626', fontSize: 13, marginBottom: 16,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || pin.join('').length !== 6 || !phone}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              background: (loading || pin.join('').length !== 6 || !phone)
                ? '#9CA3AF' : '#1A4A42',
              color: '#fff', fontSize: 16, fontWeight: 700,
              border: 'none',
              cursor: (loading || pin.join('').length !== 6 || !phone)
                ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Memproses...' : 'Masuk'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    </div>
  )
}
