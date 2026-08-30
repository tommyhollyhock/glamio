import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Admin és superadmin védelem — bejelentkezés szükséges
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Subscription guard — admin oldalon
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user!.id)
      .single()

    if (profile?.salon_id) {
      const { data: salon } = await supabase
        .from('salons')
        .select('subscription_status')
        .eq('id', profile.salon_id)
        .single()

      const status = salon?.subscription_status
      const allowed = ['trialing', 'active']

      if (!allowed.includes(status) && pathname !== '/admin/beallitasok') {
        return NextResponse.redirect(new URL('/admin/beallitasok', req.url))
      }
    }
  }

  // Publikus szalon oldal — subscription guard
  if (pathname.match(/^\/[^/]+\/foglalas/)) {
    const slug = pathname.split('/')[1]

    const { data: salon } = await supabase
      .from('salons')
      .select('subscription_status')
      .eq('slug', slug)
      .single()

    const status = salon?.subscription_status
    const allowed = ['trialing', 'active']

    if (!allowed.includes(status)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/:slug/foglalas/:path*'],
}
