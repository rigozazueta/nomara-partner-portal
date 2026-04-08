import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatCurrency } from '@/lib/utils'
import WaitlistForm from './WaitlistForm'
import ItineraryTabs from './ItineraryTabs'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

export const revalidate = 60

interface Retreat {
  id: string
  slug: string
  retreat_name: string
  location_town: string | null
  location_region: string | null
  location_country: string | null
  full_address: string | null
  location_description: string | null
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

interface Review {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
  travel_date: string | null
  created_at: string
}

interface ItineraryDay {
  id: string
  day_number: number
  title: string
  activities: string[] | null
  image_url: string | null
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

  // Fetch approved reviews + itinerary days in parallel
  const [{ data: reviewsData }, { data: itineraryData }] = await Promise.all([
    supabaseAdmin
      .from('retreat_reviews')
      .select('id, reviewer_name, rating, review_text, travel_date, created_at')
      .eq('retreat_id', r.id)
      .eq('approved', true)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('retreat_itinerary_days')
      .select('id, day_number, title, activities, image_url')
      .eq('retreat_id', r.id)
      .order('day_number'),
  ])

  const reviews = (reviewsData || []) as Review[]
  const itineraryDays = (itineraryData || []) as ItineraryDay[]
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length
    : null

  // Google Maps embed URL
  const mapQuery = r.full_address || location
  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null

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
        <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-n-bg/30 to-transparent pointer-events-none" />
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
                {avgRating !== null ? (
                  <span className="text-n-cream-muted">
                    <span className="text-n-gold mr-2">★</span>
                    {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
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

            {/* Day-by-Day Itinerary */}
            {itineraryDays.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ Day-by-Day</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  Your Itinerary
                </h2>
                <ItineraryTabs days={itineraryDays} />
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

            {/* Location */}
            {(mapEmbedUrl || r.location_description) && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ Location</p>
                <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl mb-5">
                  Where You&apos;ll Stay
                </h2>
                {r.location_description && (
                  <p className="text-n-cream-muted text-[16px] leading-relaxed mb-5 whitespace-pre-line">
                    {r.location_description}
                  </p>
                )}
                {r.full_address && (
                  <p className="text-n-cream text-sm mb-4">
                    <span className="text-n-gold mr-2">📍</span>{r.full_address}
                  </p>
                )}
                {mapEmbedUrl && (
                  <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
                    <iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="360"
                      style={{ border: 0, filter: 'invert(0.85) hue-rotate(180deg) saturate(0.6)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map of ${r.retreat_name}`}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <section className="mb-10">
                <p className="eyebrow mb-3">✦ Traveler Reviews</p>
                <div className="flex items-baseline gap-4 mb-5">
                  <h2 className="font-serif-italic text-n-cream text-2xl md:text-3xl">
                    What Guests Say
                  </h2>
                  {avgRating !== null && (
                    <span className="text-n-gold">
                      ★ {avgRating.toFixed(1)} <span className="text-n-cream-muted text-sm">({reviews.length})</span>
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-n-surface border border-n-border rounded-nomara p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-n-cream font-medium">{rev.reviewer_name}</p>
                          {rev.travel_date && (
                            <p className="text-n-cream-muted text-xs">Visited {rev.travel_date}</p>
                          )}
                        </div>
                        <div className="text-n-gold text-sm whitespace-nowrap">
                          {'★'.repeat(rev.rating)}
                          <span className="text-n-cream-muted/40">{'★'.repeat(5 - rev.rating)}</span>
                        </div>
                      </div>
                      <p className="text-n-cream-muted text-[15px] leading-relaxed whitespace-pre-line">
                        {rev.review_text}
                      </p>
                    </div>
                  ))}
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
