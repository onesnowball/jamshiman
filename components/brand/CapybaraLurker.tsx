'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { JamMascot, type JamState } from './JamMascot'

type LurkerMood =
  | { state: JamState; minMs: number; maxMs: number; bobY?: number; weight: number }

// Cycle pool. Picked weighted-randomly; sleepy is most common (lurker = chill).
const MOODS: LurkerMood[] = [
  { state: 'sleepy',      minMs: 7000,  maxMs: 14000, bobY: 0,  weight: 5 },
  { state: 'default',     minMs: 4000,  maxMs: 8000,  bobY: 2,  weight: 3 },
  { state: 'studying',    minMs: 5000,  maxMs: 9000,  bobY: 1,  weight: 2 },
  { state: 'caffeinated', minMs: 3000,  maxMs: 5000,  bobY: 3,  weight: 1 },
  { state: 'writing',     minMs: 4000,  maxMs: 7000,  bobY: 1,  weight: 1 },
  { state: 'confused',    minMs: 2500,  maxMs: 4000,  bobY: 1,  weight: 1 },
]

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

/** Small persistent capybara in the bottom-right corner. Cycles through
 *  states (sleepy, idle, studying, caffeinated, etc.) at random intervals,
 *  with a gentle breathing bob. Click to dismiss for this session. */
export function CapybaraLurker() {
  const pathname = usePathname()
  const [mood, setMood] = useState<LurkerMood>(MOODS[0])
  const [bobUp, setBobUp] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tipVisible, setTipVisible] = useState(false)

  // Hide on auth/onboarding pages to avoid distraction.
  const hideHere = pathname === '/auth/login'
    || pathname.startsWith('/auth/')
    || pathname === '/profile/onboarding'

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem('jamshiman:lurker_dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  // Random state transitions.
  useEffect(() => {
    if (dismissed || hideHere) return
    let cancelled = false
    function next() {
      if (cancelled) return
      const m = pickWeighted(MOODS)
      setMood(m)
      const delay = m.minMs + Math.random() * (m.maxMs - m.minMs)
      setTimeout(next, delay)
    }
    const initial = setTimeout(next, 1200)
    return () => { cancelled = true; clearTimeout(initial) }
  }, [dismissed, hideHere])

  // Breathing bob.
  useEffect(() => {
    if (dismissed || hideHere) return
    const interval = setInterval(() => setBobUp(b => !b), 1200)
    return () => clearInterval(interval)
  }, [dismissed, hideHere])

  if (dismissed || hideHere) return null

  const bobY = (mood.bobY ?? 1) * (bobUp ? -1 : 1)
  const tip = TIPS[mood.state] ?? 'just lurking 🫧'

  function dismiss() {
    try { window.sessionStorage.setItem('jamshiman:lurker_dismissed', '1') } catch {}
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-3 right-3 z-40 select-none pointer-events-auto"
      style={{ transform: `translateY(${bobY}px)`, transition: 'transform 1.2s ease-in-out' }}
      onMouseEnter={() => setTipVisible(true)}
      onMouseLeave={() => setTipVisible(false)}
    >
      <div className="relative">
        {tipVisible && (
          <div className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-gray-200 shadow-md text-[11px] text-gray-700">
            {tip}
            <button
              onClick={dismiss}
              className="ml-2 text-gray-400 hover:text-gray-700"
              aria-label="Dismiss capybara"
            >
              ×
            </button>
          </div>
        )}
        <button
          onClick={() => setTipVisible(v => !v)}
          className="block rounded-full hover:scale-105 active:scale-95 transition-transform"
          aria-label="Lurking capybara"
        >
          <JamMascot state={mood.state} size="sm" />
        </button>
      </div>
    </div>
  )
}

const TIPS: Partial<Record<JamState, string>> = {
  sleepy: 'shhh 🌙',
  default: 'hi 🫧',
  studying: 'reading along 📖',
  caffeinated: 'one more page ☕',
  writing: 'tiny notes 🌱',
  confused: 'wait what?',
  celebrating: 'yayyy ✨',
}
