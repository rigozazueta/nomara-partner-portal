import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

const FALLBACK_URL = 'https://nomaratravel.com'

export default async function ReferralRedirect({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  // Look up the referral link
  const { data: link } = await supabaseAdmin
    .from('referral_links')
    .select('id, destination_url, active')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!link) {
    redirect(FALLBACK_URL)
  }

  // Log the click (fire-and-forget pattern — don't await)
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = headersList.get('user-agent') || null
  const referer = headersList.get('referer') || null

  // We still await to ensure the insert completes before redirect
  await supabaseAdmin.from('referral_clicks').insert({
    referral_link_id: link.id,
    clicked_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    referer: referer,
  })

  redirect(link.destination_url)
}
