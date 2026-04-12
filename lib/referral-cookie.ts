export const COOKIE_NAME = 'nmr_ref'

export interface ReferralAttribution {
  referral_link_id: string
  slug: string
  operator_id: string
  clicked_at: string
}

/**
 * Read the Nomara referral attribution cookie (client-side only).
 * Returns parsed attribution data or null if no cookie / invalid / server-side.
 */
export function getReferralAttribution(): ReferralAttribution | null {
  if (typeof document === 'undefined') return null

  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=')
      if (name === COOKIE_NAME) {
        const value = decodeURIComponent(rest.join('='))
        const parsed = JSON.parse(value)
        if (parsed.referral_link_id && parsed.slug) {
          return parsed as ReferralAttribution
        }
      }
    }
  } catch {
    // Malformed cookie — degrade gracefully
  }

  return null
}
