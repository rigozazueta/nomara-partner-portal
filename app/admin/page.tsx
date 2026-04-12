'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatCurrency, daysSince } from '@/lib/utils'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

// ─── Types ───────────────────────────────────────────

interface Operator {
  id: string
  operator_name: string
  email: string | null
  auth_user_id: string | null
  commission_rate: number | null
}

interface Retreat {
  id: string
  retreat_name: string
  operator_id: string
  location_town: string | null
  bookretreats_url: string | null
}

interface BookingReport {
  id: string
  operator_id: string
  retreat_id: string
  traveler_name: string
  traveler_email: string | null
  travel_dates: string
  duration_days: number | null
  booking_amount: number
  commission_rate: number
  commission_owed: number
  commission_paid: boolean
  commission_paid_date: string | null
  notes: string | null
  submitted_at: string
  reviewed: boolean
  invoice_sent: boolean
  invoice_sent_date: string | null
  confirmation_status: 'pending_confirmation' | 'confirmed' | 'disputed'
  confirmed_at: string | null
  created_by: 'admin' | 'operator' | null
  retreat_operators: { operator_name: string } | null
  retreats: { retreat_name: string } | null
}

interface OperatorSummary {
  operator_name: string
  total_bookings: number
  total_revenue: number
  total_commission_owed: number
  total_commission_paid: number
  outstanding: number
}

interface ReferralLink {
  id: string
  slug: string
  operator_id: string
  retreat_id: string | null
  lead_name: string
  lead_email: string | null
  lead_instagram: string | null
  destination_url: string
  created_at: string
  expires_at: string | null
  active: boolean
  total_clicks: number
  notes: string | null
  retreat_operators: { operator_name: string } | null
  retreats: { retreat_name: string } | null
}

interface ReferralClick {
  id: string
  clicked_at: string
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  country: string | null
}

interface PartnerApplication {
  id: string
  contact_name: string
  business_name: string
  email: string
  location: string | null
  message: string | null
  status: string
  created_at: string
}

interface RetreatListing {
  id: string
  slug: string | null
  retreat_name: string
  operator_id: string
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
  retreat_operators: { operator_name: string } | null
}

interface RetreatReview {
  id: string
  retreat_id: string
  reviewer_name: string
  reviewer_email: string | null
  rating: number
  review_text: string
  travel_date: string | null
  approved: boolean
  source: string
  created_at: string
  retreats: { retreat_name: string } | null
}

interface ItineraryDay {
  id: string
  retreat_id: string
  day_number: number
  title: string
  activities: string[] | null
  image_url: string | null
}

interface RetreatWaitlist {
  id: string
  retreat_id: string
  full_name: string
  email: string
  phone: string | null
  travel_dates: string | null
  party_size: number | null
  message: string | null
  status: string
  created_at: string
  referral_link_id: string | null
  retreats: { retreat_name: string } | null
  referral_links: { slug: string; lead_name: string } | null
}

// ─── Component ───────────────────────────────────────

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Existing state
  const [bookings, setBookings] = useState<BookingReport[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [filterOperator, setFilterOperator] = useState('')
  const [filterPaid, setFilterPaid] = useState<'' | 'paid' | 'unpaid'>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // New referral state
  const [retreats, setRetreats] = useState<Retreat[]>([])
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [trackedEmails, setTrackedEmails] = useState<Set<string>>(new Set())

  // Create link form
  const [linkLeadName, setLinkLeadName] = useState('')
  const [linkLeadEmail, setLinkLeadEmail] = useState('')
  const [linkLeadInstagram, setLinkLeadInstagram] = useState('')
  const [linkOperatorId, setLinkOperatorId] = useState('')
  const [linkRetreatId, setLinkRetreatId] = useState('')
  const [linkDestUrl, setLinkDestUrl] = useState('')
  const [linkSlug, setLinkSlug] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [linkExpiresAt, setLinkExpiresAt] = useState('')
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [linkCreated, setLinkCreated] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // Click expand state
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)
  const [expandedClicks, setExpandedClicks] = useState<ReferralClick[]>([])

  // Partner applications state
  const [applications, setApplications] = useState<PartnerApplication[]>([])
  const [approvingAppId, setApprovingAppId] = useState<string | null>(null)
  const [approveMessage, setApproveMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null)

  // File Booking form state
  const [showFileBookingForm, setShowFileBookingForm] = useState(false)
  const [fbOperatorId, setFbOperatorId] = useState('')
  const [fbRetreatId, setFbRetreatId] = useState('')
  const [fbTravelerName, setFbTravelerName] = useState('')
  const [fbTravelerEmail, setFbTravelerEmail] = useState('')
  const [fbTravelDates, setFbTravelDates] = useState('')
  const [fbDurationDays, setFbDurationDays] = useState('')
  const [fbBookingAmount, setFbBookingAmount] = useState('')
  const [fbNotes, setFbNotes] = useState('')
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [fbMessage, setFbMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Retreat listings state
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

  // Itinerary state (keyed by retreat_id)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([])
  const [editingItineraryRetreat, setEditingItineraryRetreat] = useState<string | null>(null)
  const [newDay, setNewDay] = useState({
    day_number: 1,
    title: '',
    activities: '',
    image_url: '',
  })

  // Reviews state
  const [reviews, setReviews] = useState<RetreatReview[]>([])
  const [newReview, setNewReview] = useState({
    retreat_id: '',
    reviewer_name: '',
    rating: 5,
    review_text: '',
    travel_date: '',
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Waitlist state
  const [waitlists, setWaitlists] = useState<RetreatWaitlist[]>([])

  // Operator invite state
  const [invitingOperatorId, setInvitingOperatorId] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null)

  // ─── Data fetching ─────────────────────────────────

  const fetchData = useCallback(async () => {
    const [bookingsRes, operatorsRes, retreatsRes, linksRes, clickCountRes, appsRes, listingsRes, waitlistsRes, reviewsRes, itineraryRes] = await Promise.all([
      supabase
        .from('operator_booking_reports')
        .select('*, retreat_operators(operator_name), retreats(retreat_name)')
        .order('submitted_at', { ascending: false }),
      supabase.from('retreat_operators').select('id, operator_name, email, auth_user_id, commission_rate').order('operator_name'),
      supabase.from('retreats').select('id, retreat_name, operator_id, location_town, bookretreats_url').order('retreat_name'),
      supabase
        .from('referral_links')
        .select('*, retreat_operators(operator_name), retreats(retreat_name)')
        .order('created_at', { ascending: false }),
      supabase.from('referral_clicks').select('id', { count: 'exact', head: true }),
      supabase.from('partner_applications').select('*').order('created_at', { ascending: false }),
      supabase
        .from('retreats')
        .select('id, slug, retreat_name, operator_id, hero_image_url, gallery_urls, tagline, about_trip, results_list, inclusions, important_info, full_address, location_description, listing_status, listing_submitted_at, listing_published_at, retreat_operators(operator_name)')
        .order('listing_submitted_at', { ascending: false, nullsFirst: false }),
      supabase
        .from('retreat_waitlists')
        .select('*, retreats(retreat_name), referral_links(slug, lead_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('retreat_reviews')
        .select('*, retreats(retreat_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('retreat_itinerary_days')
        .select('*')
        .order('day_number'),
    ])

    if (bookingsRes.data) setBookings(bookingsRes.data as unknown as BookingReport[])
    if (operatorsRes.data) setOperators(operatorsRes.data)
    if (retreatsRes.data) setRetreats(retreatsRes.data)
    if (linksRes.data) {
      setReferralLinks(linksRes.data as unknown as ReferralLink[])
      // Build set of tracked emails for "From link?" badge
      const emails = new Set<string>()
      for (const l of linksRes.data as unknown as ReferralLink[]) {
        if (l.lead_email) emails.add(l.lead_email.toLowerCase())
      }
      setTrackedEmails(emails)
    }
    setTotalClicks(clickCountRes.count ?? 0)
    if (appsRes.data) setApplications(appsRes.data as PartnerApplication[])
    if (listingsRes.data) setRetreatListings(listingsRes.data as unknown as RetreatListing[])
    if (waitlistsRes.data) setWaitlists(waitlistsRes.data as unknown as RetreatWaitlist[])
    if (reviewsRes.data) setReviews(reviewsRes.data as unknown as RetreatReview[])
    if (itineraryRes.data) setItineraryDays(itineraryRes.data as ItineraryDay[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // Check for existing Supabase Auth session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Verify this user is an admin
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle()

        if (adminRow) {
          setAuthenticated(true)
          fetchData()
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle()

        if (adminRow) {
          setAuthenticated(true)
          fetchData()
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthenticated(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchData])

  // ─── Existing actions ──────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError('Invalid email or password.')
      return
    }

    // The auth state listener will verify admin status and call fetchData
  }

  const markInvoiceSent = async (id: string) => {
    await supabase
      .from('operator_booking_reports')
      .update({ invoice_sent: true, invoice_sent_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    fetchData()
  }

  const markPaid = async (id: string) => {
    await supabase
      .from('operator_booking_reports')
      .update({ commission_paid: true, commission_paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    fetchData()
  }

  // ─── Referral link actions ─────────────────────────

  const generateSlug = (name: string, opId: string) => {
    const op = operators.find(o => o.id === opId)
    const opSlug = op ? op.operator_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') : ''
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    return `${nameSlug}-${opSlug}`.replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  // Auto-update slug when lead name or operator changes
  useEffect(() => {
    if (linkLeadName && linkOperatorId) {
      setLinkSlug(generateSlug(linkLeadName, linkOperatorId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkLeadName, linkOperatorId])

  // Auto-update destination URL when retreat changes
  useEffect(() => {
    if (linkRetreatId) {
      const r = retreats.find(rt => rt.id === linkRetreatId)
      if (r?.bookretreats_url) setLinkDestUrl(r.bookretreats_url)
    }
  }, [linkRetreatId, retreats])

  const filteredRetreatsForLink = linkOperatorId
    ? retreats.filter(r => r.operator_id === linkOperatorId)
    : retreats

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkLeadName || !linkOperatorId || !linkSlug || !linkDestUrl) return
    setLinkSubmitting(true)

    const instagram = linkLeadInstagram
      ? linkLeadInstagram.startsWith('@') ? linkLeadInstagram : `@${linkLeadInstagram}`
      : null

    const { error } = await supabase.from('referral_links').insert({
      slug: linkSlug,
      operator_id: linkOperatorId,
      retreat_id: linkRetreatId || null,
      lead_name: linkLeadName,
      lead_email: linkLeadEmail || null,
      lead_instagram: instagram,
      destination_url: linkDestUrl,
      notes: linkNotes || null,
      expires_at: linkExpiresAt || null,
      active: true,
    })

    setLinkSubmitting(false)

    if (error) {
      alert(error.message.includes('unique') ? 'That slug is already taken — try a different one.' : `Error: ${error.message}`)
      return
    }

    setLinkCreated(linkSlug)
    setLinkLeadName('')
    setLinkLeadEmail('')
    setLinkLeadInstagram('')
    setLinkOperatorId('')
    setLinkRetreatId('')
    setLinkDestUrl('')
    setLinkSlug('')
    setLinkNotes('')
    setLinkExpiresAt('')
    fetchData()
    setTimeout(() => setLinkCreated(''), 8000)
  }

  const toggleLinkActive = async (id: string, currentActive: boolean) => {
    await supabase.from('referral_links').update({ active: !currentActive }).eq('id', id)
    fetchData()
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this referral link? This cannot be undone.')) return
    await supabase.from('referral_links').delete().eq('id', id)
    fetchData()
  }

  const viewClicks = async (linkId: string) => {
    if (expandedLinkId === linkId) {
      setExpandedLinkId(null)
      return
    }
    const { data } = await supabase
      .from('referral_clicks')
      .select('id, clicked_at, ip_address, user_agent, referer, country')
      .eq('referral_link_id', linkId)
      .order('clicked_at', { ascending: false })
      .limit(10)
    setExpandedClicks((data as ReferralClick[]) || [])
    setExpandedLinkId(linkId)
  }

  const copyToClipboard = (slug: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${baseUrl}/go/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  // ─── Approve application ──────────────────────────

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    return headers
  }

  // ─── Retreat listings ─────────────────────────────

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

  const publishListing = async (retreatId: string, action: 'publish' | 'save_draft' | 'unpublish') => {
    setListingSubmitting(true)
    try {
      const headers = await getAuthHeaders()
      const updates = action === 'save_draft' || action === 'publish' ? {
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
      } : {}

      const res = await fetch('/api/publish-retreat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ retreat_id: retreatId, action, updates }),
      })

      if (res.ok) {
        setEditingListingId(null)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
    setListingSubmitting(false)
  }

  // ─── Waitlist ─────────────────────────────────────

  const updateWaitlistStatus = async (id: string, status: string) => {
    await supabase.from('retreat_waitlists').update({ status }).eq('id', id)
    fetchData()
  }

  // ─── Reviews ──────────────────────────────────────

  const submitReview = async () => {
    if (!newReview.retreat_id || !newReview.reviewer_name || !newReview.review_text) return
    setReviewSubmitting(true)
    await supabase.from('retreat_reviews').insert({
      retreat_id: newReview.retreat_id,
      reviewer_name: newReview.reviewer_name,
      rating: newReview.rating,
      review_text: newReview.review_text,
      travel_date: newReview.travel_date || null,
      approved: true,
      source: 'manual',
    })
    setNewReview({ retreat_id: '', reviewer_name: '', rating: 5, review_text: '', travel_date: '' })
    setReviewSubmitting(false)
    fetchData()
  }

  const toggleReviewApproved = async (id: string, approved: boolean) => {
    await supabase.from('retreat_reviews').update({ approved }).eq('id', id)
    fetchData()
  }

  const deleteReview = async (id: string) => {
    await supabase.from('retreat_reviews').delete().eq('id', id)
    fetchData()
  }

  // ─── Itinerary ──────────────────────────────────

  const addDay = async (retreatId: string) => {
    if (!newDay.title) return
    await supabase.from('retreat_itinerary_days').insert({
      retreat_id: retreatId,
      day_number: newDay.day_number,
      title: newDay.title,
      activities: newDay.activities
        ? newDay.activities.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      image_url: newDay.image_url || null,
    })
    setNewDay({ day_number: newDay.day_number + 1, title: '', activities: '', image_url: '' })
    fetchData()
  }

  const deleteDay = async (id: string) => {
    await supabase.from('retreat_itinerary_days').delete().eq('id', id)
    fetchData()
  }

  const updateDay = async (id: string, patch: Partial<ItineraryDay>) => {
    await supabase.from('retreat_itinerary_days').update(patch).eq('id', id)
    fetchData()
  }

  // ─── File Booking (hybrid flow) ─────────────────

  const resetFileBookingForm = () => {
    setFbOperatorId('')
    setFbRetreatId('')
    setFbTravelerName('')
    setFbTravelerEmail('')
    setFbTravelDates('')
    setFbDurationDays('')
    setFbBookingAmount('')
    setFbNotes('')
  }

  const fileBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setFbMessage(null)

    const opRow = operators.find(o => o.id === fbOperatorId)
    const commissionRate = Number(opRow?.commission_rate ?? 0)

    if (!fbOperatorId || !fbRetreatId || !fbTravelerName || !fbTravelDates || !fbBookingAmount) {
      setFbMessage({ text: 'Please fill in all required fields', type: 'error' })
      return
    }

    setFbSubmitting(true)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/create-booking', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operator_id: fbOperatorId,
          retreat_id: fbRetreatId,
          traveler_name: fbTravelerName,
          traveler_email: fbTravelerEmail || undefined,
          travel_dates: fbTravelDates,
          duration_days: fbDurationDays ? parseInt(fbDurationDays) : undefined,
          booking_amount: parseFloat(fbBookingAmount),
          commission_rate: commissionRate,
          notes: fbNotes || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setFbMessage({ text: data.message || 'Booking filed and confirmation email sent', type: 'success' })
        resetFileBookingForm()
        setShowFileBookingForm(false)
        fetchData()
      } else {
        setFbMessage({ text: data.error || 'Failed to file booking', type: 'error' })
      }
    } catch {
      setFbMessage({ text: 'Network error', type: 'error' })
    }
    setFbSubmitting(false)
    setTimeout(() => setFbMessage(null), 6000)
  }

  // Pre-compute available retreats for File Booking form based on selected operator
  const fbAvailableRetreats = retreats.filter(r => r.operator_id === fbOperatorId)
  const fbSelectedOperator = operators.find(o => o.id === fbOperatorId)
  const fbCommissionRate = Number(fbSelectedOperator?.commission_rate ?? 0)
  const fbCommissionOwed = fbBookingAmount ? (parseFloat(fbBookingAmount) * fbCommissionRate) / 100 : 0

  const approveApplication = async (appId: string) => {
    setApprovingAppId(appId)
    setApproveMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/approve-application', {
        method: 'POST',
        headers,
        body: JSON.stringify({ application_id: appId }),
      })
      const data = await res.json()
      if (res.ok) {
        setApproveMessage({ id: appId, text: data.message, type: 'success' })
        fetchData()
      } else {
        setApproveMessage({ id: appId, text: data.error, type: 'error' })
      }
    } catch {
      setApproveMessage({ id: appId, text: 'Network error', type: 'error' })
    }
    setApprovingAppId(null)
    setTimeout(() => setApproveMessage(null), 6000)
  }

  // ─── Operator invite ──────────────────────────────

  const inviteOperator = async (operatorId: string) => {
    setInvitingOperatorId(operatorId)
    setInviteMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/invite-operator', {
        method: 'POST',
        headers,
        body: JSON.stringify({ operator_id: operatorId }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteMessage({ id: operatorId, text: data.message, type: 'success' })
        fetchData()
      } else {
        setInviteMessage({ id: operatorId, text: data.error, type: 'error' })
      }
    } catch {
      setInviteMessage({ id: operatorId, text: 'Network error', type: 'error' })
    }
    setInvitingOperatorId(null)
    setTimeout(() => setInviteMessage(null), 5000)
  }

  // ─── Computed data ─────────────────────────────────

  // KPIs
  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.booking_amount), 0)
  const totalCommissionOwed = bookings.reduce((sum, b) => sum + Number(b.commission_owed), 0)
  const totalCommissionPaid = bookings
    .filter(b => b.commission_paid)
    .reduce((sum, b) => sum + Number(b.commission_owed), 0)

  // Only confirmed bookings can be invoiced
  const pendingInvoices = bookings.filter(b => !b.invoice_sent && b.confirmation_status === 'confirmed')
  // Admin-filed bookings waiting for operator confirmation
  const pendingConfirmations = bookings.filter(b => b.confirmation_status === 'pending_confirmation')

  const filteredBookings = bookings.filter(b => {
    if (filterOperator && b.operator_id !== filterOperator) return false
    if (filterPaid === 'paid' && !b.commission_paid) return false
    if (filterPaid === 'unpaid' && b.commission_paid) return false
    if (filterDateFrom && new Date(b.submitted_at) < new Date(filterDateFrom)) return false
    if (filterDateTo && new Date(b.submitted_at) > new Date(filterDateTo + 'T23:59:59')) return false
    return true
  })

  const operatorSummaries: OperatorSummary[] = operators
    .map(op => {
      const opBookings = bookings.filter(b => b.operator_id === op.id)
      const totalOwed = opBookings.reduce((sum, b) => sum + Number(b.commission_owed), 0)
      const totalPd = opBookings
        .filter(b => b.commission_paid)
        .reduce((sum, b) => sum + Number(b.commission_owed), 0)
      return {
        operator_name: op.operator_name,
        total_bookings: opBookings.length,
        total_revenue: opBookings.reduce((sum, b) => sum + Number(b.booking_amount), 0),
        total_commission_owed: totalOwed,
        total_commission_paid: totalPd,
        outstanding: totalOwed - totalPd,
      }
    })
    .filter(s => s.total_bookings > 0)

  // Conversion funnel data
  const funnelData = operators.map(op => {
    const opLinks = referralLinks.filter(l => l.operator_id === op.id)
    const opClicks = opLinks.reduce((sum, l) => sum + (l.total_clicks || 0), 0)
    const opBookings = bookings.filter(b => b.operator_id === op.id).length
    return {
      operator_name: op.operator_name,
      links_sent: opLinks.length,
      total_clicks: opClicks,
      bookings_reported: opBookings,
      conversion_rate: opClicks > 0 ? ((opBookings / opClicks) * 100).toFixed(1) : null,
    }
  }).filter(f => f.links_sent > 0 || f.bookings_reported > 0)

  // Check if booking has tracked email
  const isTrackedBooking = (email: string | null) => {
    if (!email) return false
    return trackedEmails.has(email.toLowerCase())
  }

  // ─── Loading ───────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-n-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  // ─── Login Screen ──────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <Image src={LOGO_URL} alt="Nomara" width={180} height={65} className="mx-auto mb-3" priority />
          <div className="w-[50px] h-[1px] bg-n-gold mx-auto mt-1 mb-4" />
          <p className="eyebrow tracking-[0.15em]">Admin Dashboard</p>
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
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!forgotEmail) return
                await supabase.auth.resetPasswordForEmail(forgotEmail, {
                  redirectTo: `${window.location.origin}/operator/set-password`,
                })
                setForgotSent(true)
              }} className="space-y-3">
                <p className="text-n-cream text-sm text-center mb-2">Enter your admin email to receive a reset link.</p>
                <input
                  type="email"
                  placeholder="Admin email address"
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
                  className="w-full text-n-cream-muted hover:text-n-cream text-sm transition-colors py-1"
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
              placeholder="Admin email"
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
              Enter Dashboard
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

  // ─── Dashboard ─────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-n-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="Nomara" width={110} height={40} />
            <span className="eyebrow text-[10px] tracking-[0.15em] mt-0.5">Admin</span>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              setAuthenticated(false)
            }}
            className="text-n-cream-muted hover:text-n-cream text-sm transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-10">
        {/* Title */}
        <div>
          <p className="eyebrow mb-3">✦ Admin Dashboard</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight">
            Commission Overview
          </h2>
        </div>

        {/* ═══ KPI Cards (updated: 5 cards now) ═══ */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard label="Total Bookings" value={totalBookings.toString()} />
          <KPICard label="Revenue Referred" value={formatCurrency(totalRevenue)} />
          <KPICard label="Commission Owed" value={formatCurrency(totalCommissionOwed)} highlight />
          <KPICard label="Commission Collected" value={formatCurrency(totalCommissionPaid)} />
          <KPICard label="Total Link Clicks" value={totalClicks.toLocaleString()} />
        </section>

        {/* ═══ Conversion Funnel (NEW) ═══ */}
        {funnelData.length > 0 && (
          <section>
            <p className="eyebrow mb-3">✦ Conversion Funnel</p>
            <h3 className="font-serif-italic text-n-cream text-2xl mb-5">Link → Click → Booking</h3>
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Links Sent</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Total Clicks</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Bookings</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnelData.map(f => (
                      <tr key={f.operator_name} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{f.operator_name}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{f.links_sent}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{f.total_clicks}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{f.bookings_reported}</td>
                        <td className="py-3.5 px-5 text-right text-n-gold font-medium font-serif-italic">
                          {f.conversion_rate ? `${f.conversion_rate}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Referral Links (NEW) ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Referral Links</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">Create &amp; Manage Links</h3>

          {/* Success banner */}
          {linkCreated && (
            <div className="mb-6 bg-n-surface border border-n-gold/30 rounded-nomara p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-n-cream">
                <span className="text-n-gold mr-2">✦</span>
                Link created:
              </span>
              <code className="text-n-gold text-sm bg-n-bg px-3 py-1.5 rounded-lg break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/go/{linkCreated}
              </code>
              <button
                onClick={() => copyToClipboard(linkCreated)}
                className="px-3 py-1.5 bg-n-gold text-n-bg text-xs rounded-lg hover:bg-[#d4b96a] font-medium transition-colors whitespace-nowrap"
              >
                {copiedSlug === linkCreated ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Create link form */}
          <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8 mb-8">
            <p className="eyebrow mb-5 text-[10px]">Create New Link</p>
            <form onSubmit={handleCreateLink} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Lead Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={linkLeadName}
                    onChange={e => setLinkLeadName(e.target.value)}
                    required
                    placeholder="e.g. Amit Sharma"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Lead Email</label>
                  <input
                    type="email"
                    value={linkLeadEmail}
                    onChange={e => setLinkLeadEmail(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Lead Instagram</label>
                  <input
                    type="text"
                    value={linkLeadInstagram}
                    onChange={e => setLinkLeadInstagram(e.target.value)}
                    placeholder="@handle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Operator <span className="text-red-400">*</span></label>
                  <select value={linkOperatorId} onChange={e => { setLinkOperatorId(e.target.value); setLinkRetreatId('') }} required>
                    <option value="">Select operator...</option>
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>{op.operator_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Retreat</label>
                  <select value={linkRetreatId} onChange={e => setLinkRetreatId(e.target.value)}>
                    <option value="">Select retreat (optional)...</option>
                    {filteredRetreatsForLink.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.retreat_name}{r.location_town ? ` — ${r.location_town}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Destination URL <span className="text-red-400">*</span></label>
                  <input
                    type="url"
                    value={linkDestUrl}
                    onChange={e => setLinkDestUrl(e.target.value)}
                    required
                    placeholder="https://bookretreats.com/..."
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Custom Slug <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-n-cream-muted text-sm whitespace-nowrap">/go/</span>
                    <input
                      type="text"
                      value={linkSlug}
                      onChange={e => setLinkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      required
                      placeholder="amit-bodhi-surf"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Notes</label>
                  <textarea
                    value={linkNotes}
                    onChange={e => setLinkNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-2 text-[10px]">Expires At</label>
                  <input
                    type="date"
                    value={linkExpiresAt}
                    onChange={e => setLinkExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={linkSubmitting}
                className="bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-3 px-8 rounded-nomara transition-colors text-[15px]"
              >
                {linkSubmitting ? 'Creating...' : 'Create Referral Link'}
              </button>
            </form>
          </div>

          {/* Links table */}
          {referralLinks.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No referral links created yet.</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Lead</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Link</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Clicks</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Created</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Active</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralLinks.map(l => (
                      <>
                        <tr key={l.id} className="border-b border-n-border/50">
                          <td className="py-3.5 px-5">
                            <div className="text-n-cream font-medium">{l.lead_name}</div>
                            {l.lead_email && <div className="text-n-cream-muted text-xs">{l.lead_email}</div>}
                            {l.lead_instagram && <div className="text-n-cream-muted text-xs">{l.lead_instagram}</div>}
                          </td>
                          <td className="py-3.5 px-3 text-n-cream-muted">
                            {l.retreat_operators?.operator_name || '—'}
                          </td>
                          <td className="py-3.5 px-3 text-n-cream-muted max-w-[140px] truncate">
                            {l.retreats?.retreat_name || '—'}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <code className="text-n-gold text-xs bg-n-bg px-2 py-1 rounded truncate max-w-[160px]">
                                /go/{l.slug}
                              </code>
                              <button
                                onClick={() => copyToClipboard(l.slug)}
                                className="text-n-cream-muted hover:text-n-gold text-xs transition-colors whitespace-nowrap"
                              >
                                {copiedSlug === l.slug ? '✓' : '⧉'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => viewClicks(l.id)}
                              className="inline-flex items-center gap-1 text-n-cream hover:text-n-gold transition-colors"
                            >
                              <span className="font-medium">{l.total_clicks || 0}</span>
                              {(l.total_clicks || 0) > 0 && (
                                <span className="text-xs text-n-cream-muted">
                                  {expandedLinkId === l.id ? '▲' : '▼'}
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-n-cream-muted">
                            {new Date(l.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => toggleLinkActive(l.id, l.active)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                l.active ? 'bg-n-gold' : 'bg-n-bg border border-n-border'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
                                  l.active ? 'translate-x-4 bg-n-bg' : 'translate-x-0.5 bg-n-cream-muted'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => deleteLink(l.id)}
                              className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        {/* Expanded clicks sub-row */}
                        {expandedLinkId === l.id && (
                          <tr key={`${l.id}-clicks`} className="border-b border-n-border/50">
                            <td colSpan={8} className="px-5 py-3 bg-n-bg/50">
                              {expandedClicks.length === 0 ? (
                                <p className="text-n-cream-muted text-xs">No click data yet.</p>
                              ) : (
                                <div className="space-y-1">
                                  <p className="eyebrow text-[9px] mb-2">Last {expandedClicks.length} Clicks</p>
                                  {expandedClicks.map(c => (
                                    <div key={c.id} className="flex gap-4 text-xs text-n-cream-muted">
                                      <span className="text-n-cream">{new Date(c.clicked_at).toLocaleString()}</span>
                                      {c.country && <span>{c.country}</span>}
                                      {c.referer && <span className="truncate max-w-[200px]">from: {c.referer}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Pending Invoices (existing, unchanged) ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Pending Invoices</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Awaiting Action ({pendingInvoices.length})
          </h3>

          {pendingInvoices.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">All invoices sent. Nice work!</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Traveler</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Dates</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Amount</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Commission</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Days</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvoices.map(b => (
                      <tr key={b.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">
                          {b.retreat_operators?.operator_name || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted max-w-[140px] truncate">
                          {b.retreats?.retreat_name || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream">{b.traveler_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{b.travel_dates}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">
                          {formatCurrency(b.booking_amount)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-n-gold font-medium">
                          {formatCurrency(b.commission_owed)}
                        </td>
                        <td className="py-3.5 px-3 text-center text-n-cream-muted">
                          {daysSince(b.submitted_at)}d
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => markInvoiceSent(b.id)}
                              className="px-3 py-1.5 border border-n-gold/40 text-n-gold text-xs rounded-lg hover:bg-n-gold/10 transition-colors whitespace-nowrap"
                            >
                              Send Invoice
                            </button>
                            <button
                              onClick={() => markPaid(b.id)}
                              className="px-3 py-1.5 bg-n-gold text-n-bg text-xs rounded-lg hover:bg-[#d4b96a] transition-colors whitespace-nowrap font-medium"
                            >
                              Mark Paid
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ File Booking (Hybrid Flow) ═══ */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="eyebrow mb-3">✦ File a Booking</p>
              <h3 className="font-serif-italic text-n-cream text-2xl">
                Save your operator the paperwork
              </h3>
              <p className="text-n-cream-muted text-sm mt-1">
                File a booking on behalf of an operator. They&apos;ll get a one-click confirmation email.
              </p>
            </div>
            <button
              onClick={() => setShowFileBookingForm(!showFileBookingForm)}
              className="px-4 py-2 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors whitespace-nowrap"
            >
              {showFileBookingForm ? 'Close' : '+ File Booking'}
            </button>
          </div>

          {fbMessage && (
            <div className={`mb-4 rounded-nomara p-4 text-sm ${fbMessage.type === 'success' ? 'bg-n-surface border border-n-gold/30 text-n-cream' : 'bg-red-400/10 border border-red-400/30 text-red-400'}`}>
              {fbMessage.type === 'success' && <span className="text-n-gold mr-2">✦</span>}
              {fbMessage.text}
            </div>
          )}

          {showFileBookingForm && (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
              <form onSubmit={fileBooking} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="eyebrow block mb-2">
                      Operator <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={fbOperatorId}
                      onChange={e => {
                        setFbOperatorId(e.target.value)
                        setFbRetreatId('')
                      }}
                      required
                    >
                      <option value="">Select operator...</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.operator_name}{op.commission_rate ? ` (${op.commission_rate}%)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow block mb-2">
                      Retreat <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={fbRetreatId}
                      onChange={e => setFbRetreatId(e.target.value)}
                      required
                      disabled={!fbOperatorId}
                    >
                      <option value="">{fbOperatorId ? 'Select retreat...' : 'Select operator first'}</option>
                      {fbAvailableRetreats.map(r => (
                        <option key={r.id} value={r.id}>{r.retreat_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="eyebrow block mb-2">
                      Traveler Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={fbTravelerName}
                      onChange={e => setFbTravelerName(e.target.value)}
                      required
                      placeholder="e.g. Sarah Johnson"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-2">Traveler Email</label>
                    <input
                      type="email"
                      value={fbTravelerEmail}
                      onChange={e => setFbTravelerEmail(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="eyebrow block mb-2">
                      Travel Dates <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={fbTravelDates}
                      onChange={e => setFbTravelDates(e.target.value)}
                      required
                      placeholder="e.g. May 12–18, 2026"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-2">Duration (days)</label>
                    <input
                      type="number"
                      value={fbDurationDays}
                      onChange={e => setFbDurationDays(e.target.value)}
                      min={1}
                      placeholder="7"
                    />
                  </div>
                </div>

                <div>
                  <label className="eyebrow block mb-2">
                    Booking Amount (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-n-cream-muted">$</span>
                    <input
                      type="number"
                      value={fbBookingAmount}
                      onChange={e => setFbBookingAmount(e.target.value)}
                      required
                      min={0}
                      step="0.01"
                      placeholder="2,500.00"
                      className="!pl-8"
                    />
                  </div>
                </div>

                {fbOperatorId && fbBookingAmount && (
                  <div className="bg-n-bg border border-n-gold/30 rounded-nomara p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="eyebrow text-[10px]">Commission Rate</span>
                      <span className="text-n-cream font-medium">{fbCommissionRate}%</span>
                    </div>
                    <div className="h-[1px] bg-n-border mb-3" />
                    <div className="flex justify-between items-center">
                      <span className="eyebrow text-[10px]">Commission Owed</span>
                      <span className="text-n-gold text-2xl font-serif-italic">
                        {formatCurrency(fbCommissionOwed)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="eyebrow block mb-2">Notes</label>
                  <textarea
                    value={fbNotes}
                    onChange={e => setFbNotes(e.target.value)}
                    rows={3}
                    placeholder="Any context for the operator..."
                    className="resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={fbSubmitting}
                  className="w-full bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-4 rounded-nomara transition-colors text-[15px]"
                >
                  {fbSubmitting ? 'Filing booking...' : 'File Booking & Send Confirmation Email'}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ═══ Pending Operator Confirmations ═══ */}
        {pendingConfirmations.length > 0 && (
          <section>
            <p className="eyebrow mb-3">✦ Awaiting Confirmation</p>
            <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
              Waiting for operator ({pendingConfirmations.length})
            </h3>
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Traveler</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Dates</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Amount</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Commission</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-5 font-medium">Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingConfirmations.map(b => (
                      <tr key={b.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{b.retreat_operators?.operator_name || '—'}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted max-w-[140px] truncate">{b.retreats?.retreat_name || '—'}</td>
                        <td className="py-3.5 px-3 text-n-cream">{b.traveler_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{b.travel_dates}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{formatCurrency(b.booking_amount)}</td>
                        <td className="py-3.5 px-3 text-right text-n-gold font-medium">{formatCurrency(b.commission_owed)}</td>
                        <td className="py-3.5 px-5 text-center text-n-cream-muted">{daysSince(b.submitted_at)}d ago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ═══ All Bookings (existing + "From link?" column) ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ All Bookings</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">Complete History</h3>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={filterOperator}
              onChange={e => setFilterOperator(e.target.value)}
              className="!w-auto text-sm !py-2 !px-3"
            >
              <option value="">All Operators</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.operator_name}</option>
              ))}
            </select>
            <select
              value={filterPaid}
              onChange={e => setFilterPaid(e.target.value as '' | 'paid' | 'unpaid')}
              className="!w-auto text-sm !py-2 !px-3"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="!w-auto text-sm !py-2 !px-3"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="!w-auto text-sm !py-2 !px-3"
            />
            {(filterOperator || filterPaid || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterOperator('')
                  setFilterPaid('')
                  setFilterDateFrom('')
                  setFilterDateTo('')
                }}
                className="text-n-cream-muted hover:text-n-cream text-sm transition-colors px-2"
              >
                Clear
              </button>
            )}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No bookings match your filters.</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Traveler</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Dates</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Amount</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Commission</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">From Link?</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Invoice</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Paid</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">
                          {b.retreat_operators?.operator_name || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted max-w-[140px] truncate">
                          {b.retreats?.retreat_name || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream">{b.traveler_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{b.travel_dates}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">
                          {formatCurrency(b.booking_amount)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-n-gold font-medium">
                          {formatCurrency(b.commission_owed)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isTrackedBooking(b.traveler_email) && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Tracked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <StatusBadge active={b.invoice_sent} activeLabel="Sent" inactiveLabel="Pending" />
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <StatusBadge active={b.commission_paid} activeLabel="Paid" inactiveLabel="Unpaid" />
                        </td>
                        <td className="py-3.5 px-5 text-n-cream-muted">
                          {new Date(b.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Operator Summary (existing, unchanged) ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Operator Summary</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">Partner Totals</h3>

          {operatorSummaries.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No operator data yet.</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Bookings</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Revenue</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Owed</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-3 font-medium">Paid</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatorSummaries.map(s => (
                      <tr key={s.operator_name} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{s.operator_name}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{s.total_bookings}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{formatCurrency(s.total_revenue)}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{formatCurrency(s.total_commission_owed)}</td>
                        <td className="py-3.5 px-3 text-right text-n-cream">{formatCurrency(s.total_commission_paid)}</td>
                        <td className="py-3.5 px-5 text-right text-n-gold font-medium font-serif-italic text-base">
                          {formatCurrency(s.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        {/* ═══ Partner Applications ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Partner Applications</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Incoming ({applications.filter(a => a.status === 'pending').length} pending)
          </h3>

          {applications.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No applications yet.</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Contact</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Business</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Email</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Location</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Status</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Submitted</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{app.contact_name}</td>
                        <td className="py-3.5 px-3 text-n-cream">{app.business_name}</td>
                        <td className="py-3.5 px-3">
                          <a href={`mailto:${app.email}`} className="text-n-gold hover:underline text-sm">{app.email}</a>
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{app.location || '—'}</td>
                        <td className="py-3.5 px-3 text-center">
                          {app.status === 'pending' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-gold/40 text-n-gold">
                              Pending
                            </span>
                          ) : app.status === 'approved' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Approved
                            </span>
                          ) : app.status === 'reviewed' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
                              Reviewed
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-red-400/30 text-red-400/80">
                              Declined
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {approveMessage?.id === app.id && (
                            <span className={`text-xs mr-2 ${approveMessage.type === 'success' ? 'text-n-gold' : 'text-red-400'}`}>
                              {approveMessage.text}
                            </span>
                          )}
                          {app.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => approveApplication(app.id)}
                                disabled={approvingAppId === app.id}
                                className="px-3 py-1.5 bg-n-gold text-n-bg text-xs rounded-lg hover:bg-[#d4b96a] transition-colors whitespace-nowrap font-medium disabled:opacity-50"
                              >
                                {approvingAppId === app.id ? 'Approving...' : 'Approve & Invite'}
                              </button>
                              <button
                                onClick={async () => {
                                  await supabase.from('partner_applications').update({ status: 'declined' }).eq('id', app.id)
                                  fetchData()
                                }}
                                className="px-3 py-1.5 border border-n-cream/20 text-n-cream-muted text-xs rounded-lg hover:bg-n-bg transition-colors whitespace-nowrap"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {app.status !== 'pending' && (
                            <button
                              onClick={async () => {
                                await supabase.from('partner_applications').update({ status: 'pending' }).eq('id', app.id)
                                fetchData()
                              }}
                              className="px-3 py-1.5 border border-n-cream/20 text-n-cream-muted text-xs rounded-lg hover:bg-n-bg transition-colors whitespace-nowrap"
                            >
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {applications.some(a => a.message) && (
                <div className="border-t border-n-border p-5">
                  <p className="eyebrow text-[10px] mb-3">Messages</p>
                  {applications.filter(a => a.message).map(a => (
                    <div key={a.id} className="mb-3 last:mb-0">
                      <span className="text-n-cream text-sm font-medium">{a.contact_name}:</span>
                      <span className="text-n-cream-muted text-sm ml-2">{a.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═══ Retreat Listings ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Retreat Listings</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Public Retreat Pages ({retreatListings.filter(l => l.listing_status === 'submitted').length} pending review)
          </h3>

          {retreatListings.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No retreats yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {retreatListings.map(listing => {
                const isEditing = editingListingId === listing.id
                const statusColors: Record<string, string> = {
                  draft: 'border-n-cream/20 text-n-cream-muted',
                  submitted: 'border-n-gold/40 text-n-gold bg-n-gold/5',
                  published: 'bg-n-gold/20 text-n-gold border-n-gold/20',
                  archived: 'border-n-cream/20 text-n-cream-muted',
                }
                const statusLabels: Record<string, string> = {
                  draft: 'Draft',
                  submitted: 'Needs Review',
                  published: 'Published',
                  archived: 'Archived',
                }

                return (
                  <div key={listing.id} className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
                    <div className="p-5 flex flex-wrap items-start justify-between gap-4 border-b border-n-border">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-n-cream font-medium">{listing.retreat_name}</h4>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[listing.listing_status] || statusColors.draft}`}>
                            {statusLabels[listing.listing_status] || 'Draft'}
                          </span>
                        </div>
                        <p className="text-n-cream-muted text-xs">
                          {listing.retreat_operators?.operator_name || '—'}
                          {listing.listing_submitted_at && ` • Submitted ${new Date(listing.listing_submitted_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.listing_status === 'published' && listing.slug && (
                          <a
                            href={`/retreats/${listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs text-n-gold hover:underline"
                          >
                            View →
                          </a>
                        )}
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => setEditingItineraryRetreat(
                                editingItineraryRetreat === listing.id ? null : listing.id
                              )}
                              className="px-3 py-1.5 border border-n-gold/40 text-n-gold text-xs rounded-lg hover:bg-n-gold/10 transition-colors whitespace-nowrap"
                            >
                              {editingItineraryRetreat === listing.id ? 'Hide Days' : 'Manage Days'}
                            </button>
                            <button
                              onClick={() => startEditingListing(listing)}
                              className="px-3 py-1.5 bg-n-gold text-n-bg text-xs rounded-lg hover:bg-[#d4b96a] transition-colors whitespace-nowrap font-medium"
                            >
                              Review & Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Itinerary Days Editor */}
                    {editingItineraryRetreat === listing.id && !isEditing && (
                      <div className="p-5 md:p-6 border-t border-n-border bg-n-bg/30">
                        <p className="eyebrow text-[10px] mb-4">✦ Day-by-Day Itinerary</p>

                        {/* Existing days */}
                        <div className="space-y-3 mb-5">
                          {itineraryDays
                            .filter(d => d.retreat_id === listing.id)
                            .map(d => (
                              <div key={d.id} className="bg-n-surface border border-n-border rounded-nomara p-4">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-n-gold text-n-gold text-xs font-medium shrink-0">
                                      {d.day_number}
                                    </span>
                                    <input
                                      type="text"
                                      defaultValue={d.title}
                                      onBlur={e => {
                                        if (e.target.value !== d.title) {
                                          updateDay(d.id, { title: e.target.value })
                                        }
                                      }}
                                      className="!py-1.5 !px-2 text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={() => deleteDay(d.id)}
                                    className="px-2 py-1 border border-red-400/30 text-red-400/80 text-xs rounded hover:bg-red-400/10 transition-colors shrink-0"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="pl-11 space-y-2">
                                  <input
                                    type="url"
                                    defaultValue={d.image_url || ''}
                                    onBlur={e => {
                                      if (e.target.value !== (d.image_url || '')) {
                                        updateDay(d.id, { image_url: e.target.value || null })
                                      }
                                    }}
                                    placeholder="Image URL for this day"
                                    className="!py-1.5 !px-2 text-xs"
                                  />
                                  <textarea
                                    defaultValue={d.activities?.join('\n') || ''}
                                    onBlur={e => {
                                      const newList = e.target.value
                                        ? e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                                        : null
                                      updateDay(d.id, { activities: newList })
                                    }}
                                    rows={3}
                                    placeholder="Activities (one per line)"
                                    className="!py-1.5 !px-2 text-xs resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Add new day form */}
                        <div className="bg-n-surface border border-n-border border-dashed rounded-nomara p-4">
                          <p className="text-n-cream-muted text-xs mb-3">Add a new day</p>
                          <div className="grid grid-cols-[80px_1fr] gap-2 mb-2">
                            <input
                              type="number"
                              value={newDay.day_number}
                              onChange={e => setNewDay({ ...newDay, day_number: parseInt(e.target.value) || 1 })}
                              min={1}
                              placeholder="Day #"
                              className="!py-1.5 !px-2 text-sm"
                            />
                            <input
                              type="text"
                              value={newDay.title}
                              onChange={e => setNewDay({ ...newDay, title: e.target.value })}
                              placeholder="Day title (e.g. Welcome to Medellín)"
                              className="!py-1.5 !px-2 text-sm"
                            />
                          </div>
                          <input
                            type="url"
                            value={newDay.image_url}
                            onChange={e => setNewDay({ ...newDay, image_url: e.target.value })}
                            placeholder="Image URL"
                            className="!py-1.5 !px-2 text-xs mb-2"
                          />
                          <textarea
                            value={newDay.activities}
                            onChange={e => setNewDay({ ...newDay, activities: e.target.value })}
                            rows={3}
                            placeholder="Activities (one per line)"
                            className="!py-1.5 !px-2 text-xs resize-none mb-3"
                          />
                          <button
                            onClick={() => addDay(listing.id)}
                            disabled={!newDay.title}
                            className="px-4 py-2 bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg text-xs font-medium rounded-nomara transition-colors"
                          >
                            + Add Day
                          </button>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="p-5 md:p-6 space-y-4">
                        <div>
                          <label className="eyebrow block mb-2">Hero Image URL</label>
                          <input
                            type="url"
                            value={listingForm.hero_image_url}
                            onChange={e => setListingForm({ ...listingForm, hero_image_url: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Additional Photos (one URL per line)</label>
                          <textarea
                            value={listingForm.gallery_urls}
                            onChange={e => setListingForm({ ...listingForm, gallery_urls: e.target.value })}
                            rows={4}
                            className="resize-none"
                            placeholder="https://...photo2.jpg&#10;https://...photo3.jpg"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Tagline</label>
                          <input
                            type="text"
                            value={listingForm.tagline}
                            onChange={e => setListingForm({ ...listingForm, tagline: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">About Your Trip</label>
                          <textarea
                            value={listingForm.about_trip}
                            onChange={e => setListingForm({ ...listingForm, about_trip: e.target.value })}
                            rows={5}
                            className="resize-none"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Results (one per line)</label>
                          <textarea
                            value={listingForm.results_list}
                            onChange={e => setListingForm({ ...listingForm, results_list: e.target.value })}
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Inclusions (one per line)</label>
                          <textarea
                            value={listingForm.inclusions}
                            onChange={e => setListingForm({ ...listingForm, inclusions: e.target.value })}
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Full Address</label>
                          <input
                            type="text"
                            value={listingForm.full_address}
                            onChange={e => setListingForm({ ...listingForm, full_address: e.target.value })}
                            placeholder="e.g. Playa Guiones, Nosara, Costa Rica"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">About the Location</label>
                          <textarea
                            value={listingForm.location_description}
                            onChange={e => setListingForm({ ...listingForm, location_description: e.target.value })}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block mb-2">Important Info</label>
                          <textarea
                            value={listingForm.important_info}
                            onChange={e => setListingForm({ ...listingForm, important_info: e.target.value })}
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => publishListing(listing.id, 'save_draft')}
                            disabled={listingSubmitting}
                            className="px-4 py-2 text-sm bg-n-bg hover:bg-[#153a22] border border-n-cream/20 text-n-cream rounded-nomara transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => publishListing(listing.id, 'publish')}
                            disabled={listingSubmitting}
                            className="px-4 py-2 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors disabled:opacity-50"
                          >
                            {listingSubmitting ? 'Working...' : 'Save & Publish'}
                          </button>
                          {listing.listing_status === 'published' && (
                            <button
                              onClick={() => publishListing(listing.id, 'unpublish')}
                              disabled={listingSubmitting}
                              className="px-4 py-2 text-sm text-n-cream-muted hover:text-n-cream transition-colors"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => setEditingListingId(null)}
                            className="px-4 py-2 text-sm text-n-cream-muted hover:text-n-cream transition-colors"
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

        {/* ═══ Retreat Reviews ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Retreat Reviews</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Traveler Reviews ({reviews.filter(r => !r.approved).length} pending)
          </h3>

          {/* Add new review form */}
          <div className="bg-n-surface border border-n-border rounded-nomara p-5 md:p-6 mb-5">
            <p className="eyebrow text-[10px] mb-4">✦ Add Review</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="eyebrow block mb-2">Retreat</label>
                <select
                  value={newReview.retreat_id}
                  onChange={e => setNewReview({ ...newReview, retreat_id: e.target.value })}
                >
                  <option value="">Select retreat...</option>
                  {retreatListings.map(l => (
                    <option key={l.id} value={l.id}>{l.retreat_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-2">Reviewer Name</label>
                <input
                  type="text"
                  value={newReview.reviewer_name}
                  onChange={e => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                  placeholder="e.g. Sarah J."
                />
              </div>
              <div>
                <label className="eyebrow block mb-2">Rating</label>
                <select
                  value={newReview.rating}
                  onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★ (4)</option>
                  <option value="3">★★★ (3)</option>
                  <option value="2">★★ (2)</option>
                  <option value="1">★ (1)</option>
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-2">Travel Date</label>
                <input
                  type="text"
                  value={newReview.travel_date}
                  onChange={e => setNewReview({ ...newReview, travel_date: e.target.value })}
                  placeholder="e.g. March 2026"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="eyebrow block mb-2">Review Text</label>
              <textarea
                value={newReview.review_text}
                onChange={e => setNewReview({ ...newReview, review_text: e.target.value })}
                rows={4}
                placeholder="What did they say about the experience?"
                className="resize-none"
              />
            </div>
            <button
              onClick={submitReview}
              disabled={reviewSubmitting || !newReview.retreat_id || !newReview.reviewer_name || !newReview.review_text}
              className="mt-4 px-5 py-2.5 bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium rounded-nomara transition-colors"
            >
              {reviewSubmitting ? 'Adding...' : 'Add Review'}
            </button>
          </div>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-n-surface border border-n-border rounded-nomara p-5">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="text-n-cream font-medium">{rev.reviewer_name}</span>
                        <span className="text-n-gold text-sm">
                          {'★'.repeat(rev.rating)}
                          <span className="text-n-cream-muted/40">{'★'.repeat(5 - rev.rating)}</span>
                        </span>
                        {rev.approved ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                            Published
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-gold/40 text-n-gold">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-n-cream-muted text-xs">
                        {rev.retreats?.retreat_name || '—'}
                        {rev.travel_date && ` • ${rev.travel_date}`}
                        {` • ${rev.source}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleReviewApproved(rev.id, !rev.approved)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap font-medium ${
                          rev.approved
                            ? 'border border-n-cream/20 text-n-cream-muted hover:bg-n-bg'
                            : 'bg-n-gold text-n-bg hover:bg-[#d4b96a]'
                        }`}
                      >
                        {rev.approved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        onClick={() => deleteReview(rev.id)}
                        className="px-3 py-1.5 border border-red-400/30 text-red-400/80 text-xs rounded-lg hover:bg-red-400/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-n-cream-muted text-sm leading-relaxed whitespace-pre-line">
                    {rev.review_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ Waitlist Signups ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Waitlist Signups</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">
            Traveler Inquiries ({waitlists.filter(w => w.status === 'new').length} new)
          </h3>

          {waitlists.length === 0 ? (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6">
              <p className="text-n-cream-muted text-sm">No waitlist signups yet.</p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-n-border">
                      <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Name</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Email</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Retreat</th>
                      <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Dates</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Party</th>
                      <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Status</th>
                      <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlists.map(w => (
                      <tr key={w.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">
                          {w.full_name}
                          {w.referral_links && (
                            <span className="inline-block bg-n-gold/10 border border-n-gold/30 text-n-gold text-[10px] px-2 py-0.5 rounded-full ml-2">
                              via /go/{w.referral_links.slug}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <a href={`mailto:${w.email}`} className="text-n-gold hover:underline text-sm">{w.email}</a>
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted max-w-[180px] truncate">
                          {w.retreats?.retreat_name || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{w.travel_dates || '—'}</td>
                        <td className="py-3.5 px-3 text-center text-n-cream">{w.party_size || '—'}</td>
                        <td className="py-3.5 px-3 text-center">
                          {w.status === 'new' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-gold/40 text-n-gold">
                              New
                            </span>
                          )}
                          {w.status === 'contacted' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
                              Contacted
                            </span>
                          )}
                          {w.status === 'booked' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Booked
                            </span>
                          )}
                          {w.status === 'declined' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-red-400/30 text-red-400/80">
                              Declined
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <select
                            value={w.status}
                            onChange={e => updateWaitlistStatus(w.id, e.target.value)}
                            className="!w-auto text-xs !py-1.5 !px-2"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="booked">Booked</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {waitlists.some(w => w.message) && (
                <div className="border-t border-n-border p-5">
                  <p className="eyebrow text-[10px] mb-3">Messages</p>
                  {waitlists.filter(w => w.message).map(w => (
                    <div key={w.id} className="mb-3 last:mb-0">
                      <span className="text-n-cream text-sm font-medium">{w.full_name} ({w.retreats?.retreat_name}):</span>
                      <span className="text-n-cream-muted text-sm ml-2">{w.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═══ Operator Portal Access ═══ */}
        <section>
          <p className="eyebrow mb-3">✦ Partner Portal Access</p>
          <h3 className="font-serif-italic text-n-cream text-2xl mb-5">Operator Accounts</h3>

          <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-n-border">
                    <th className="eyebrow text-[10px] text-left py-3 px-5 font-medium">Operator</th>
                    <th className="eyebrow text-[10px] text-left py-3 px-3 font-medium">Email</th>
                    <th className="eyebrow text-[10px] text-center py-3 px-3 font-medium">Status</th>
                    <th className="eyebrow text-[10px] text-right py-3 px-5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => {
                    const status = op.auth_user_id ? 'active' : op.email ? 'not_invited' : 'no_email'
                    return (
                      <tr key={op.id} className="border-b border-n-border/50 last:border-0">
                        <td className="py-3.5 px-5 text-n-cream font-medium">{op.operator_name}</td>
                        <td className="py-3.5 px-3 text-n-cream-muted">{op.email || '—'}</td>
                        <td className="py-3.5 px-3 text-center">
                          {status === 'active' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
                              Active
                            </span>
                          )}
                          {status === 'not_invited' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
                              Not Invited
                            </span>
                          )}
                          {status === 'no_email' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-red-400/30 text-red-400/80">
                              No Email
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {inviteMessage?.id === op.id && (
                            <span className={`text-xs mr-2 ${inviteMessage.type === 'success' ? 'text-n-gold' : 'text-red-400'}`}>
                              {inviteMessage.text}
                            </span>
                          )}
                          {status === 'no_email' ? (
                            <span className="text-n-cream-muted text-xs">Add email first</span>
                          ) : status === 'active' ? (
                            <button
                              onClick={() => inviteOperator(op.id)}
                              disabled={invitingOperatorId === op.id}
                              className="px-3 py-1.5 border border-n-cream/20 text-n-cream-muted text-xs rounded-lg hover:bg-n-bg transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                              {invitingOperatorId === op.id ? 'Sending...' : 'Re-invite'}
                            </button>
                          ) : (
                            <button
                              onClick={() => inviteOperator(op.id)}
                              disabled={invitingOperatorId === op.id}
                              className="px-3 py-1.5 bg-n-gold text-n-bg text-xs rounded-lg hover:bg-[#d4b96a] transition-colors whitespace-nowrap font-medium disabled:opacity-50"
                            >
                              {invitingOperatorId === op.id ? 'Sending...' : 'Send Invite'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────

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

function StatusBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return active ? (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-n-gold/20 text-n-gold">
      {activeLabel}
    </span>
  ) : (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-n-cream/20 text-n-cream-muted">
      {inactiveLabel}
    </span>
  )
}
