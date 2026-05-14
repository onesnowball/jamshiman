'use client'

import { useEffect, useMemo, useState } from 'react'

const MAIZE = '#FFCB05'
const BLUE = '#00274C'
const PALETTE = [MAIZE, BLUE, '#FFE082', '#1A3A6B']

type Piece = {
  id: number
  side: 'left' | 'right'
  startX: number   // vw, anchor of the cannon
  startY: number   // vh, anchor of the cannon
  peakDx: number   // vw, horizontal displacement at apex
  peakDy: number   // vh, vertical displacement at apex (negative = up)
  endDx: number    // vw, horizontal displacement at landing
  endDy: number    // vh, vertical displacement at landing
  delay: number    // ms
  duration: number // ms
  rotate: number   // total rotation in deg
  size: number     // px
  color: string
  shape: 'rect' | 'circle'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Trumpet/cannon-style confetti. Pieces launch up-and-inward from the two
 *  bottom corners, arc over the page, and fall slowly. Maize+blue palette. */
export function Confetti({
  show,
  count = 70,
  durationMs = 4200,
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
      const startX = side === 'left' ? -2 : 102          // vw, just off-edge
      const startY = 78 + (Math.random() - 0.5) * 6      // vh, near bottom
      const dir = side === 'left' ? 1 : -1               // travel inward + across
      const distance = 55 + Math.random() * 50           // vw of horizontal travel
      const height = 50 + Math.random() * 30             // vh of climb at apex
      const peakDx = dir * distance * (0.4 + Math.random() * 0.2)
      const peakDy = -height
      const endDx = dir * distance
      const endDy = 30 + Math.random() * 10              // land below viewport
      return {
        id: i,
        side,
        startX,
        startY,
        peakDx,
        peakDy,
        endDx,
        endDy,
        delay: Math.random() * 220,
        duration: durationMs * (0.85 + Math.random() * 0.3),
        rotate: (Math.random() - 0.5) * 540,
        size: 7 + Math.random() * 8,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        shape: Math.random() < 0.4 ? 'circle' : 'rect',
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
    }, durationMs + 700)
    return () => clearTimeout(t)
  }, [show, durationMs, onDone])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute will-change-transform"
          style={{
            left: `${p.startX}vw`,
            top: `${p.startY}vh`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.55 : p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '9999px' : '2px',
            // @ts-expect-error CSS variables
            '--peak-dx': `${p.peakDx}vw`,
            '--peak-dy': `${p.peakDy}vh`,
            '--end-dx': `${p.endDx}vw`,
            '--end-dy': `${p.endDy}vh`,
            '--rotate': `${p.rotate}deg`,
            '--duration': `${p.duration}ms`,
            '--delay': `${p.delay}ms`,
            animation: `confetti-arc var(--duration) cubic-bezier(0.25, 0.5, 0.5, 1) var(--delay) forwards`,
            opacity: 0,
            boxShadow: `0 0 0 0.5px ${p.color}`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-arc {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0 }
          8%   { opacity: 1 }
          /* apex of the arc */
          38%  { transform: translate3d(var(--peak-dx), var(--peak-dy), 0) rotate(calc(var(--rotate) * 0.45)); opacity: 1 }
          /* slow fall */
          100% { transform: translate3d(var(--end-dx), var(--end-dy), 0) rotate(var(--rotate)); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
