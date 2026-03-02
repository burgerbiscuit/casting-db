import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') && path !== '/admin/login') {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const { data: member } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (path.startsWith('/client') && path !== '/client/login') {
    if (!user) return NextResponse.redirect(new URL('/client/login', request.url))
    // Allow team members access to /client routes as well
    const { data: isMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!isMember) {
      // Check if they have a client profile
      const { data: clientProfile } = await supabase
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
}
