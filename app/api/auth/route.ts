import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password, role } = await request.json()

  // Only admin uses simple password auth now.
  // Operators use Supabase Auth (email + password).
  if (role === 'admin' && password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, role: 'admin' })
  }

  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
}
