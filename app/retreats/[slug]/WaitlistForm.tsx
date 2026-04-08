'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  retreatId: string
  retreatName: string
}

export default function WaitlistForm({ retreatId, retreatName }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [travelDates, setTravelDates] = useState('')
  const [partySize, setPartySize] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase.from('retreat_waitlists').insert({
      retreat_id: retreatId,
      full_name: fullName,
      email,
      phone: phone || null,
      travel_dates: travelDates || null,
      party_size: partySize ? parseInt(partySize) : null,
      message: message || null,
    })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-8 text-center">
        <span className="text-n-gold text-2xl block mb-3">✦</span>
        <h3 className="font-serif-italic text-n-cream text-2xl mb-2">You&apos;re on the list</h3>
        <p className="text-n-cream-muted text-sm">
          Thanks {fullName.split(' ')[0]}! We&apos;ve received your inquiry for <strong className="text-n-cream">{retreatName}</strong>. The Nomara team will be in touch within 48 hours with next steps.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
      <div className="mb-6">
        <p className="eyebrow mb-2">✦ Join the Waitlist</p>
        <h3 className="font-serif-italic text-n-cream text-2xl mb-1">Reserve Your Spot</h3>
        <p className="text-n-cream-muted text-sm">Tell us about your trip and we&apos;ll be in touch within 48 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="eyebrow block mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="eyebrow block mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="eyebrow block mb-2">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow block mb-2">Travel Dates</label>
            <input
              type="text"
              value={travelDates}
              onChange={e => setTravelDates(e.target.value)}
              placeholder="e.g. May 2026"
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Party Size</label>
            <input
              type="number"
              value={partySize}
              onChange={e => setPartySize(e.target.value)}
              min={1}
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="eyebrow block mb-2">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Anything we should know?"
            className="resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-4 rounded-nomara transition-colors text-[16px]"
        >
          {submitting ? 'Submitting...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  )
}
