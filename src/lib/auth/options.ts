import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

function hashPin(pin: string): string {
  return createHash('sha256').update(pin + 'roda3jkt').digest('hex')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        pin:   { label: 'PIN',   type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.pin) return null

        try {
          // Normalize phone
          let phone = credentials.phone.replace(/\D/g, '')
          if (phone.startsWith('62')) phone = phone.slice(2)
          if (phone.startsWith('0')) phone = phone.slice(1)

          // Query langsung ke Supabase
          const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, phone, role, pin_hash')
            .eq('phone', phone)
            .single()

          console.log('Login attempt:', phone, 'profile found:', !!profile, 'error:', error?.message)

          if (error || !profile || !profile.pin_hash) {
            console.log('Profile not found or no pin_hash')
            return null
          }

          const inputHash = hashPin(credentials.pin)
          console.log('Hash match:', inputHash === profile.pin_hash)

          if (inputHash !== profile.pin_hash) return null

          return {
            id:    profile.id,
            name:  profile.full_name,
            email: profile.phone,
            role:  profile.role,
            phone: profile.phone,
          }
        } catch (err) {
          console.error('Authorize error:', err)
          return null
        }
      }
    })
  ],
  pages: { signIn: '/driver/login', error: '/driver/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id
        token.role  = (user as any).role
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id    = token.sub
        ;(session.user as any).role  = token.role
        ;(session.user as any).phone = token.phone
      }
      return session
    }
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
