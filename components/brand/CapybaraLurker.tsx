'use client'

// ============================================================================
// DO NOT REMOVE: Rainloaf credit is required by the sprite sheet license.
// The "art: Rainloaf" link in the tooltip below is the user-facing credit.
// If you ever swap to a different artist's sprite, replace the credit link;
// do not just delete it.
// ============================================================================

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Jami, type JamiState } from './Jami'

/* ─────────────────────────────────────────────────────────────────────
   Persistent capybara that lives in the bottom-right corner.

   ── Rhythm ──
   Most of the time, asleep. Roughly every 5–10 minutes the capybara
   has a "wake session" — a small coherent sequence:

       sleeping (5–10 min)
         ↓
       waking      (3–6 s, just opens eyes)
         ↓
       exploring   (5–12 s walk, ~70% of the time)
         ↓
       resting     (30–90 s sitting)
         ↓
       ~75% back to sleep, ~25% another short loop (explore → rest)
         ↓
       sleeping (5–10 min)

   Only horizontal motion. No stretching, no kicking, no jumping.

   First sleep on page load is shorter (2–5 min) so the user sees a
   wake cycle within the first few minutes; subsequent sleeps are full
   length.

   Art credit: Rainloaf, https://rainloaf.itch.io/capybara-sprite-sheet
   ───────────────────────────────────────────────────────────────────── */

type Activity =
  | { kind: 'sleeping' }
  | { kind: 'waking' }                          // brief idle, just standing
  | { kind: 'exploring'; facing: 'left' | 'right' }  // walking
  | { kind: 'resting' }                         // sitting
  | { kind: 'going-to-carrot' }
  | { kind: 'eating' }

const DURATIONS = {
  sleeping:  { min: 300_000, max: 600_000 },    // 5–10 min
  firstSleep:{ min: 120_000, max: 300_000 },    // 2–5 min on initial load
  waking:    { min:   3_000, max:   6_000 },
  exploring: { min:   5_000, max:  12_000 },
  resting:   { min:  30_000, max:  90_000 },
}

// After waking, decide what the capybara does first.
const POST_WAKE_EXPLORE_CHANCE = 0.70
// After resting, decide whether to settle back to sleep or wander more.
const POST_REST_SLEEP_CHANCE = 0.75
// Very rare carrot scene; replaces an explore step.
const CARROT_CHANCE_ON_EXPLORE = 0.04

const ZONE_WIDTH = 380
const ZONE_PADDING = 16
const SPRITE_W = 128

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}
function clampX(x: number) {
  const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
  return Math.max(ZONE_PADDING, Math.min(max, x))
}

const TIP: Record<Activity['kind'], string> = {
  sleeping:         'shhh… 🌙',
  waking:           'mm…',
  exploring:        'pitter patter',
  resting:          'just watching',
  'going-to-carrot':'oh… a carrot 🥕',
  eating:           'nom nom 🥕',
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
  const isFirstSleepRef = useRef(true)

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

  // Activity scheduler — explicit transitions only, no random per-tick roll.
  useEffect(() => {
    if (hide || dismissed) return
    clearAllTimers()

    if (activity.kind === 'sleeping') {
      const range = isFirstSleepRef.current ? DURATIONS.firstSleep : DURATIONS.sleeping
      isFirstSleepRef.current = false
      later(() => setActivity({ kind: 'waking' }), rand(range.min, range.max))
    }
    else if (activity.kind === 'waking') {
      later(() => {
        if (Math.random() < POST_WAKE_EXPLORE_CHANCE) {
          // Maybe a carrot replaces this walk.
          if (Math.random() < CARROT_CHANCE_ON_EXPLORE) {
            const carrotX = clampX(Math.random() * (ZONE_WIDTH - SPRITE_W - ZONE_PADDING * 2) + ZONE_PADDING)
            setCarrot({ x: carrotX })
            setFacing(carrotX < x ? 'left' : 'right')
            setActivity({ kind: 'going-to-carrot' })
          } else {
            const dir: 'left' | 'right' = x > ZONE_WIDTH / 2 ? 'left' : 'right'
            setFacing(dir)
            setActivity({ kind: 'exploring', facing: dir })
          }
        } else {
          // Skip the walk, go sit.
          setActivity({ kind: 'resting' })
        }
      }, rand(DURATIONS.waking.min, DURATIONS.waking.max))
    }
    else if (activity.kind === 'exploring') {
      later(() => setActivity({ kind: 'resting' }), rand(DURATIONS.exploring.min, DURATIONS.exploring.max))
    }
    else if (activity.kind === 'resting') {
      later(() => {
        if (Math.random() < POST_REST_SLEEP_CHANCE) {
          setActivity({ kind: 'sleeping' })
        } else {
          // One more wander, then forced back to sleep after.
          const dir: 'left' | 'right' = x > ZONE_WIDTH / 2 ? 'left' : 'right'
          setFacing(dir)
          setActivity({ kind: 'exploring', facing: dir })
        }
      }, rand(DURATIONS.resting.min, DURATIONS.resting.max))
    }
    else if (activity.kind === 'eating') {
      later(() => setCarrot(null), 900)
      later(() => setActivity({ kind: 'resting' }), 1800)
    }
    // going-to-carrot: handled by position watcher below.

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, dismissed, hide])

  // Slow horizontal scoot while moving.
  useEffect(() => {
    if (hide || dismissed) return
    if (activity.kind !== 'exploring' && activity.kind !== 'going-to-carrot') return
    const step = 1.0
    const id = window.setInterval(() => {
      setX(prev => {
        let nx = prev + (facing === 'right' ? step : -step)
        const min = ZONE_PADDING
        const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
        if (activity.kind === 'exploring') {
          if (nx <= min) nx = min  // stop at wall, don't bounce
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
  let jamiState: JamiState
  switch (activity.kind) {
    case 'sleeping':         jamiState = 'sleeping'; break
    case 'resting':
    case 'eating':           jamiState = 'sitting'; break
    case 'exploring':
    case 'going-to-carrot':  jamiState = 'walking'; break
    case 'waking':
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
