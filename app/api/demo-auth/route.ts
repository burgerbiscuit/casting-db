import { NextRequest, NextResponse } from 'next/server'

const DEMO_PASSWORD = 'password'
const DEMO_PROJECT_ID = '7539e334-c3f1-4caf-a931-3b2f4929d78f'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, projectId: DEMO_PROJECT_ID })
  res.cookies.set('demo_access', 'true', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return res
}
