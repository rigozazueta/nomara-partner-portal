import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdmin } from '@/lib/verify-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_Xo7c99AE_AF5mgpVnib668RcUEgCkYSwu'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://partners.nomaratravel.com'
const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(2).png'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      operator_id,
      retreat_id,
      traveler_name,
      traveler_email,
      travel_dates,
      duration_days,
      booking_amount,
      commission_rate,
      notes,
    } = body as {
      operator_id: string
      retreat_id: string
      traveler_name: string
      traveler_email?: string
      travel_dates: string
      duration_days: number
      booking_amount: number
      commission_rate: number
      notes?: string
    }

    const isAdmin = await verifyAdmin(req, body)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!operator_id || !retreat_id || !traveler_name || !travel_dates || !booking_amount || commission_rate === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Insert the booking as pending_confirmation
    const { data: booking, error: insertError } = await supabaseAdmin
      .from('operator_booking_reports')
      .insert({
        operator_id,
        retreat_id,
        traveler_name,
        traveler_email: traveler_email || null,
        travel_dates,
        duration_days: duration_days || null,
        booking_amount,
        commission_rate,
        notes: notes || null,
        confirmation_status: 'pending_confirmation',
        created_by: 'admin',
      })
      .select('id, booking_amount, commission_owed, commission_rate, travel_dates, traveler_name, duration_days')
      .single()

    if (insertError || !booking) {
      return NextResponse.json({ success: false, error: insertError?.message || 'Insert failed' }, { status: 500 })
    }

    // Look up operator + retreat for the email
    const [{ data: operator }, { data: retreat }] = await Promise.all([
      supabaseAdmin
        .from('retreat_operators')
        .select('operator_name, contact_name, email')
        .eq('id', operator_id)
        .single(),
      supabaseAdmin
        .from('retreats')
        .select('retreat_name')
        .eq('id', retreat_id)
        .single(),
    ])

    if (!operator?.email) {
      // Booking was created but we can't send an email — return success with a warning
      return NextResponse.json({
        success: true,
        warning: 'Booking created but operator has no email on file',
        booking,
      })
    }

    const firstName = (operator.contact_name || operator.operator_name).split(' ')[0]
    const confirmUrl = `${SITE_URL}/operator/confirm/${booking.id}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a0f; color: #f5f0e8; padding: 40px 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="Nomara" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
          <div style="width: 50px; height: 1px; background: #C9A84C; margin: 12px auto;"></div>
          <p style="color: #C9A84C; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">Booking Confirmation Needed</p>
        </div>
        <div style="background: #0f2a18; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; padding: 28px; margin-bottom: 20px;">
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${firstName},</p>
          <p style="color: rgba(245,240,232,0.8); font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">We wanted to save you a few minutes — we've gone ahead and filed a booking report on your behalf for a recent Nomara-referred traveler. Just click below to confirm the details are correct and we'll process your commission invoice within 48 hours.</p>

          <div style="background: #0a1a0f; border: 1px solid rgba(201,168,76,0.25); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; width: 140px; vertical-align: top;">Retreat</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${retreat?.retreat_name || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Traveler</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${booking.traveler_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Dates</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${booking.travel_dates}</td>
              </tr>
              ${booking.duration_days ? `<tr><td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Duration</td><td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${booking.duration_days} days</td></tr>` : ''}
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Booking Amount</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${formatCurrency(Number(booking.booking_amount))}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Commission (${booking.commission_rate}%)</td>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 18px; font-weight: 500;">${formatCurrency(Number(booking.commission_owed))}</td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${confirmUrl}" style="background: #C9A84C; color: #0a1a0f; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 500; display: inline-block;">Confirm Booking</a>
          </p>
          <p style="color: rgba(245,240,232,0.6); font-size: 13px; line-height: 1.6; text-align: center; margin: 0;">Something not right? <a href="${confirmUrl}" style="color: #C9A84C;">Click here to flag it</a> and we'll sort it out.</p>
        </div>
        <p style="color: rgba(245,240,232,0.6); font-size: 13px; text-align: center; margin-bottom: 4px;">Questions? Just reply to this email.</p>
        <p style="color: rgba(245,240,232,0.4); font-size: 12px; text-align: center; font-style: italic; margin: 0;">Skillcation travel, done right.</p>
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
        to: [operator.email],
        reply_to: 'rigo@nomaratravel.com',
        subject: `Please confirm a Nomara booking — ${traveler_name}`,
        html,
      }),
    })

    return NextResponse.json({ success: true, booking, message: `Booking created and confirmation sent to ${operator.email}` })
  } catch (err) {
    console.error('Create booking error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
