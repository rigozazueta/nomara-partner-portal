'use client'

import { useState, useEffect } from 'react'

interface Props {
  images: string[]
  alt: string
}

export default function HeroCarousel({ images, alt }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length])

  const next = () => setIndex(i => (i + 1) % images.length)
  const prev = () => setIndex(i => (i - 1 + images.length) % images.length)

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[560px] bg-n-surface overflow-hidden flex items-center justify-center">
        <span className="text-n-gold text-6xl">✦</span>
        <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-n-bg/30 to-transparent" />
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[560px] bg-n-surface overflow-hidden group">
      {/* Images */}
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={`${alt} — photo ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-n-bg/30 to-transparent pointer-events-none" />

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-n-bg/70 hover:bg-n-bg border border-n-gold/30 text-n-cream flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          >
            ←
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-n-bg/70 hover:bg-n-bg border border-n-gold/30 text-n-cream flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          >
            →
          </button>

          {/* Counter */}
          <div className="absolute top-4 right-4 bg-n-bg/70 border border-n-gold/30 text-n-cream text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            {index + 1} / {images.length}
          </div>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === index ? 'bg-n-gold w-8' : 'bg-n-cream/40 hover:bg-n-cream/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
