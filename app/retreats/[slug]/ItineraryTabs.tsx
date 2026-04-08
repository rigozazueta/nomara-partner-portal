'use client'

import { useState } from 'react'

interface Day {
  id: string
  day_number: number
  title: string
  activities: string[] | null
  image_url: string | null
}

export default function ItineraryTabs({ days }: { days: Day[] }) {
  const [activeDay, setActiveDay] = useState(days[0]?.day_number || 1)
  const current = days.find(d => d.day_number === activeDay)

  if (days.length === 0) return null

  return (
    <div>
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {days.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDay(d.day_number)}
            className={`px-5 py-2.5 rounded-nomara text-sm font-medium transition-all ${
              activeDay === d.day_number
                ? 'bg-n-gold text-n-bg'
                : 'bg-n-surface text-n-cream-muted hover:text-n-cream border border-n-border'
            }`}
          >
            Day {d.day_number}
          </button>
        ))}
      </div>

      {/* Active day card */}
      {current && (
        <div className="bg-n-surface border border-n-border rounded-nomara overflow-hidden">
          {current.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.image_url}
              alt={`Day ${current.day_number} — ${current.title}`}
              className="w-full aspect-[16/9] object-cover"
            />
          )}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-n-gold text-n-gold text-sm font-medium shrink-0">
                {current.day_number}
              </span>
              <h3 className="font-serif-italic text-n-cream text-2xl md:text-3xl leading-tight">
                {current.title}
              </h3>
            </div>
            {current.activities && current.activities.length > 0 && (
              <ul className="space-y-3 mt-5">
                {current.activities.map((activity, i) => (
                  <li key={i} className="flex items-start gap-3 text-n-cream-muted">
                    <span className="text-n-gold text-sm mt-1 shrink-0">✦</span>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
