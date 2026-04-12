'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getReferralAttribution } from '@/lib/referral-cookie'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

const FAQ_ITEMS = [
  {
    q: 'How do I get started?',
    a: 'Fill out the application form below. We review every submission and typically respond within 48 hours. Once approved, we set up your portal account and agree on commission terms.',
  },
  {
    q: 'What commission rate applies to my retreat?',
    a: 'Commission rates are agreed individually with each partner, typically ranging from 10–20% depending on the experience type and volume. Your rate is locked in before we send any travelers your way.',
  },
  {
    q: 'When do I get paid?',
    a: 'After a traveler completes their stay, you submit a booking report through the portal. We invoice within 48 hours and process payment within 30 days.',
  },
  {
    q: 'What if a traveler cancels?',
    a: 'Cancellation policies are between you and the traveler. If no stay occurs, no commission is owed. We only invoice on completed bookings.',
  },
  {
    q: 'Do I need to use any special software?',
    a: 'No. The partner portal is a simple web app — no downloads, no integrations. You log in, submit a booking form, and track your commissions. That\'s it.',
  },
]

export default function Home() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    contact_name: '',
    business_name: '',
    email: '',
    location: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    const referral = getReferralAttribution()

    const { error } = await supabase.from('partner_applications').insert({
      contact_name: formData.contact_name,
      business_name: formData.business_name,
      email: formData.email,
      location: formData.location || null,
      message: formData.message || null,
      referral_link_id: referral?.referral_link_id || null,
      referral_slug: referral?.slug || null,
    })

    if (error) {
      setFormError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen">
      {/* ─── STICKY NAV ─── */}
      <nav className="sticky top-0 z-50 bg-n-bg/90 backdrop-blur-md border-b border-n-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="Nomara" width={110} height={40} priority />
            <span className="eyebrow text-[10px] tracking-[0.15em] mt-0.5 hidden sm:inline">Partner Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/operator')}
              className="px-4 py-2 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors"
            >
              Partner Login
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm text-n-cream-muted hover:text-n-cream transition-colors hidden sm:inline-block"
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SECTION 1: HERO ─── */}
      <section className="py-14 md:py-20 px-4 text-center">
        <p className="eyebrow tracking-[0.2em] text-[13px] mb-6">✦ Retreat Partnerships</p>
        <h1 className="font-serif-italic text-n-cream text-4xl md:text-6xl leading-tight mb-5 max-w-2xl mx-auto">
          Partner with Nomara
        </h1>
        <p className="text-n-cream-muted text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          We send pre-qualified travelers to your experiential retreat. You host them. We handle the rest.
        </p>
        <button
          onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-3.5 px-8 rounded-nomara transition-colors text-[15px]"
        >
          Become a Partner
        </button>
        <p className="font-serif-italic text-n-cream-muted text-sm mt-14">
          Skillcation travel, done right.
        </p>
      </section>

      {/* ─── SECTION 2: WHAT IS NOMARA ─── */}
      <section id="about" className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-3">✦ About Nomara</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-5">
            A Curated Skillcation Platform
          </h2>
          <p className="text-n-cream-muted text-[16px] max-w-2xl mb-12 leading-relaxed">
            Nomara is a curated experiential travel platform. We attract travelers through content, quizzes, and marketing — then match them with the right retreat based on their preferences, experience level, and travel style. From surf and yoga to cooking, art, music, and beyond — partners handle what they do best: hosting unforgettable skill-based experiences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <p className="text-n-cream font-medium text-[15px] mb-2">We Market</p>
              <p className="text-n-cream-muted text-sm">
                Content, ads, and SEO that attract experiential travelers actively looking for their next skillcation.
              </p>
            </div>
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <p className="text-n-cream font-medium text-[15px] mb-2">We Match</p>
              <p className="text-n-cream-muted text-sm">
                Our recommendation engine pairs each traveler with retreats that fit their vibe, skill level, and budget.
              </p>
            </div>
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <p className="text-n-cream font-medium text-[15px] mb-2">You Host</p>
              <p className="text-n-cream-muted text-sm">
                You welcome a pre-qualified guest who already knows what to expect. We handle everything before they arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 bg-n-surface/30">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-3">✦ How It Works</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-12">
            From Traveler to Guest in Four Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { num: '1', title: 'Lead Generation', desc: 'Nomara markets to experiential travelers through content, social media, quizzes, and paid campaigns.' },
              { num: '2', title: 'Smart Matching', desc: 'We match each traveler to partner retreats based on their preferences, budget, and experience level.' },
              { num: '3', title: 'You Host', desc: 'The traveler books directly with you. You deliver the experience — we stay out of the way.' },
              { num: '4', title: 'Report & Get Paid', desc: 'Submit a 2-minute booking report in the portal. Commission invoice sent within 48 hours.' },
            ].map(step => (
              <div key={step.num} className="text-center">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-n-gold text-n-gold text-sm font-medium mb-4">
                  {step.num}
                </span>
                <p className="text-n-cream font-medium text-[15px] mb-2">{step.title}</p>
                <p className="text-n-cream-muted text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: COMMISSION STRUCTURE ─── */}
      <section id="commission" className="py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">✦ Commission Structure</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-8">
            Transparent, Performance-Based
          </h2>

          <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
            {[
              { title: 'Agreed Per Partner', desc: 'Commission rates are negotiated individually, typically between 10–20% of the booking value.' },
              { title: 'Calculated Automatically', desc: 'The portal calculates your commission the moment you submit a booking report. No manual math.' },
              { title: 'Invoiced After the Stay', desc: 'We send the commission invoice within 48 hours of your booking report submission.' },
              { title: 'Paid Within 30 Days', desc: 'Payment is processed within 30 days of the invoice. Track everything in real time through the portal.' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-4 py-5 ${i < 3 ? 'border-b border-n-border/50' : ''}`}>
                <span className="text-n-gold text-sm mt-0.5 shrink-0">✦</span>
                <div>
                  <p className="text-n-cream font-medium text-[15px]">{item.title}</p>
                  <p className="text-n-cream-muted text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: WHY PARTNER WITH US ─── */}
      <section id="why-partner" className="py-20 md:py-28 px-4 bg-n-surface/30">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-3">✦ Why Partner With Us</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-10">
            Built for Experience Operators
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Zero Upfront Cost', desc: 'No listing fees, no monthly charges. You only pay a commission when a Nomara traveler actually books.' },
              { title: 'Pre-Qualified Travelers', desc: 'Every traveler has been matched based on their interests and budget. No tire-kickers — just guests ready to book.' },
              { title: 'Simple Reporting', desc: 'Submitting a booking takes two minutes. One form, automatic commission calculation, invoice within 48 hours.' },
              { title: 'Transparent Tracking', desc: 'Log in to the partner portal anytime to see your bookings, commissions owed, and payment history in real time.' },
            ].map((card, i) => (
              <div key={i} className="bg-n-surface border border-n-border rounded-nomara p-6">
                <span className="text-n-gold text-lg block mb-3">✦</span>
                <p className="text-n-cream font-medium text-[15px] mb-2">{card.title}</p>
                <p className="text-n-cream-muted text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: FAQ ─── */}
      <section id="faq" className="py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">✦ Frequently Asked</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-10">
            Common Questions
          </h2>

          <div>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-n-border">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left text-n-cream font-medium text-[15px] hover:text-n-gold transition-colors"
                >
                  {item.q}
                  <span className="text-n-gold text-sm shrink-0 ml-4">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-n-cream-muted text-sm leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: BECOME A PARTNER ─── */}
      <section id="apply" className="py-20 md:py-28 px-4 bg-n-surface/30">
        <div className="max-w-2xl mx-auto">
          <p className="eyebrow mb-3">✦ Get Started</p>
          <h2 className="font-serif-italic text-n-cream text-3xl md:text-[44px] leading-tight mb-3">
            Become a Partner
          </h2>
          <p className="text-n-cream-muted text-[16px] mb-8 leading-relaxed">
            Tell us about your experience and we&apos;ll be in touch within 48 hours.
          </p>

          {submitted ? (
            <div className="bg-n-surface border border-n-gold/30 rounded-nomara p-8 text-center">
              <span className="text-n-gold text-2xl block mb-3">✦</span>
              <h3 className="font-serif-italic text-n-cream text-2xl mb-2">Application Received</h3>
              <p className="text-n-cream-muted text-sm">
                Thanks for your interest in partnering with Nomara. We review every application and will be in touch within 48 hours.
              </p>
            </div>
          ) : (
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8">
              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                <div>
                  <label className="eyebrow block mb-2">
                    Contact Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={e => updateField('contact_name', e.target.value)}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="eyebrow block mb-2">
                    Retreat / Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={e => updateField('business_name', e.target.value)}
                    required
                    placeholder="e.g. Sunset Surf Lodge"
                  />
                </div>

                <div>
                  <label className="eyebrow block mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="eyebrow block mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => updateField('location', e.target.value)}
                    placeholder="e.g. Nosara, Costa Rica"
                  />
                </div>

                <div>
                  <label className="eyebrow block mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={e => updateField('message', e.target.value)}
                    rows={4}
                    placeholder="Tell us about your experience — what you offer, your typical guests, anything we should know."
                    className="resize-none"
                  />
                </div>

                {formError && <p className="text-red-400 text-sm">{formError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-n-gold hover:bg-[#d4b96a] disabled:opacity-50 text-n-bg font-medium py-4 rounded-nomara transition-colors text-[16px]"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 8: FOOTER ─── */}
      <section className="py-16 px-4 text-center">
        <div className="w-[60px] h-[1px] bg-n-gold mx-auto mb-8" />
        <Image src={LOGO_URL} alt="Nomara" width={140} height={50} className="mx-auto mb-4" />
        <p className="font-serif-italic text-n-cream-muted text-sm mb-6">
          Skillcation travel, done right.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto mb-8">
          <button
            onClick={() => router.push('/operator')}
            className="px-5 py-2.5 text-sm bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium rounded-nomara transition-colors"
          >
            Partner Login
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-5 py-2.5 text-sm bg-n-surface hover:bg-[#153a22] text-n-cream border border-n-cream/20 font-medium rounded-nomara transition-colors"
          >
            Admin
          </button>
        </div>

        <p className="text-n-cream-muted text-xs">&copy; 2026 Nomara Travel</p>
      </section>
    </div>
  )
}
