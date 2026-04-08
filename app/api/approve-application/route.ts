import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdmin } from '@/lib/verify-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_Xo7c99AE_AF5mgpVnib668RcUEgCkYSwu'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://partners.nomaratravel.com'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { application_id } = body

    // Verify admin via Supabase Auth or legacy password
    const isAdmin = await verifyAdmin(req, body)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!application_id) {
      return NextResponse.json({ success: false, error: 'Missing application_id' }, { status: 400 })
    }

    // Fetch the application
    const { data: app, error: appError } = await supabaseAdmin
      .from('partner_applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appError || !app) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    // Check if operator already exists with this email
    const { data: existingOp } = await supabaseAdmin
      .from('retreat_operators')
      .select('id')
      .eq('email', app.email)
      .maybeSingle()

    let operatorId: string

    if (existingOp) {
      operatorId = existingOp.id
    } else {
      // Create new retreat_operators record
      const { data: newOp, error: opError } = await supabaseAdmin
        .from('retreat_operators')
        .insert({
          operator_name: app.business_name,
          contact_name: app.contact_name,
          email: app.email,
          commission_rate: 15, // Default rate — admin can adjust later
          outreach_status: 'Partner Application Approved',
        })
        .select('id')
        .single()

      if (opError || !newOp) {
        return NextResponse.json({ success: false, error: `Failed to create operator: ${opError?.message}` }, { status: 500 })
      }

      operatorId = newOp.id
    }

    // Send Supabase Auth invite
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      app.email,
      {
        redirectTo: `${SITE_URL}/operator/set-password`,
        data: {
          operator_id: operatorId,
          operator_name: app.business_name,
        },
      }
    )

    if (inviteError) {
      // If user already exists, that's ok — just resend
      if (!inviteError.message.includes('already been registered')) {
        return NextResponse.json({ success: false, error: `Invite failed: ${inviteError.message}` }, { status: 500 })
      }
    }

    // Link auth_user_id to operator if we got one
    if (authData?.user) {
      await supabaseAdmin
        .from('retreat_operators')
        .update({ auth_user_id: authData.user.id })
        .eq('id', operatorId)
    }

    // Update application status to approved
    await supabaseAdmin
      .from('partner_applications')
      .update({ status: 'approved' })
      .eq('id', application_id)

    // Send approval email to the applicant
    const firstName = app.contact_name.split(' ')[0] || app.contact_name
    const approvalHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a0f; color: #f5f0e8; padding: 40px 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-family: Georgia, serif; font-style: italic; color: #f5f0e8; font-size: 28px; margin: 0;">Nomara</h1>
          <div style="width: 50px; height: 1px; background: #C9A84C; margin: 12px auto;"></div>
          <p style="color: #C9A84C; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">Welcome, Partner</p>
        </div>
        <div style="background: #0f2a18; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; padding: 28px; margin-bottom: 20px;">
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${firstName},</p>
          <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Great news — your partner application for <strong style="color: #f5f0e8;">${app.business_name}</strong> has been approved!</p>
          <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">You'll receive a separate email shortly with a link to <strong style="color: #C9A84C;">set up your password</strong> and access the Nomara Partner Portal.</p>
          <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">Once you're in, you'll be able to:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #C9A84C; font-size: 14px; width: 20px; vertical-align: top;">✦</td>
              <td style="padding: 6px 0; color: rgba(245,240,232,0.8); font-size: 14px;">Report bookings from Nomara-referred travelers</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #C9A84C; font-size: 14px; vertical-align: top;">✦</td>
              <td style="padding: 6px 0; color: rgba(245,240,232,0.8); font-size: 14px;">Track your commissions in real time</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #C9A84C; font-size: 14px; vertical-align: top;">✦</td>
              <td style="padding: 6px 0; color: rgba(245,240,232,0.8); font-size: 14px;">Receive commission invoices automatically</td>
            </tr>
          </table>
        </div>
        <p style="color: rgba(245,240,232,0.8); font-size: 14px; text-align: center; margin-bottom: 8px;">Questions? Just reply to this email.</p>
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
        to: [app.email],
        reply_to: 'rigo@nomaratravel.com',
        subject: `You're approved! Welcome to the Nomara Partner Network, ${firstName}`,
        html: approvalHtml,
      }),
    })

    return NextResponse.json({
      success: true,
      message: `Approved! Invite sent to ${app.email}`,
      operator_id: operatorId,
    })
  } catch (err) {
    console.error('Approve error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
