import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_Xo7c99AE_AF5mgpVnib668RcUEgCkYSwu'
const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { booking_id, action, dispute_reason } = body as {
      booking_id: string
      action: 'confirm' | 'dispute'
      dispute_reason?: string
    }

    if (!booking_id || !action) {
      return NextResponse.json({ success: false, error: 'Missing booking_id or action' }, { status: 400 })
    }

    // Verify Supabase Auth — user must be logged in and match the operator_id on the booking
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    // Find the operator matching this auth user
    const { data: operator } = await supabaseAdmin
      .from('retreat_operators')
      .select('id, operator_name')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!operator) {
      return NextResponse.json({ success: false, error: 'No operator linked to this account' }, { status: 403 })
    }

    // Fetch the booking
    const { data: booking } = await supabaseAdmin
      .from('operator_booking_reports')
      .select('*, retreats(retreat_name)')
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Verify the operator owns this booking
    if (booking.operator_id !== operator.id) {
      return NextResponse.json({ success: false, error: 'This booking does not belong to your account' }, { status: 403 })
    }

    // Can only confirm/dispute pending bookings
    if (booking.confirmation_status !== 'pending_confirmation') {
      return NextResponse.json({
        success: false,
        error: `This booking is already ${booking.confirmation_status}`,
      }, { status: 400 })
    }

    if (action === 'confirm') {
      await supabaseAdmin
        .from('operator_booking_reports')
        .update({
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', booking_id)

      return NextResponse.json({ success: true, message: 'Booking confirmed' })
    }

    if (action === 'dispute') {
      const mergedNotes = booking.notes
        ? `${booking.notes}\n\n[Disputed ${new Date().toISOString()}]: ${dispute_reason || 'No reason given'}`
        : `[Disputed ${new Date().toISOString()}]: ${dispute_reason || 'No reason given'}`

      await supabaseAdmin
        .from('operator_booking_reports')
        .update({
          confirmation_status: 'disputed',
          notes: mergedNotes,
        })
        .eq('id', booking_id)

      // Notify Rigo
      const html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a0f; color: #f5f0e8; padding: 40px 30px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${LOGO_URL}" alt="Nomara" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
            <div style="width: 50px; height: 1px; background: #C9A84C; margin: 12px auto;"></div>
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Booking Disputed</p>
          </div>
          <div style="background: #0f2a18; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <p style="color: #f5f0e8; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;"><strong>${operator.operator_name}</strong> disputed a booking you filed.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; width: 140px; vertical-align: top;">Retreat</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${(booking.retreats as { retreat_name: string } | null)?.retreat_name || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Traveler</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${booking.traveler_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Dates</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${booking.travel_dates}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">Amount</td>
                <td style="padding: 8px 0; color: #f5f0e8; font-size: 15px;">${formatCurrency(Number(booking.booking_amount))}</td>
              </tr>
            </table>
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 6px 0;">Reason</p>
            <p style="color: #f5f0e8; font-size: 15px; line-height: 1.6; margin: 0;">${dispute_reason || 'No reason provided'}</p>
          </div>
          <p style="color: rgba(245,240,232,0.6); font-size: 13px; text-align: center;">Review in your <a href="https://partners.nomaratravel.com/admin" style="color: #C9A84C;">admin dashboard</a>.</p>
        </div>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Nomara Partners <notifications@retreats.nomaratravel.com>',
          to: ['rigo@nomaratravel.com'],
          subject: `Booking disputed — ${booking.traveler_name}`,
          html,
        }),
      })

      return NextResponse.json({ success: true, message: 'Booking disputed — we\'ve been notified and will follow up.' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Confirm booking error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
