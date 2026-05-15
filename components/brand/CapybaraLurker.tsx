'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Jami, type JamiState } from './Jami'

/* ─────────────────────────────────────────────────────────────────────
   Persistent ground-floor capybara.

   ── Vibe ──
   This capybara is RELAXED. It mostly sleeps. It sometimes sits. It
   walks sideways once in a while. State changes are measured in
   minutes, not seconds. No stretching, no kicking, no carrots
   chasing — just a sleepy little corner companion.

   Only horizontal (left/right) motion. No vertical jumps or stretches.

   ── States ──
   - sleeping  → long deep nap (1.5–3 minutes)
   - sitting   → quiet, watchful (1–2 minutes)
   - idle      → brief between-state pause (8–18 seconds)
   - walking   → short stroll in one direction (5–9 seconds), then rest

   ── Carrot scene ──
   Very rare (~1 in 25 idle transitions). Even then, no chasing —
   the capybara just walks toward it once, sits, the carrot fades.

   Art credit: sprite frames from Rainloaf's "Simple Capybara Sprite Sheet"
   (https://rainloaf.itch.io/capybara-sprite-sheet) — credit shown in tooltip.
   ───────────────────────────────────────────────────────────────────── */

type Activity =
  | { kind: 'sleeping' }
  | { kind: 'sitting' }
  | { kind: 'idle' }
  | { kind: 'walking'; facing: 'left' | 'right' }
  | { kind: 'going-to-carrot' }
  | { kind: 'eating' }

// Durations in ms. Numbers chosen to feel SLOW.
const DURATIONS = {
  sleeping: { min: 90_000,  max: 180_000 },  // 1.5–3 min
  sitting:  { min: 60_000,  max: 120_000 },  // 1–2 min
  idle:     { min:  8_000,  max:  18_000 },  // brief check-in
  walking:  { min:  5_000,  max:   9_000 },  // short stroll
}

// Probability weights for what idle transitions INTO.
// Heavily biased toward rest states.
const NEXT_FROM_IDLE = [
  { kind: 'sleeping' as const, weight: 55 },  // mostly sleep
  { kind: 'sitting'  as const, weight: 35 },  // sometimes sit
  { kind: 'walking'  as const, weight: 9  },  // rarely walk
  { kind: 'carrot'   as const, weight: 1  },  // very rarely a carrot
]

const ZONE_WIDTH = 380
const ZONE_PADDING = 16
const SPRITE_W = 128

function clampX(x: number) {
  const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
  return Math.max(ZONE_PADDING, Math.min(max, x))
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const TIP: Record<Activity['kind'], string> = {
  sleeping: 'shhh… 🌙',
  sitting:  'just watching',
  idle:     'mm…',
  walking:  'pitter patter',
  'going-to-carrot': 'oh… a carrot 🥕',
  eating:   'nom nom 🥕',
}

export function CapybaraLurker() {
  const pathname = usePathname()
  const hide = pathname === '/auth/login' || pathname.startsWith('/auth/') || pathname === '/profile/onboarding'

  const [dismissed, setDismissed] = useState(false)
  const [tipVisible, setTipVisible] = useState(false)
  const [x, setX] = useState(() => ZONE_WIDTH - SPRITE_W - ZONE_PADDING - 20)
  const [facing, setFacing] = useState<'left' | 'right'>('left')
  const [activity, setActivity] = useState<Activity>({ kind: 'sleeping' })
  const [carrot, setCarrot] = useState<{ x: number } | null>(null)
  const timersRef = useRef<number[]>([])

  function clearAllTimers() {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }
  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }

  // Persist dismissal per session.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem('jamshiman:lurker_dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  // Activity scheduler.
  useEffect(() => {
    if (hide || dismissed) return
    clearAllTimers()

    if (activity.kind === 'sleeping') {
      later(() => setActivity({ kind: 'idle' }), rand(DURATIONS.sleeping.min, DURATIONS.sleeping.max))
    } else if (activity.kind === 'sitting') {
      later(() => setActivity({ kind: 'idle' }), rand(DURATIONS.sitting.min, DURATIONS.sitting.max))
    } else if (activity.kind === 'idle') {
      later(() => {
        const next = pickWeighted(NEXT_FROM_IDLE)
        if (next.kind === 'sleeping') setActivity({ kind: 'sleeping' })
        else if (next.kind === 'sitting') setActivity({ kind: 'sitting' })
        else if (next.kind === 'walking') {
          // Pick whichever direction has more room to wander.
          const direction: 'left' | 'right' = x > ZONE_WIDTH / 2 ? 'left' : 'right'
          setFacing(direction)
          setActivity({ kind: 'walking', facing: direction })
        } else {
          // carrot
          const carrotX = clampX(Math.random() * (ZONE_WIDTH - SPRITE_W - ZONE_PADDING * 2) + ZONE_PADDING)
          setCarrot({ x: carrotX })
          setFacing(carrotX < x ? 'left' : 'right')
          setActivity({ kind: 'going-to-carrot' })
        }
      }, rand(DURATIONS.idle.min, DURATIONS.idle.max))
    } else if (activity.kind === 'walking') {
      later(() => setActivity({ kind: 'idle' }), rand(DURATIONS.walking.min, DURATIONS.walking.max))
    } else if (activity.kind === 'eating') {
      later(() => setCarrot(null), 900)
      later(() => setActivity({ kind: 'sitting' }), 1800)
    }
    // going-to-carrot: handled by position watcher below

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, dismissed, hide])

  // Position tick — only while moving. Sideways only.
  useEffect(() => {
    if (hide || dismissed) return
    if (activity.kind !== 'walking' && activity.kind !== 'going-to-carrot') return
    const step = 1.0 // slower, more relaxed pace
    const id = window.setInterval(() => {
      setX(prev => {
        let nx = prev + (facing === 'right' ? step : -step)
        const min = ZONE_PADDING
        const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
        if (activity.kind === 'walking') {
          // Don't bounce; just stop at the wall and idle out naturally.
          if (nx <= min) nx = min
          if (nx >= max) nx = max
        }
        if (activity.kind === 'going-to-carrot' && carrot) {
          if (Math.abs(nx - carrot.x) < 8) {
            setActivity({ kind: 'eating' })
            return carrot.x
          }
        }
        return nx
      })
    }, 50)
    return () => window.clearInterval(id)
  }, [activity, facing, carrot, hide, dismissed])

  if (hide || dismissed) return null

  function dismiss() {
    try { window.sessionStorage.setItem('jamshiman:lurker_dismissed', '1') } catch {}
    setDismissed(true)
  }

  // Map activity → Jami sprite state.
  // We intentionally don't use 'stretching' — it's a vertical animation
  // and we want only sideways motion.
  let jamiState: JamiState
  switch (activity.kind) {
    case 'sleeping':         jamiState = 'sleeping'; break
    case 'sitting':
    case 'eating':           jamiState = 'sitting'; break
    case 'walking':
    case 'going-to-carrot':  jamiState = 'walking'; break
    default:                 jamiState = 'idle'
  }

  const flip = facing === 'left'

  return (
    <div
      className="fixed bottom-0 right-0 z-40 pointer-events-none select-none"
      style={{ width: ZONE_WIDTH, height: 96 }}
    >
      {carrot && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: carrot.x + SPRITE_W / 2 - 9,
            bottom: 12,
            opacity: activity.kind === 'eating' ? 0 : 1,
            transition: 'opacity 800ms ease-out',
          }}
        >
          <CarrotSvg size={20} />
        </div>
      )}

      <div
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          left: x,
          bottom: 4,
          transition: 'left 80ms linear',
          transform: flip ? 'scaleX(-1)' : undefined,
          transformOrigin: 'center',
        }}
        onMouseEnter={() => setTipVisible(true)}
        onMouseLeave={() => setTipVisible(false)}
        onClick={() => setTipVisible(v => !v)}
      >
        {tipVisible && (
          <div
            className="absolute bottom-full mb-1 right-0 whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-gray-200 shadow-md text-[11px] text-gray-700 flex items-center gap-1.5"
            style={{ transform: flip ? 'scaleX(-1)' : undefined }}
          >
            <span>{TIP[activity.kind]}</span>
            <a
              href="https://rainloaf.itch.io/capybara-sprite-sheet"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline"
              title="Art by Rainloaf"
            >
              art: Rainloaf
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss() }}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        <Jami state={jamiState} size={SPRITE_W} />
      </div>
    </div>
  )
}

function CarrotSvg({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 7 7" width={size} height={size * (7 / 7)} shapeRendering="crispEdges" aria-hidden>
      <rect x="2" y="0" width="3" height="1" fill="#5BA552" />
      <rect x="2" y="1" width="3" height="1" fill="#5BA552" />
      <rect x="1" y="2" width="5" height="1" fill="#FFA94D" />
      <rect x="1" y="3" width="5" height="1" fill="#FFA94D" />
      <rect x="2" y="4" width="3" height="1" fill="#FFA94D" />
      <rect x="3" y="5" width="1" height="1" fill="#FFA94D" />
    </svg>
  )
}
