'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CapybaraSprite, CarrotSprite } from './CapybaraSprite'
import type { SpriteName } from './capybara-sprites'

/* ─────────────────────────────────────────────────────────────────────
   Persistent ground-floor capybara that lurks across the bottom edge.

   States:
   - sleeping → curled up with Zs
   - idle     → sits, looks around
   - walking  → strolls across the corner zone
   - eating   → carrot spawns nearby, walks to it, chomps, then resumes

   Behavior is timer-driven; intentionally simple, no game loop.
   Click the × in the tooltip to dismiss for the session.
   ───────────────────────────────────────────────────────────────────── */

type Activity =
  | { kind: 'sleeping' }
  | { kind: 'idle' }
  | { kind: 'walking'; facing: 'left' | 'right' }
  | { kind: 'going-to-carrot' }
  | { kind: 'eating'; bites: number }

// Lurker lives within the bottom-right ~360px-wide zone.
const ZONE_WIDTH = 360
const ZONE_PADDING = 16
const SPRITE_W = 112 // px wide, scales body proportionally

function clampX(x: number) {
  const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
  return Math.max(ZONE_PADDING, Math.min(max, x))
}

const TIP: Record<Activity['kind'], string> = {
  sleeping: 'shhh… 🌙',
  idle: 'just lurking 🫧',
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
  const [walkFrame, setWalkFrame] = useState<'walkA' | 'walkB'>('walkA')
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

  // Footstep frame oscillator while walking.
  useEffect(() => {
    if (activity.kind !== 'walking' && activity.kind !== 'going-to-carrot') return
    const id = window.setInterval(() => setWalkFrame(f => (f === 'walkA' ? 'walkB' : 'walkA')), 220)
    return () => window.clearInterval(id)
  }, [activity.kind])

  // Activity scheduler: when activity changes, schedule next transition.
  useEffect(() => {
    if (hide || dismissed) return
    clearAllTimers()

    if (activity.kind === 'sleeping') {
      later(() => setActivity({ kind: 'idle' }), 9000 + Math.random() * 7000)
    }
    else if (activity.kind === 'idle') {
      later(() => {
        // 35% chance to nap, 35% chance to walk, 20% to spawn a carrot, 10% idle longer
        const roll = Math.random()
        if (roll < 0.35) setActivity({ kind: 'sleeping' })
        else if (roll < 0.7) {
          const direction: 'left' | 'right' = x > ZONE_WIDTH / 2 ? 'left' : 'right'
          setFacing(direction)
          setActivity({ kind: 'walking', facing: direction })
        } else if (roll < 0.9) {
          const carrotX = clampX(Math.random() * (ZONE_WIDTH - SPRITE_W - ZONE_PADDING * 2) + ZONE_PADDING)
          setCarrot({ x: carrotX })
          setFacing(carrotX < x ? 'left' : 'right')
          setActivity({ kind: 'going-to-carrot' })
        } else {
          setActivity({ kind: 'idle' })
        }
      }, 3500 + Math.random() * 3000)
    }
    else if (activity.kind === 'walking') {
      // Walk for ~3-5s, then idle
      later(() => setActivity({ kind: 'idle' }), 3000 + Math.random() * 2000)
    }
    // going-to-carrot: handled by position-watcher below
    else if (activity.kind === 'eating') {
      if (activity.bites < 3) {
        later(() => setActivity({ kind: 'eating', bites: activity.bites + 1 }), 600)
      } else {
        // carrot gone; back to idle
        setCarrot(null)
        later(() => setActivity({ kind: 'idle' }), 800)
      }
    }

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, dismissed, hide])

  // Position tick: while walking or going-to-carrot, scoot x by a small step.
  useEffect(() => {
    if (hide || dismissed) return
    if (activity.kind !== 'walking' && activity.kind !== 'going-to-carrot') return
    const step = 1.2
    const id = window.setInterval(() => {
      setX(prev => {
        let nx = prev + (facing === 'right' ? step : -step)
        const min = ZONE_PADDING
        const max = ZONE_WIDTH - SPRITE_W - ZONE_PADDING
        // Bounce within zone while just walking
        if (activity.kind === 'walking') {
          if (nx <= min) { setFacing('right'); nx = min }
          if (nx >= max) { setFacing('left'); nx = max }
        }
        // For carrot pursuit: stop when close enough
        if (activity.kind === 'going-to-carrot' && carrot) {
          const dist = Math.abs(nx - carrot.x)
          if (dist < 6) {
            setActivity({ kind: 'eating', bites: 0 })
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

  // Sprite selection
  let sprite: SpriteName = 'idle'
  if (activity.kind === 'sleeping') sprite = 'sleeping'
  else if (activity.kind === 'eating') sprite = activity.bites % 2 === 0 ? 'eating' : 'chomp'
  else if (activity.kind === 'walking' || activity.kind === 'going-to-carrot') sprite = walkFrame
  else sprite = 'idle'

  const flip = facing === 'left'

  return (
    <div
      className="fixed bottom-0 right-0 z-40 pointer-events-none select-none"
      style={{ width: ZONE_WIDTH, height: 90 }}
    >
      {/* Carrot */}
      {carrot && activity.kind !== 'eating' && (
        <div
          className="absolute pointer-events-none"
          style={{ left: carrot.x + SPRITE_W / 2 - 9, bottom: 10 }}
        >
          <CarrotSprite size={18} />
        </div>
      )}

      {/* Capybara */}
      <div
        className="absolute pointer-events-auto cursor-pointer"
        style={{ left: x, bottom: 8, transition: 'left 60ms linear' }}
        onMouseEnter={() => setTipVisible(true)}
        onMouseLeave={() => setTipVisible(false)}
        onClick={() => setTipVisible(v => !v)}
      >
        {tipVisible && (
          <div className="absolute bottom-full mb-1 right-0 whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-gray-200 shadow-md text-[11px] text-gray-700 flex items-center gap-1.5">
            <span>{TIP[activity.kind]}</span>
            <button onClick={(e) => { e.stopPropagation(); dismiss() }} className="text-gray-400 hover:text-gray-700" aria-label="Dismiss">×</button>
          </div>
        )}
        <CapybaraSprite sprite={sprite} size={SPRITE_W} flip={flip} />
      </div>
    </div>
  )
}
