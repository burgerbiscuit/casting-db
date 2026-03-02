import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const { handle } = params
  if (!handle) return NextResponse.json({ error: 'Missing handle' }, { status: 400 })

  const supabase = await createServiceClient()

  // Check cache
  const { data: cached } = await supabase
    .from('instagram_cache')
    .select('*')
    .eq('handle', handle)
    .single()

  if (cached && new Date(cached.cached_at).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
    return NextResponse.json({
      handle,
      follower_count: cached.follower_count,
      source: 'cache'
    })
  }

  // Fetch from Piloterr
  try {
    const res = await fetch(`https://piloterr.com/api/v2/instagram/user/info?query=${handle}`, {
      headers: {
        'x-api-key': process.env.PILOTERR_API_KEY || ''
      }
    })
    const data = await res.json()

    if (data.followers !== undefined) {
      // Upsert cache
      await supabase.from('instagram_cache').upsert({
        handle,
        follower_count: data.followers,
        cached_at: new Date().toISOString()
      })

      return NextResponse.json({
        handle,
        follower_count: data.followers,
        source: 'live'
      })
    }
  } catch (e) {
    console.error('IG fetch error:', e)
  }

  // Return cached or null
  return NextResponse.json({
    handle,
    follower_count: cached?.follower_count || null,
    source: 'fallback'
  })
}
