import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // User auth client (anon key)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Service role client for team_member / client_profile checks (bypasses RLS)
  const supabaseSvc = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') && path !== '/admin/login') {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const { data: member } = await supabaseSvc
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (path.startsWith('/client') && path !== '/client/login' && path !== '/client/signup') {
    // Allow share-cookie access to specific presentation pages (no login required)
    const presShareMatch = path.match(/^\/client\/presentations\/([^/]+)$/)
    if (presShareMatch) {
      const presId = presShareMatch[1]
      const shareCookie = request.cookies.get(`share_${presId}`)?.value
      if (shareCookie === 'true') return supabaseResponse // pass through as guest
    }

    if (!user) return NextResponse.redirect(new URL('/client/login', request.url))
    const { data: isMember } = await supabaseSvc
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!isMember) {
      const { data: clientProfile } = await supabaseSvc
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!clientProfile) return NextResponse.redirect(new URL('/client/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
  // /demo is intentionally excluded — it uses its own cookie-based auth
}
