'use client'

import { useEffect, useMemo, useState } from 'react'

// Maize-and-blue, but lighter so the dark navy doesn't read as "soot".
const PALETTE = [
  '#FFCB05', // primary maize
  '#FFE082', // light maize
  '#FFB300', // amber maize
  '#1E3A8A', // medium blue (replaces near-black navy)
  '#3B82F6', // bright blue
  '#60A5FA', // sky blue
  '#FFFFFF', // white sparkle
]

type Piece = {
  id: number
  side: 'left' | 'right'
  startX: number
  startY: number
  peakDx: number
  peakDy: number
  endDx: number
  endDy: number
  delay: number
  duration: number
  spinRevs: number  // total rotations during flight
  spinDir: 1 | -1
  width: number
  height: number
  color: string
  shape: 'rect' | 'circle' | 'streamer'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Cannon-style confetti. Pieces launch from both bottom corners on
 *  parabolic arcs and spiral continuously as they drift down.
 *  Implemented as two nested transforms so X is linear (constant horizontal
 *  velocity), Y follows ease-in for gravity, and rotation is independent
 *  and continuous (real spinning, not interpolated). */
export function Confetti({
  show,
  count = 90,
  durationMs = 5200,
  onDone,
}: {
  show: boolean
  count?: number
  durationMs?: number
  onDone?: () => void
}) {
  const [visible, setVisible] = useState(false)

  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
      const dir = side === 'left' ? 1 : -1
      const startX = side === 'left' ? -2 : 102
      const startY = 78 + (Math.random() - 0.5) * 4
      // arc spread
      const horiz = 55 + Math.random() * 60
      const climb = 55 + Math.random() * 35
      const peakDx = dir * horiz * (0.35 + Math.random() * 0.25)
      const peakDy = -climb
      const endDx = dir * horiz * (1 + Math.random() * 0.25)
      const endDy = 30 + Math.random() * 15

      // Shape + size variation: lots of small + a few big ribbons
      const shapeRoll = Math.random()
      let shape: 'rect' | 'circle' | 'streamer'
      let width: number, height: number
      if (shapeRoll < 0.18) { shape = 'streamer'; width = 4 + Math.random() * 3; height = 18 + Math.random() * 14 }
      else if (shapeRoll < 0.45) { shape = 'circle'; const r = 6 + Math.random() * 6; width = r; height = r }
      else { shape = 'rect'; width = 6 + Math.random() * 10; height = 4 + Math.random() * 10 }

      return {
        id: i,
        side,
        startX,
        startY,
        peakDx,
        peakDy,
        endDx,
        endDy,
        delay: Math.random() * 260,
        duration: durationMs * (0.85 + Math.random() * 0.4),
        spinRevs: 2 + Math.random() * 5,
        spinDir: Math.random() < 0.5 ? -1 : 1,
        width,
        height,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        shape,
      }
    })
  }, [count, durationMs, show])

  useEffect(() => {
    if (!show) return
    if (prefersReducedMotion()) { onDone?.(); return }
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, durationMs + 800)
    return () => clearTimeout(t)
  }, [show, durationMs, onDone])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map(p => {
        const totalSpinDeg = p.spinRevs * 360 * p.spinDir
        return (
          <span
            key={p.id}
            className="absolute will-change-transform"
            style={{
              left: `${p.startX}vw`,
              top: `${p.startY}vh`,
              // outer wrapper: horizontal motion (linear, constant velocity)
              // @ts-expect-error CSS vars
              '--end-dx': `${p.endDx}vw`,
              '--peak-dx': `${p.peakDx}vw`,
              '--duration': `${p.duration}ms`,
              '--delay': `${p.delay}ms`,
              animation: `confetti-x var(--duration) linear var(--delay) forwards`,
              opacity: 0,
            }}
          >
            <span
              className="block will-change-transform"
              style={{
                // @ts-expect-error CSS vars
                '--peak-dy': `${p.peakDy}vh`,
                '--end-dy': `${p.endDy}vh`,
                '--duration': `${p.duration}ms`,
                '--delay': `${p.delay}ms`,
                animation: `confetti-y var(--duration) linear var(--delay) forwards`,
              }}
            >
              <span
                className="block will-change-transform"
                style={{
                  width: p.width,
                  height: p.height,
                  background: p.color,
                  borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'streamer' ? '999px' : '2px',
                  // @ts-expect-error CSS vars
                  '--spin-deg': `${totalSpinDeg}deg`,
                  '--duration': `${p.duration}ms`,
                  '--delay': `${p.delay}ms`,
                  animation: `confetti-spin var(--duration) linear var(--delay) forwards`,
                  boxShadow: `0 0 0 0.5px ${p.color}55`,
                }}
              />
            </span>
          </span>
        )
      })}
      <style>{`
        /* Horizontal: constant velocity, plus quick fade-in. */
        @keyframes confetti-x {
          0%   { transform: translate3d(0, 0, 0); opacity: 0 }
          8%   { opacity: 1 }
          100% { transform: translate3d(var(--end-dx), 0, 0); opacity: 1 }
        }
        /* Vertical: ease-out on the way up, ease-in on the way down (gravity). */
        @keyframes confetti-y {
          0%   { transform: translate3d(0, 0, 0); animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1) }
          30%  { transform: translate3d(0, var(--peak-dy), 0); animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.5) }
          100% { transform: translate3d(0, var(--end-dy), 0) }
        }
        /* Rotation: continuous spin, independent of arc. */
        @keyframes confetti-spin {
          0%   { transform: rotate(0deg) }
          100% { transform: rotate(var(--spin-deg)) }
        }
      `}</style>
    </div>
  )
}
