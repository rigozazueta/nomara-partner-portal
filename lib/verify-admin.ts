import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verify that a request comes from an admin user.
 * Accepts either:
 * 1. A valid Supabase Auth token (from Authorization header) belonging to an admin_users email
 * 2. The legacy admin_password field in the request body (for backward compatibility)
 */
export async function verifyAdmin(req: NextRequest, body: { admin_password?: string }): Promise<boolean> {
  // Method 1: Check Supabase Auth token from cookie/header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (!error && user?.email) {
      const { data: adminRow } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      if (adminRow) return true
    }
  }

  // Method 2: Legacy password check
  if (body.admin_password && body.admin_password === process.env.ADMIN_PASSWORD) {
    return true
  }

  return false
}
