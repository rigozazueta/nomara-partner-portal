import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdmin } from '@/lib/verify-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { operator_id } = body

    // Verify admin via Supabase Auth or legacy password
    const isAdmin = await verifyAdmin(req, body)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!operator_id) {
      return NextResponse.json({ success: false, error: 'Missing operator_id' }, { status: 400 })
    }

    // Look up operator
    const { data: operator, error: opError } = await supabaseAdmin
      .from('retreat_operators')
      .select('id, operator_name, email, auth_user_id')
      .eq('id', operator_id)
      .single()

    if (opError || !operator) {
      return NextResponse.json({ success: false, error: 'Operator not found' }, { status: 404 })
    }

    if (!operator.email) {
      return NextResponse.json({ success: false, error: 'Operator has no email address on file. Add an email first.' }, { status: 400 })
    }

    // If already has auth_user_id, resend invite via password reset
    if (operator.auth_user_id) {
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: operator.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://partners.nomaratravel.com'}/operator/set-password`,
        },
      })

      if (resetError) {
        return NextResponse.json({ success: false, error: `Re-invite failed: ${resetError.message}` }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Re-invite sent', already_invited: true })
    }

    // Create new auth user via invite
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      operator.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://partners.nomaratravel.com'}/operator/set-password`,
        data: {
          operator_id: operator.id,
          operator_name: operator.operator_name,
        },
      }
    )

    if (inviteError) {
      return NextResponse.json({ success: false, error: `Invite failed: ${inviteError.message}` }, { status: 500 })
    }

    // Save auth_user_id back to retreat_operators
    const { error: updateError } = await supabaseAdmin
      .from('retreat_operators')
      .update({ auth_user_id: authData.user.id })
      .eq('id', operator_id)

    if (updateError) {
      return NextResponse.json({ success: false, error: `Failed to link auth user: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Invite sent to ${operator.email}` })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
