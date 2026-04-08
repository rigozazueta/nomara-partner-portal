import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatCurrency } from '@/lib/utils'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

export const revalidate = 60

interface RetreatListItem {
  id: string
  slug: string
  retreat_name: string
  location_town: string | null
  location_region: string | null
  location_country: string | null
  price_from: number | null
  hero_image_url: string | null
  tagline: string | null
  vibe_tag: string | null
  duration_days: number | null
}

export default async function RetreatsDirectory() {
  const { data: retreats } = await supabaseAdmin
    .from('retreats')
    .select('id, slug, retreat_name, location_town, location_region, location_country, price_from, hero_image_url, tagline, vibe_tag, duration_days')
    .eq('listing_status', 'published')
    .order('created_at', { ascending: false })

  const list = (retreats || []) as RetreatListItem[]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-n-border py-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="Nomara" width={110} height={40} priority />
          </Link>
          <Link
            href="/operator"
            className="text-n-cream-muted hover:text-n-cream text-sm transition-colors"
          >
            Partner Login
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Title */}
        <div className="mb-12">
          <p className="eyebrow mb-3">✦ Curated Experiences</p>
          <h1 className="font-serif-italic text-n-cream text-4xl md:text-[52px] leading-tight mb-3">
            Discover Your Next Skillcation
          </h1>
          <p className="text-n-cream-muted text-[16px] max-w-xl">
            Hand-picked retreats, vetted by Nomara. From surf and yoga to cooking, art, and beyond.
          </p>
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="bg-n-surface border border-n-border rounded-nomara p-12 text-center">
            <span className="text-n-gold text-2xl block mb-3">✦</span>
            <p className="text-n-cream mb-2">Retreats coming soon</p>
            <p className="text-n-cream-muted text-sm">
              We&apos;re curating our first wave of experiences. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map(r => (
              <Link
                key={r.id}
                href={`/retreats/${r.slug}`}
                className="bg-n-surface border border-n-border rounded-nomara overflow-hidden hover:border-n-gold/50 transition-colors group"
              >
                <div className="aspect-[4/3] bg-n-bg relative overflow-hidden">
                  {r.hero_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.hero_image_url}
                      alt={r.retreat_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-n-gold text-4xl">✦</span>
                    </div>
                  )}
                  {r.vibe_tag && (
                    <span className="absolute top-4 left-4 bg-n-bg/80 backdrop-blur-sm border border-n-gold/30 text-n-gold eyebrow text-[10px] px-2.5 py-1 rounded-full">
                      {r.vibe_tag}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif-italic text-n-cream text-xl leading-tight mb-1">
                    {r.retreat_name}
                  </h3>
                  <p className="text-n-cream-muted text-sm mb-3">
                    {[r.location_town, r.location_region, r.location_country].filter(Boolean).join(', ')}
                  </p>
                  {r.tagline && (
                    <p className="text-n-cream-muted text-sm mb-4 line-clamp-2">{r.tagline}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-n-border">
                    {r.price_from ? (
                      <div>
                        <span className="text-n-cream-muted text-[10px] eyebrow block">From</span>
                        <span className="text-n-gold font-serif-italic text-xl">{formatCurrency(r.price_from)}</span>
                      </div>
                    ) : (
                      <span className="text-n-cream-muted text-sm">Pricing on request</span>
                    )}
                    {r.duration_days && (
                      <span className="text-n-cream-muted text-sm">{r.duration_days} days</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
