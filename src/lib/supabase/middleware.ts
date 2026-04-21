import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function supabaseMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protected routes
  const isDriverRoute = req.nextUrl.pathname.startsWith('/driver')
  const isPassengerRoute = req.nextUrl.pathname.startsWith('/passenger')
  
  if ((isDriverRoute || isPassengerRoute) && !session) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}
