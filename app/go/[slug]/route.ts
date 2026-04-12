import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { COOKIE_NAME } from '@/lib/referral-cookie'

export const dynamic = 'force-dynamic'

const FALLBACK_URL = 'https://nomaratravel.com'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // Look up the referral link
  const { data: link } = await supabaseAdmin
    .from('referral_links')
    .select('id, destination_url, active, operator_id')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!link) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  // Log the click
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = headersList.get('user-agent') || null
  const referer = headersList.get('referer') || null

  await supabaseAdmin.from('referral_clicks').insert({
    referral_link_id: link.id,
    clicked_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    referer: referer,
  })

  // Append UTM parameters to destination URL
  const destUrl = new URL(link.destination_url)
  destUrl.searchParams.set('utm_source', 'nomara')
  destUrl.searchParams.set('utm_medium', 'referral')
  destUrl.searchParams.set('utm_campaign', slug)

  // Build response with redirect + attribution cookie
  const response = NextResponse.redirect(destUrl.toString())

  const cookieValue = JSON.stringify({
    referral_link_id: link.id,
    slug,
    operator_id: link.operator_id,
    clicked_at: new Date().toISOString(),
  })

  response.cookies.set(COOKIE_NAME, cookieValue, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    httpOnly: false, // Client components need to read it
    secure: true,
    sameSite: 'lax',
  })

  return response
}
