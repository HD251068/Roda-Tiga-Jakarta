import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureProfile } from '@/lib/auth/helpers'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone:    { label: 'Phone',    type: 'text' },
        role:     { label: 'Role',     type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: { user }, error } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        if (error || !user) return null

        const profile = await ensureProfile(user.id, {
          email:     user.email,
          full_name: user.user_metadata?.full_name ?? credentials.email,
          phone:     credentials.phone ?? user.user_metadata?.phone ?? '',
          role:      (credentials.role as 'passenger' | 'driver') ?? 'passenger',
        })
        if (!profile) return null

        return {
          id:    user.id,
          email: user.email ?? '',
          name:  profile.full_name,
          role:  profile.role,
          phone: profile.phone,
        }
      }
    })
  ],
  pages: { signIn: '/', error: '/' },
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
