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

// ─── Component ───────────────────────────────────────

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)

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

  // Operator invite state
  const [invitingOperatorId, setInvitingOperatorId] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null)

  // ─── Data fetching ─────────────────────────────────

  const fetchData = useCallback(async () => {
    const [bookingsRes, operatorsRes, retreatsRes, linksRes, clickCountRes] = await Promise.all([
      supabase
        .from('operator_booking_reports')
        .select('*, retreat_operators(operator_name), retreats(retreat_name)')
        .order('submitted_at', { ascending: false }),
      supabase.from('retreat_operators').select('id, operator_name, email, auth_user_id').order('operator_name'),
      supabase.from('retreats').select('id, retreat_name, operator_id, location_town, bookretreats_url').order('retreat_name'),
      supabase
        .from('referral_links')
        .select('*, retreat_operators(operator_name), retreats(retreat_name)')
        .order('created_at', { ascending: false }),
      supabase.from('referral_clicks').select('id', { count: 'exact', head: true }),
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
    setLoading(false)
  }, [])

  useEffect(() => {
    const isAuth = sessionStorage.getItem('nomara_admin_auth') === 'true'
    if (isAuth) {
      setAuthenticated(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [fetchData])

  // ─── Existing actions ──────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, role: 'admin' }),
    })
    if (res.ok) {
      sessionStorage.setItem('nomara_admin_auth', 'true')
      sessionStorage.setItem('nomara_admin_pw', password)
      setAuthenticated(true)
      fetchData()
    } else {
      setAuthError('Incorrect password.')
    }
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

  // ─── Operator invite ──────────────────────────────

  const inviteOperator = async (operatorId: string) => {
    setInvitingOperatorId(operatorId)
    setInviteMessage(null)
    try {
      const adminPw = sessionStorage.getItem('nomara_admin_pw') || password
      const res = await fetch('/api/invite-operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, admin_password: adminPw }),
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

  const pendingInvoices = bookings.filter(b => !b.invoice_sent)

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
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mb-3"
          />
          {authError && <p className="text-red-400 text-sm mb-3">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3.5 rounded-nomara transition-colors"
          >
            Enter Dashboard
          </button>
        </form>
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
            onClick={() => {
              sessionStorage.removeItem('nomara_admin_auth')
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
