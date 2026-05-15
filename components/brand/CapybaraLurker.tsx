'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Jami, type JamiState } from './Jami'

/* ─────────────────────────────────────────────────────────────────────
   Persistent ground-floor capybara that lurks across the bottom edge.

   Built on the new <Jami> sprite system. Available animation states are
   idle / walking / sleeping / stretching / sitting.

   Lifecycle:
     sleeping → stretching → idle → walking → idle → sitting → sleeping
                                    ↘ if carrot spawned: → walking-to-carrot → sitting (eats)

   Click the × in the tooltip to dismiss for the session.

   Art credit: sprite frames from Rainloaf's "Simple Capybara Sprite Sheet"
   (https://rainloaf.itch.io/capybara-sprite-sheet) — credited in the
   tooltip below per the asset license.
   ───────────────────────────────────────────────────────────────────── */

type Activity =
  | { kind: 'sleeping' }
  | { kind: 'waking' } // stretching frames
  | { kind: 'idle' }
  | { kind: 'sitting' }
  | { kind: 'walking'; facing: 'left' | 'right' }
  | { kind: 'going-to-carrot' }
  | { kind: 'eating' } // sit + carrot fades

const ZONE_WIDTH = 380
const ZONE_PADDING = 16
const SPRITE_W = 128 // CSS pixels (Jami renders 32x32 scaled up; integer multiples stay crisp)

function clampX(x: number) {
  const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
  return Math.max(ZONE_PADDING, Math.min(max, x))
}

const TIP: Record<Activity['kind'], string> = {
  sleeping: 'shhh… 🌙',
  waking: 'good morning',
  idle: 'just lurking 🫧',
  sitting: 'thinking',
  walking: 'pitter patter',
  'going-to-carrot': 'is that a carrot?? 🥕',
  eating: 'nom nom 🥕',
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

  // Activity scheduler: when activity changes, schedule the next transition.
  useEffect(() => {
    if (hide || dismissed) return
    clearAllTimers()

    if (activity.kind === 'sleeping') {
      later(() => setActivity({ kind: 'waking' }), 8000 + Math.random() * 8000)
    } else if (activity.kind === 'waking') {
      later(() => setActivity({ kind: 'idle' }), 1300)
    } else if (activity.kind === 'idle') {
      later(() => {
        const roll = Math.random()
        if (roll < 0.30) setActivity({ kind: 'sleeping' })
        else if (roll < 0.55) setActivity({ kind: 'sitting' })
        else if (roll < 0.85) {
          const direction: 'left' | 'right' = x > ZONE_WIDTH / 2 ? 'left' : 'right'
          setFacing(direction)
          setActivity({ kind: 'walking', facing: direction })
        } else {
          // Spawn a carrot and pursue it
          const carrotX = clampX(Math.random() * (ZONE_WIDTH - SPRITE_W - ZONE_PADDING * 2) + ZONE_PADDING)
          setCarrot({ x: carrotX })
          setFacing(carrotX < x ? 'left' : 'right')
          setActivity({ kind: 'going-to-carrot' })
        }
      }, 3500 + Math.random() * 3500)
    } else if (activity.kind === 'sitting') {
      later(() => setActivity({ kind: 'idle' }), 3000 + Math.random() * 2500)
    } else if (activity.kind === 'walking') {
      later(() => setActivity({ kind: 'idle' }), 3500 + Math.random() * 2000)
    } else if (activity.kind === 'eating') {
      // Sit while the carrot fades away over ~1.8s, then go idle.
      later(() => setCarrot(null), 900)
      later(() => setActivity({ kind: 'idle' }), 1800)
    }
    // going-to-carrot: position watcher below transitions to eating.

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, dismissed, hide])

  // Position tick: scoot x while walking or pursuing a carrot.
  useEffect(() => {
    if (hide || dismissed) return
    if (activity.kind !== 'walking' && activity.kind !== 'going-to-carrot') return
    const step = 1.4
    const id = window.setInterval(() => {
      setX(prev => {
        let nx = prev + (facing === 'right' ? step : -step)
        const min = ZONE_PADDING
        const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
        if (activity.kind === 'walking') {
          if (nx <= min) { setFacing('right'); nx = min }
          if (nx >= max) { setFacing('left'); nx = max }
        }
        if (activity.kind === 'going-to-carrot' && carrot) {
          const dist = Math.abs(nx - carrot.x)
          if (dist < 8) {
            setActivity({ kind: 'eating' })
            return carrot.x
          }
        }
        return nx
      })
    }, 35)
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
    case 'waking':           jamiState = 'stretching'; break
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
      {/* Carrot — fades out while eating */}
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

      {/* Capybara */}
      <div
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          left: x,
          bottom: 4,
          transition: 'left 60ms linear',
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

/** Tiny inline carrot — kept here since it's the only place using it. */
function CarrotSvg({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 7 7" width={size} height={size * (7 / 7)} shapeRendering="crispEdges" aria-hidden>
      {/* leaves */}
      <rect x="2" y="0" width="3" height="1" fill="#5BA552" />
      <rect x="2" y="1" width="3" height="1" fill="#5BA552" />
      {/* body */}
      <rect x="1" y="2" width="5" height="1" fill="#FFA94D" />
      <rect x="1" y="3" width="5" height="1" fill="#FFA94D" />
      <rect x="2" y="4" width="3" height="1" fill="#FFA94D" />
      <rect x="3" y="5" width="1" height="1" fill="#FFA94D" />
    </svg>
  )
}
