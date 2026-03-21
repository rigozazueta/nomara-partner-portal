'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash
    // when using the default browser client with session persistence.
    // We listen for auth state changes to detect when the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
        setSessionReady(true)
        setLoading(false)
      }
    })

    // Also check if there's already a session (e.g., from a previous visit)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/operator'), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-n-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
          <p className="eyebrow tracking-[0.15em]">Partner Portal</p>
        </div>
        <div className="bg-n-surface border border-n-border rounded-nomara p-6 max-w-sm w-full text-center">
          <p className="text-n-cream mb-2">This invite link has expired or is invalid.</p>
          <p className="text-n-cream-muted text-sm mb-4">Please ask Nomara to send a new invite.</p>
          <button
            onClick={() => router.push('/operator')}
            className="text-n-gold hover:underline text-sm"
          >
            Go to login →
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
        </div>
        <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-6 max-w-sm w-full text-center">
          <span className="text-n-gold text-2xl mb-3 block">✓</span>
          <p className="text-n-cream font-medium mb-2">Password set successfully!</p>
          <p className="text-n-cream-muted text-sm">Redirecting to portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
        <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
        <p className="eyebrow tracking-[0.15em]">Partner Portal</p>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="font-serif-italic text-n-cream text-2xl text-center mb-2">
          Welcome to Nomara
        </h2>
        <p className="text-n-cream-muted text-sm text-center mb-6">
          Set your password to access the partner portal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow block mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Type password again"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-3.5 rounded-nomara transition-colors"
          >
            {submitting ? 'Setting password...' : 'Set Password & Enter Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
