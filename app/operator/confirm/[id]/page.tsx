'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(2).png'

interface Booking {
  id: string
  traveler_name: string
  travel_dates: string
  duration_days: number | null
  booking_amount: number
  commission_rate: number
  commission_owed: number
  confirmation_status: string
  operator_id: string
  retreats: { retreat_name: string } | null
}

export default function ConfirmBookingPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'confirmed' | 'disputed' | 'error'; message: string } | null>(null)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const checkAuthAndLoadBooking = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      setAuthenticated(true)
      const { data, error: fetchError } = await supabase
        .from('operator_booking_reports')
        .select('*, retreats(retreat_name)')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !data) {
        setError('Booking not found.')
      } else {
        setBooking(data as unknown as Booking)
      }
      setLoading(false)
    }

    checkAuthAndLoadBooking()
  }, [bookingId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError('Invalid email or password')
      return
    }
    // Refetch
    setLoading(true)
    window.location.reload()
  }

  const handleAction = async (action: 'confirm' | 'dispute') => {
    if (action === 'dispute' && !disputeReason.trim()) {
      setError('Please tell us what\'s wrong so we can sort it out.')
      return
    }

    setSubmitting(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/confirm-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        booking_id: bookingId,
        action,
        dispute_reason: action === 'dispute' ? disputeReason : undefined,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      setResult({
        type: action === 'confirm' ? 'confirmed' : 'disputed',
        message: data.message || (action === 'confirm' ? 'Booking confirmed' : 'Dispute received'),
      })
    } else {
      setError(data.error || 'Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-n-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Not logged in — show login form ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
          <p className="eyebrow tracking-[0.15em]">Confirm Booking</p>
        </div>

        <div className="bg-n-surface border border-n-border rounded-nomara p-6 max-w-sm w-full">
          <p className="text-n-cream-muted text-sm mb-4 text-center">
            Please log in to confirm this booking.
          </p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3.5 rounded-nomara transition-colors"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Success state ──
  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
        </div>
        <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-8 max-w-md w-full text-center">
          <span className="text-n-gold text-3xl block mb-3">✦</span>
          <h2 className="font-serif-italic text-n-cream text-2xl mb-2">
            {result.type === 'confirmed' ? 'Booking Confirmed' : 'We\'re on it'}
          </h2>
          <p className="text-n-cream-muted text-sm mb-6">{result.message}</p>
          <button
            onClick={() => router.push('/operator')}
            className="bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3 px-6 rounded-nomara transition-colors text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Not found / error ──
  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-n-surface border border-n-border rounded-nomara p-8 max-w-md w-full text-center">
          <p className="text-n-cream mb-2">Booking not found</p>
          <p className="text-n-cream-muted text-sm mb-5">{error || 'This booking may have been removed.'}</p>
          <button
            onClick={() => router.push('/operator')}
            className="text-n-gold hover:underline text-sm"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  // ── Already handled ──
  if (booking.confirmation_status !== 'pending_confirmation') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-n-surface border border-n-border rounded-nomara p-8 max-w-md w-full text-center">
          <span className="text-n-gold text-2xl block mb-3">✦</span>
          <p className="text-n-cream mb-2">This booking is already <strong>{booking.confirmation_status}</strong></p>
          <p className="text-n-cream-muted text-sm mb-5">No further action needed.</p>
          <button
            onClick={() => router.push('/operator')}
            className="bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3 px-6 rounded-nomara transition-colors text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Main confirmation UI ──
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
          <p className="eyebrow tracking-[0.15em]">Booking Confirmation</p>
        </div>

        <div className="mb-8">
          <h1 className="font-serif-italic text-n-cream text-3xl md:text-4xl leading-tight mb-3 text-center">
            Please review this booking
          </h1>
          <p className="text-n-cream-muted text-[15px] text-center max-w-md mx-auto">
            We filed this on your behalf based on our records. Confirm the details and we&apos;ll send your commission invoice within 48 hours.
          </p>
        </div>

        {/* Booking details card */}
        <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8 mb-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="eyebrow text-[10px] py-3 pr-4 align-top w-[140px]">Retreat</td>
                <td className="py-3 text-n-cream">{booking.retreats?.retreat_name || '—'}</td>
              </tr>
              <tr className="border-t border-n-border">
                <td className="eyebrow text-[10px] py-3 pr-4 align-top">Traveler</td>
                <td className="py-3 text-n-cream">{booking.traveler_name}</td>
              </tr>
              <tr className="border-t border-n-border">
                <td className="eyebrow text-[10px] py-3 pr-4 align-top">Dates</td>
                <td className="py-3 text-n-cream">{booking.travel_dates}</td>
              </tr>
              {booking.duration_days && (
                <tr className="border-t border-n-border">
                  <td className="eyebrow text-[10px] py-3 pr-4 align-top">Duration</td>
                  <td className="py-3 text-n-cream">{booking.duration_days} days</td>
                </tr>
              )}
              <tr className="border-t border-n-border">
                <td className="eyebrow text-[10px] py-3 pr-4 align-top">Booking Amount</td>
                <td className="py-3 text-n-cream">{formatCurrency(Number(booking.booking_amount))}</td>
              </tr>
              <tr className="border-t border-n-border">
                <td className="eyebrow text-[10px] py-3 pr-4 align-top">Commission ({booking.commission_rate}%)</td>
                <td className="py-3 text-n-gold font-serif-italic text-2xl">{formatCurrency(Number(booking.commission_owed))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mb-4 bg-red-400/10 border border-red-400/30 rounded-nomara p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {showDisputeForm ? (
          <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
            <p className="eyebrow mb-3">✦ Flag an issue</p>
            <h3 className="font-serif-italic text-n-cream text-xl mb-4">What&apos;s wrong?</h3>
            <textarea
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              rows={4}
              placeholder="e.g. The booking amount is different, the traveler didn't show up, wrong dates..."
              className="resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAction('dispute')}
                disabled={submitting}
                className="flex-1 bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-3 rounded-nomara transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
              <button
                onClick={() => { setShowDisputeForm(false); setError('') }}
                className="px-5 bg-n-surface border border-n-cream/20 text-n-cream hover:bg-[#153a22] font-medium rounded-nomara transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAction('confirm')}
              disabled={submitting}
              className="flex-1 bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-4 rounded-nomara transition-colors text-[16px]"
            >
              {submitting ? 'Confirming...' : '✓ Confirm Booking'}
            </button>
            <button
              onClick={() => setShowDisputeForm(true)}
              className="px-6 bg-n-surface border border-n-cream/20 text-n-cream-muted hover:text-n-cream hover:bg-[#153a22] font-medium py-4 rounded-nomara transition-colors text-sm"
            >
              Something&apos;s wrong
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
