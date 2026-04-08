import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatCurrency } from '@/lib/utils'
import WaitlistForm from './WaitlistForm'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

export const revalidate = 60

interface Retreat {
  id: string
  slug: string
  retreat_name: string
  location_town: string | null
  location_region: string | null
  location_country: string | null
  price_from: number | null
  duration_days: number | null
  hero_image_url: string | null
  gallery_urls: string[] | null
  tagline: string | null
  about_trip: string | null
  results_list: string[] | null
  inclusions: string[] | null
  important_info: string | null
  vibe_tag: string | null
  rating: number | null
  review_count: number | null
  retreat_operators: { operator_name: string } | null
}

export default async function RetreatDetail({ params }: { params: { slug: string } }) {
  const { data: retreat } = await supabaseAdmin
    .from('retreats')
    .select('*, retreat_operators(operator_name)')
    .eq('slug', params.slug)
    .in('listing_status', ['published', 'submitted'])
    .maybeSingle()

  if (!retreat) {
    notFound()
  }

  const r = retreat as unknown as Retreat
  const location = [r.location_town, r.location_region, r.location_country].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-n-border py-4 px-4 md:px-8 sticky top-0 z-50 bg-n-bg/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/retreats" className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="Nomara" width={110} height={40} priority />
          </Link>
          <Link
            href="/retreats"
            className="text-n-cream-muted hover:text-n-cream text-sm transition-colors"
          >
            ← All Retreats
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[560px] bg-n-surface overflow-hidden">
        {r.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.hero_image_url}
            alt={r.retreat_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-n-gold text-6xl">✦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-n-bg/30 to-transparent" />
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 md:-mt-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: Content */}
          <div>
            {/* Title card */}
            <div className="bg-n-surface border border-n-border rounded-nomara p-6 md:p-8 mb-8">
              {r.vibe_tag && (
                <span className="inline-block bg-n-gold/10 border border-n-gold/30 text-n-gold eyebrow text-[10px] px-2.5 py-1 rounded-full mb-4">
                  {r.vibe_tag}
                </span>
              )}
              <h1 className="font-serif-italic text-n-cream text-3xl md:text-5xl leading-tight mb-3">
                {r.retreat_name}
              </h1>
              {r.tagline && (
                <p className="text-n-cream-muted text-lg mb-5 italic">{r.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {location && (
                  <span className="text-n-cream-muted">
                    <span className="text-n-gold mr-2">✦</span>{location}
                  </span>
                )}
                {r.retreat_operators?.operator_name && (
                  <span className="text-n-cream-muted">
                    <span className="text-n-gold mr-2">✦</span>Hosted by {r.retreat_operators.operator_name}
                  </span>
                )}
                {r.duration_days && (
                  <span className="text-n-cream-muted">
                    <span className="text-n-gold mr-2">✦</span>{r.duration_days} days
                  </span>
                )}
                {r.rating && r.review_count ? (
                  <span className="text-n-cream-muted">
                    <span className="text-n-gold mr-2">★</span>{r.rating} ({r.review_count} reviews)
                  </span>
                ) : null}
              </div>
            </div>

            {/* About */}
            {r.about_trip && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ About Your Trip</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  What to Expect
                </h2>
                <div className="text-n-cream-muted text-[16px] leading-relaxed whitespace-pre-line">
                  {r.about_trip}
                </div>
              </section>
            )}

            {/* Results */}
            {r.results_list && r.results_list.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ Results You&apos;ll Take Home</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  Your Transformation
                </h2>
                <ul className="space-y-3">
                  {r.results_list.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-n-cream-muted">
                      <span className="text-n-gold text-sm mt-1 shrink-0">✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Inclusions */}
            {r.inclusions && r.inclusions.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ What&apos;s Included</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  Your Package
                </h2>
                <div className="bg-n-surface border border-n-border rounded-nomara p-6">
                  <ul className="space-y-3">
                    {r.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-n-cream">
                        <span className="text-n-gold text-sm mt-1 shrink-0">✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Important Info */}
            {r.important_info && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ Before You Book</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  Important Information
                </h2>
                <div className="bg-n-surface border border-n-border rounded-nomara p-6 text-n-cream-muted text-[15px] leading-relaxed whitespace-pre-line">
                  {r.important_info}
                </div>
              </section>
            )}

            {/* Waitlist Form (mobile) */}
            <div className="lg:hidden">
              <WaitlistForm retreatId={r.id} retreatName={r.retreat_name} />
            </div>
          </div>

          {/* Right: Sticky sidebar with price + waitlist */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Price card */}
              <div className="bg-n-surface border border-n-border rounded-nomara p-6 text-center">
                {r.price_from ? (
                  <>
                    <p className="eyebrow text-[10px] mb-2">Starting From</p>
                    <p className="text-n-gold font-serif-italic text-4xl mb-1">
                      {formatCurrency(r.price_from)}
                    </p>
                    {r.duration_days && (
                      <p className="text-n-cream-muted text-sm">{r.duration_days}-day experience</p>
                    )}
                  </>
                ) : (
                  <p className="text-n-cream-muted text-sm">Pricing on request</p>
                )}
              </div>

              {/* Waitlist Form */}
              <WaitlistForm retreatId={r.id} retreatName={r.retreat_name} />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-n-border py-10 px-4 text-center mt-20">
        <p className="font-serif-italic text-n-cream-muted text-sm">
          Skillcation travel, done right.
        </p>
        <p className="text-n-cream-muted text-xs mt-2">&copy; 2026 Nomara Travel</p>
      </footer>
    </div>
  )
}
