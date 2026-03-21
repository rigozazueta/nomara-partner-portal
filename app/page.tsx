'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

const LOGO_URL = 'https://ymluewfhvthmvaaupspz.supabase.co/storage/v1/object/public/NomaraImages/Nomara%20Logo%20(YouTube%20Thumbnail)%20(3).png'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-14">
        <Image
          src={LOGO_URL}
          alt="Nomara"
          width={220}
          height={80}
          className="mx-auto mb-4"
          priority
        />
        <div className="w-[60px] h-[1px] bg-n-gold mx-auto mt-2 mb-5" />
        <p className="eyebrow tracking-[0.2em] text-[13px]">
          Partner Portal
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => router.push('/operator')}
          className="flex-1 bg-n-gold hover:bg-[#d4b96a] text-n-bg font-medium py-4 px-6 rounded-nomara transition-colors text-center text-[15px]"
        >
          I&apos;m a Retreat Partner
        </button>
        <button
          onClick={() => router.push('/admin')}
          className="flex-1 bg-n-surface hover:bg-[#153a22] text-n-cream font-medium py-4 px-6 rounded-nomara border border-n-cream/20 transition-colors text-center text-[15px]"
        >
          Admin Login
        </button>
      </div>

      <p className="font-serif-italic text-n-cream-muted text-sm mt-14">
        Surf &amp; yoga travel, done right.
      </p>
    </div>
  )
}
