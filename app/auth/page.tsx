'use client'

import { useEffect } from 'react'

const TRAVELER_AUTH_URL = 'https://nomaratravel.com/auth'

export default function TravelerAuthRedirectPage() {
  useEffect(() => {
    // Recovery credentials are returned in the URL fragment. Preserve both
    // query and fragment so a legacy/misdirected link can finish securely on
    // the traveler account page instead of ending at a 404.
    window.location.replace(`${TRAVELER_AUTH_URL}${window.location.search}${window.location.hash}`)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="eyebrow mb-3">Nomara account</p>
        <h1 className="font-serif-italic text-n-cream text-3xl mb-3">Opening secure account access…</h1>
        <p className="text-n-cream-muted text-sm">You’ll be redirected to Nomara Travel.</p>
      </div>
    </main>
  )
}
