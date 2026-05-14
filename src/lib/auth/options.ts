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

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, phone, role, pin_hash')
          .eq('phone', credentials.phone)
          .single()

        if (!profile || !profile.is_active || !profile.pin_hash) return null

        const inputHash = hashPin(credentials.pin)
        if (inputHash !== profile.pin_hash) return null

        return {
          id:    profile.id,
          name:  profile.full_name,
          email: profile.phone,
          role:  profile.role,
          phone: profile.phone,
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
