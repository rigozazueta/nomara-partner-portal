'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

interface Retreat {
  id: string
  retreat_name: string
  operator_id: string
  location_town: string | null
}

interface Operator {
  id: string
  operator_name: string
  commission_rate: number | null
}

interface BookingReport {
  id: string
  traveler_name: string
  travel_dates: string
  booking_amount: number
  commission_owed: number
  commission_paid: boolean
  submitted_at: string
  retreats: { retreat_name: string } | null
  retreat_operators: { operator_name: string } | null
}

interface ReferralLink {
  id: string
  slug: string
  lead_name: string
  lead_email: string | null
  total_clicks: number
  active: boolean
  created_at: string
  retreats: { retreat_name: string } | null
}

interface RetreatListing {
  id: string
  slug: string | null
  retreat_name: string
  hero_image_url: string | null
  gallery_urls: string[] | null
  tagline: string | null
  about_trip: string | null
  results_list: string[] | null
  inclusions: string[] | null
  important_info: string | null
  full_address: string | null
  location_description: string | null
  listing_status: string
  listing_submitted_at: string | null
  listing_published_at: string | null
}

export default function OperatorPortal() {
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null)
  const [retreats, setRetreats] = useState<Retreat[]>([])
  const [selectedRetreatId, setSelectedRetreatId] = useState('')
  const [travelerName, setTravelerName] = useState('')
  const [travelerEmail, setTravelerEmail] = useState('')
  const [travelDates, setTravelDates] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [bookingAmount, setBookingAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [pastBookings, setPastBookings] = useState<BookingReport[]>([])
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)

  // Retreat listing state
  const [retreatListings, setRetreatListings] = useState<RetreatListing[]>([])
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [listingForm, setListingForm] = useState({
    hero_image_url: '',
    gallery_urls: '',
    tagline: '',
    about_trip: '',
    results_list: '',
    inclusions: '',
    important_info: '',
    full_address: '',
    location_description: '',
  })
  const [listingSubmitting, setListingSubmitting] = useState(false)
  const [listingMessage, setListingMessage] = useState('')

  // Auto-select retreat if operator only has one
  useEffect(() => {
    if (retreats.length === 1 && !selectedRetreatId) {
      setSelectedRetreatId(retreats[0].id)
    }
  }, [retreats, selectedRetreatId])

  const commissionRate = currentOperator?.commission_rate ?? 0
  const commissionOwed = bookingAmount
    ? (parseFloat(bookingAmount) * commissionRate) / 100
    : 0

  const fetchData = useCallback(async () => {
    // RLS auto-scopes these queries to the authenticated operator
    const [retreatRes, operatorRes, bookingsRes, listingsRes] = await Promise.all([
      supabase.from('retreats').select('id, retreat_name, operator_id, location_town').order('retreat_name'),
      supabase.from('retreat_operators').select('id, operator_name, commission_rate'),
      supabase
        .from('operator_booking_reports')
        .select('id, traveler_name, travel_dates, booking_amount, commission_owed, commission_paid, submitted_at, retreats(retreat_name), retreat_operators(operator_name)')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('retreats')
        .select('id, slug, retreat_name, hero_image_url, gallery_urls, tagline, about_trip, results_list, inclusions, important_info, full_address, location_description, listing_status, listing_submitted_at, listing_published_at')
        .order('retreat_name'),
    ])

    if (retreatRes.data) setRetreats(retreatRes.data)
    if (listingsRes.data) setRetreatListings(listingsRes.data as RetreatListing[])
    if (operatorRes.data && operatorRes.data.length > 0) {
      const op = operatorRes.data[0]
      setCurrentOperator(op)

      // Fetch referral links for this operator
      const { data: linksData } = await supabase
        .from('referral_links')
        .select('id, slug, lead_name, lead_email, total_clicks, active, created_at, retreats(retreat_name)')
        .eq('operator_id', op.id)
        .order('created_at', { ascending: false })

      if (linksData) setReferralLinks(linksData as unknown as ReferralLink[])
    }
    if (bookingsRes.data) setPastBookings(bookingsRes.data as unknown as BookingReport[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // Check for existing Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthenticated(true)
        fetchData()
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthenticated(true)
        fetchData()
      } else if (event === 'SIGNED_OUT') {
        setAuthenticated(false)
        setCurrentOperator(null)
        setRetreats([])
        setPastBookings([])
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError('Invalid email or password. Please try again.')
      return
    }

    // Auth state listener will handle the rest
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return

    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/operator/set-password`,
    })

    setForgotSent(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthenticated(false)
    setCurrentOperator(null)
  }

  const startEditingListing = (listing: RetreatListing) => {
    setEditingListingId(listing.id)
    setListingForm({
      hero_image_url: listing.hero_image_url || '',
      gallery_urls: listing.gallery_urls?.join('\n') || '',
      tagline: listing.tagline || '',
      about_trip: listing.about_trip || '',
      results_list: listing.results_list?.join('\n') || '',
      inclusions: listing.inclusions?.join('\n') || '',
      important_info: listing.important_info || '',
      full_address: listing.full_address || '',
      location_description: listing.location_description || '',
    })
  }

  const cancelEditingListing = () => {
    setEditingListingId(null)
    setListingMessage('')
  }

  const saveListing = async (action: 'save_draft' | 'submit_for_review') => {
    if (!editingListingId) return
    setListingSubmitting(true)
    setListingMessage('')

    const patch: Record<string, unknown> = {
      hero_image_url: listingForm.hero_image_url || null,
      gallery_urls: listingForm.gallery_urls
        ? listingForm.gallery_urls.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      tagline: listingForm.tagline || null,
      about_trip: listingForm.about_trip || null,
      results_list: listingForm.results_list
        ? listingForm.results_list.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      inclusions: listingForm.inclusions
        ? listingForm.inclusions.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      important_info: listingForm.important_info || null,
      full_address: listingForm.full_address || null,
      location_description: listingForm.location_description || null,
    }

    if (action === 'submit_for_review') {
      patch.listing_status = 'submitted'
      patch.listing_submitted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('retreats')
      .update(patch)
      .eq('id', editingListingId)

    if (error) {
      setListingMessage('Error saving. Please try again.')
      setListingSubmitting(false)
      return
    }

    setListingMessage(action === 'submit_for_review' ? 'Submitted for review!' : 'Draft saved.')
    setListingSubmitting(false)
    fetchData()
    setTimeout(() => {
      setEditingListingId(null)
      setListingMessage('')
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRetreatId || !travelerName || !travelDates || !durationDays || !bookingAmount || !currentOperator) return

    setSubmitting(true)

    const { error: reportError } = await supabase.from('operator_booking_reports').insert({
      operator_id: currentOperator.id,
      retreat_id: selectedRetreatId,
      traveler_name: travelerName,
      traveler_email: travelerEmail || null,
      travel_dates: travelDates,
      duration_days: parseInt(durationDays),
      booking_amount: parseFloat(bookingAmount),
      commission_rate: commissionRate,
      notes: notes || null,
    })

    if (reportError) {
      alert('Error submitting booking. Please try again.')
      setSubmitting(false)
      return
    }

    // Also insert into lead_retreat_matches (this table has no RLS, uses anon)
    await supabase.from('lead_retreat_matches').insert({
      lead_name: travelerName,
      lead_email: travelerEmail || null,
      booked_retreat_id: selectedRetreatId,
      booking_status: 'Booked',
      trip_price: parseFloat(bookingAmount),
      commission_rate: commissionRate,
      utm_source: 'partner_portal',
      utm_campaign: currentOperator.operator_name || 'operator_report',
      referral_partner: currentOperator.operator_name || null,
    })

    setSelectedRetreatId('')
    setTravelerName('')
    setTravelerEmail('')
    setTravelDates('')
    setDurationDays('')
    setBookingAmount('')
    setNotes('')
    setSubmitting(false)
    setSubmitted(true)
    fetchData()
    setTimeout(() => setSubmitted(false), 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-n-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
          <p className="eyebrow tracking-[0.15em]">Partner Portal</p>
        </div>

        {showForgotPassword ? (
          <div className="w-full max-w-sm">
            {forgotSent ? (
              <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-5 text-center">
                <span className="text-n-gold text-xl block mb-2">✦</span>
                <p className="text-n-cream mb-1">Reset link sent!</p>
                <p className="text-n-cream-muted text-sm mb-4">Check your email for a password reset link.</p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail('') }}
                  className="text-n-gold hover:underline text-sm"
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-n-cream text-sm text-center mb-2">
                  Enter your email and we&apos;ll send a password reset link.
                </p>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3.5 rounded-nomara transition-colors"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-n-cream-muted hover:text-n-cream text-sm transition-colors py-2"
                >
                  ← Back to login
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3">
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
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3.5 rounded-nomara transition-colors"
            >
              Enter Portal
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-n-cream-muted hover:text-n-cream text-sm transition-colors py-1"
            >
              Forgot password?
            </button>
          </form>
        )}
      </div>
    )
  }

  // ── Main Portal ──
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-n-border py-4 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="Nomara" width={110} height={40} />
            <span className="eyebrow text-[10px] tracking-[0.15em] mt-0.5">Partner Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {currentOperator && (
              <span className="text-n-cream-muted text-sm hidden sm:inline">
                {currentOperator.operator_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-n-cream-muted hover:text-n-cream text-sm transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-12">
        {/* Success message */}
        {submitted && (
          <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-5 text-n-cream">
            <span className="text-n-gold mr-2">✦</span>
            Thanks! We&apos;ll send your commission invoice within 48 hours.
          </div>
        )}

        {/* ═══ Welcome / Title ═══ */}
        <div>
          <p className="eyebrow mb-3">✦ Partner Dashboard</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-3">
            Welcome back{currentOperator?.operator_name ? `, ${currentOperator.operator_name}` : ''}
          </h2>
          <p className="text-n-cream-muted text-[16px]">
            Here&apos;s how your Nomara partnership is performing.
          </p>
        </div>

        {/* ═══ Hero KPI Cards ═══ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const totalClicks = referralLinks.reduce((sum, l) => sum + (l.total_clicks || 0), 0)
            const totalBookings = pastBookings.length
            const totalReferred = pastBookings.reduce((sum, b) => sum + Number(b.booking_amount), 0)
            const totalCommission = pastBookings.reduce((sum, b) => sum + Number(b.commission_owed), 0)
            return (
              <>
                <KPICard label="Link Clicks" value={totalClicks.toString()} />
                <KPICard label="Bookings Reported" value={totalBookings.toString()} />
                <KPICard label="Total Referred" value={formatCurrency(totalReferred)} />
                <KPICard label="Commission Earned" value={formatCurrency(totalCommission)} highlight />
              </>
            )
          })()}
        </section>

        {/* ═══ My Retreat Listing Section ═══ */}
        <section>
          <div className="mb-5">
            <p className="eyebrow mb-3">✦ My Retreat Listing</p>
            <h3 className="font-serif-italic text-n-cream text-2xl">
              Public Retreat Page
            </h3>
            <p className="text-n-cream-muted text-sm mt-1">
              Your retreat&apos;s public listing on the Nomara directory.
            </p>
          </div>

          {retreatListings.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-8 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <p className="text-n-cream font-medium mb-2">No retreats linked yet</p>
              <p className="text-n-cream-muted text-sm max-w-md mx-auto">
                Contact Nomara to add your retreat to the directory.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {retreatListings.map(listing => {
                const isEditing = editingListingId === listing.id
                const statusColors: Record<string, string> = {
                  draft: 'border-n-cream/20 text-n-cream-muted',
                  submitted: 'border-n-gold/40 text-n-gold',
                  published: 'bg-n-gold/20 text-n-gold border border-n-gold/20',
                  archived: 'border-n-cream/20 text-n-cream-muted',
                }
                const statusLabels: Record<string, string> = {
                  draft: 'Draft',
                  submitted: 'In Review',
                  published: 'Published',
                  archived: 'Archived',
                }

                return (
                  <div key={listing.id} className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
                    {/* Card header */}
                    <div className="p-5 md:p-6 flex flex-wrap items-start justify-between gap-4 border-b border-n-border">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-n-cream font-medium text-lg">{listing.retreat_name}</h4>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[listing.listing_status] || statusColors.draft}`}>
                            {statusLabels[listing.listing_status] || 'Draft'}
                          </span>
                        </div>
                        {listing.listing_status === 'published' && listing.slug && (
                          <a
                            href={`/retreats/${listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-n-gold hover:underline text-sm"
                          >
                            View public page →
                          </a>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => startEditingListing(listing)}
                          className="px-4 py-2 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors whitespace-nowrap"
                        >
                          {listing.about_trip ? 'Edit Listing' : 'Create Listing'}
                        </button>
                      )}
                    </div>

                    {/* Editor form */}
                    {isEditing && (
                      <div className="p-5 md:p-8 space-y-5">
                        <div>
                          <label className="eyebrow block mb-2">Hero Image URL</label>
                          <input
                            type="url"
                            value={listingForm.hero_image_url}
                            onChange={e => setListingForm({ ...listingForm, hero_image_url: e.target.value })}
                            placeholder="https://..."
                          />
                          <p className="text-n-cream-muted text-xs mt-1">Main image that shows first in the carousel.</p>
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Additional Photos (one URL per line)</label>
                          <textarea
                            value={listingForm.gallery_urls}
                            onChange={e => setListingForm({ ...listingForm, gallery_urls: e.target.value })}
                            rows={4}
                            placeholder={'https://...photo2.jpg\nhttps://...photo3.jpg\nhttps://...photo4.jpg'}
                            className="resize-none"
                          />
                          <p className="text-n-cream-muted text-xs mt-1">These will appear after the hero image in the carousel.</p>
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Tagline</label>
                          <input
                            type="text"
                            value={listingForm.tagline}
                            onChange={e => setListingForm({ ...listingForm, tagline: e.target.value })}
                            placeholder="One-line pitch (e.g. No experience needed. Surf, yoga, and mindful living.)"
                          />
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">About Your Trip</label>
                          <textarea
                            value={listingForm.about_trip}
                            onChange={e => setListingForm({ ...listingForm, about_trip: e.target.value })}
                            rows={6}
                            placeholder="Describe what makes your retreat special. What's the vibe? Who is it for?"
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Results (one per line)</label>
                          <textarea
                            value={listingForm.results_list}
                            onChange={e => setListingForm({ ...listingForm, results_list: e.target.value })}
                            rows={5}
                            placeholder={'Solid surf foundations\nStronger core, better balance\nBreath tools to calm stress\nDeeper, more restful sleep'}
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Inclusions (one per line)</label>
                          <textarea
                            value={listingForm.inclusions}
                            onChange={e => setListingForm({ ...listingForm, inclusions: e.target.value })}
                            rows={5}
                            placeholder={'6-night / 7-day villa stay\n3 gourmet meals daily\n5x 90-minute surf sessions\nAirport transfers'}
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Full Address</label>
                          <input
                            type="text"
                            value={listingForm.full_address}
                            onChange={e => setListingForm({ ...listingForm, full_address: e.target.value })}
                            placeholder="e.g. Playa Guiones, Nosara, Guanacaste, Costa Rica"
                          />
                          <p className="text-n-cream-muted text-xs mt-1">Used to show a map on your public page.</p>
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">About the Location</label>
                          <textarea
                            value={listingForm.location_description}
                            onChange={e => setListingForm({ ...listingForm, location_description: e.target.value })}
                            rows={3}
                            placeholder="Describe the area — nearby beaches, vibe of the town, what travelers can explore..."
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="eyebrow block mb-2">Important Info</label>
                          <textarea
                            value={listingForm.important_info}
                            onChange={e => setListingForm({ ...listingForm, important_info: e.target.value })}
                            rows={4}
                            placeholder="Anything travelers should know before booking (health, dietary, cancellation, etc.)"
                            className="resize-none"
                          />
                        </div>

                        {listingMessage && (
                          <p className={`text-sm ${listingMessage.includes('Error') ? 'text-red-400' : 'text-n-gold'}`}>
                            {listingMessage}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => saveListing('save_draft')}
                            disabled={listingSubmitting}
                            className="px-5 py-2.5 bg-n-surface hover:bg-[#153a22] border border-n-cream/20 text-n-cream font-medium rounded-nomara transition-colors disabled:opacity-50"
                          >
                            Save Draft
                          </button>
                          <button
                            onClick={() => saveListing('submit_for_review')}
                            disabled={listingSubmitting}
                            className="px-5 py-2.5 bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors disabled:opacity-50"
                          >
                            {listingSubmitting ? 'Saving...' : 'Submit for Review'}
                          </button>
                          <button
                            onClick={cancelEditingListing}
                            className="px-5 py-2.5 text-n-cream-muted hover:text-n-cream text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ═══ Referral Links Section ═══ */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="eyebrow mb-3">✦ Referral Links</p>
              <h3 className="font-serif-italic text-n-cream text-2xl">
                Travelers Sent Your Way
              </h3>
            </div>
          </div>

          {referralLinks.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-8 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <p className="text-n-cream font-medium mb-2">No referrals yet</p>
              <p className="text-n-cream-muted text-sm max-w-md mx-auto">
                When Nomara sends a traveler your way, their personalized referral link will appear here — along with real-time click tracking.
              </p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Traveler</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Sent</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Clicks</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralLinks.map(link => (
                      <tr key={link.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{link.lead_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{link.retreats?.retreat_name || '—'}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">
                          {new Date(link.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 text-right text-n-gold font-medium text-base">
                          {link.total_clicks || 0}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {link.active ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
                              Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Recent Bookings Section ═══ */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="eyebrow mb-3">✦ Your Bookings</p>
              <h3 className="font-serif-italic text-n-cream text-2xl">
                Commission History
              </h3>
            </div>
            <button
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="px-4 py-2 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors whitespace-nowrap"
            >
              {showBookingForm ? 'Close Form' : '+ Report a Booking'}
            </button>
          </div>

          {pastBookings.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-8 text-center">
              <p className="text-n-cream-muted text-sm">
                No bookings reported yet. After a Nomara-referred traveler completes their stay, report it here to receive your commission.
              </p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Traveler</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Dates</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Amount</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Commission</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-5 font-medium">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.map(b => (
                      <tr key={b.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{b.traveler_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{b.travel_dates}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{formatCurrency(b.booking_amount)}</td>
                        <td className="py-3.5 px-3 text-right text-n-gold font-medium">
                          {formatCurrency(b.commission_owed)}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {b.commission_paid ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Collapsible Booking Form ═══ */}
        {showBookingForm && (
        <section>
          <p className="eyebrow mb-3">✦ Report a New Booking</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Submit Booking Details
          </h3>
        <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Retreat select */}
            <div>
              <label className="eyebrow block mb-2">
                Your Retreat <span className="text-red-400">*</span>
              </label>
              {retreats.length === 1 ? (
                <div className="bg-n-bg border border-n-border rounded-lg p-3 text-n-cream">
                  {retreats[0].retreat_name}{retreats[0].location_town ? ` — ${retreats[0].location_town}` : ''}
                </div>
              ) : (
                <select
                  value={selectedRetreatId}
                  onChange={e => setSelectedRetreatId(e.target.value)}
                  required
                >
                  <option value="">Select a retreat...</option>
                  {retreats.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.retreat_name}{r.location_town ? ` — ${r.location_town}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Traveler name */}
            <div>
              <label className="eyebrow block mb-2">
                Traveler Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={travelerName}
                onChange={e => setTravelerName(e.target.value)}
                required
                placeholder="e.g. Sarah Johnson"
              />
            </div>

            {/* Traveler email */}
            <div>
              <label className="eyebrow block mb-2">Traveler Email</label>
              <input
                type="email"
                value={travelerEmail}
                onChange={e => setTravelerEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {/* Travel dates & duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="eyebrow block mb-2">
                  Travel Dates <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={travelDates}
                  onChange={e => setTravelDates(e.target.value)}
                  required
                  placeholder="e.g. May 12–18, 2026"
                />
              </div>
              <div>
                <label className="eyebrow block mb-2">
                  Duration (days) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={e => setDurationDays(e.target.value)}
                  required
                  min={1}
                  placeholder="7"
                />
              </div>
            </div>

            {/* Booking amount */}
            <div>
              <label className="eyebrow block mb-2">
                Total Booking Amount (USD) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-n-cream-muted">$</span>
                <input
                  type="number"
                  value={bookingAmount}
                  onChange={e => setBookingAmount(e.target.value)}
                  required
                  min={0}
                  step="0.01"
                  placeholder="2,500.00"
                  className="!pl-8"
                />
              </div>
            </div>

            {/* Commission info card */}
            {(selectedRetreatId || retreats.length === 1) && (
              <div className="bg-n-bg border border-n-gold/30 rounded-nomara p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="eyebrow text-[10px]">Commission Rate</span>
                  <span className="text-n-cream font-medium">{commissionRate}%</span>
                </div>
                <div className="h-[1px] bg-n-border mb-3" />
                <div className="flex justify-between items-center">
                  <span className="eyebrow text-[10px]">Commission Owed</span>
                  <span className="text-n-gold text-2xl font-serif-italic">
                    {formatCurrency(commissionOwed)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="eyebrow block mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional details..."
                className="resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-4 rounded-nomara transition-colors text-[16px]"
            >
              {submitting ? 'Submitting...' : 'Submit Booking Report'}
            </button>
          </form>
        </div>
        </section>
        )}
      </main>
    </div>
  )
}

function KPICard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-n-surface border border-n-border rounded-nomara p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-n-gold" />
      <p className={`text-[28px] md:text-[32px] font-light mt-1 mb-1 ${highlight ? 'text-n-gold' : 'text-n-cream'}`}>
        {value}
      </p>
      <p className="eyebrow text-[10px]">{label}</p>
    </div>
  )
}
