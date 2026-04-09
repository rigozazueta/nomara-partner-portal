import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdmin } from '@/lib/verify-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_Xo7c99AE_AF5mgpVnib668RcUEgCkYSwu'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { retreat_id, updates, action } = body as {
      retreat_id: string
      updates?: Record<string, unknown>
      action: 'save_draft' | 'publish' | 'unpublish'
    }

    const isAdmin = await verifyAdmin(req, body)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!retreat_id) {
      return NextResponse.json({ success: false, error: 'Missing retreat_id' }, { status: 400 })
    }

    // Apply any field updates
    const patch: Record<string, unknown> = { ...(updates || {}) }

    if (action === 'publish') {
      patch.listing_status = 'published'
      patch.listing_published_at = new Date().toISOString()
    } else if (action === 'unpublish') {
      patch.listing_status = 'draft'
    }

    const { data: retreat, error: updateError } = await supabaseAdmin
      .from('retreats')
      .update(patch)
      .eq('id', retreat_id)
      .select('*, retreat_operators(operator_name, email, contact_name)')
      .single()

    if (updateError || !retreat) {
      return NextResponse.json({ success: false, error: updateError?.message || 'Update failed' }, { status: 500 })
    }

    // If publishing, notify the operator
    if (action === 'publish' && retreat.retreat_operators) {
      const op = retreat.retreat_operators as { operator_name: string; email: string | null; contact_name: string | null }
      if (op.email) {
        const firstName = (op.contact_name || op.operator_name).split(' ')[0]
        const html = `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a0f; color: #f5f0e8; padding: 40px 30px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(2).png" alt="Nomara" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
              <div style="width: 50px; height: 1px; background: #C9A84C; margin: 12px auto;"></div>
              <p style="color: #C9A84C; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Your Listing Is Live</p>
            </div>
            <div style="background: #0f2a18; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; padding: 28px; margin-bottom: 20px;">
              <p style="color: #f5f0e8; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${firstName},</p>
              <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Great news — your retreat listing for <strong style="color: #f5f0e8;">${retreat.retreat_name}</strong> has been reviewed and published on the Nomara retreat directory.</p>
              <p style="text-align: center; margin: 24px 0;">
                <a href="https://partners.nomaratravel.com/retreats/${retreat.slug}" style="background: #C9A84C; color: #0a1a0f; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 500; display: inline-block;">View Your Listing</a>
              </p>
              <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0;">Travelers can now browse your retreat and join the waitlist. You&#39;ll receive notifications whenever someone expresses interest.</p>
            </div>
            <p style="color: rgba(245,240,232,0.4); font-size: 12px; text-align: center; font-style: italic;">Skillcation travel, done right.</p>
          </div>
        `

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Nomara Travel <hello@retreats.nomaratravel.com>',
            to: [op.email],
            reply_to: 'rigo@nomaratravel.com',
            subject: `Your listing is live: ${retreat.retreat_name}`,
            html,
          }),
        })
      }
    }

    return NextResponse.json({ success: true, retreat })
  } catch (err) {
    console.error('Publish retreat error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
