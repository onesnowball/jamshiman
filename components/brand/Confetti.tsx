'use client'

import { useEffect, useMemo, useState } from 'react'

const MAIZE = '#FFCB05'
const BLUE = '#00274C'
const PALETTE = [MAIZE, BLUE, '#FFE082', '#1A3A6B']

type Piece = {
  id: number
  left: number   // 0..100 %
  delay: number  // ms
  duration: number // ms
  drift: number  // px
  rotate: number // deg
  size: number   // px
  color: string
  shape: 'rect' | 'circle'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Confetti({
  show,
  count = 60,
  durationMs = 1800,
  onDone,
}: {
  show: boolean
  count?: number
  durationMs?: number
  onDone?: () => void
}) {
  const [visible, setVisible] = useState(false)

  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 250,
      duration: durationMs * (0.7 + Math.random() * 0.6),
      drift: (Math.random() - 0.5) * 240,
      rotate: (Math.random() - 0.5) * 720,
      size: 6 + Math.random() * 8,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      shape: Math.random() < 0.35 ? 'circle' : 'rect',
    }))
  }, [count, durationMs, show])

  useEffect(() => {
    if (!show) return
    if (prefersReducedMotion()) { onDone?.(); return }
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, durationMs + 400)
    return () => clearTimeout(t)
  }, [show, durationMs, onDone])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute top-0 will-change-transform"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.55 : p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '9999px' : '2px',
            // @ts-expect-error CSS variables
            '--drift': `${p.drift}px`,
            '--rotate': `${p.rotate}deg`,
            '--duration': `${p.duration}ms`,
            '--delay': `${p.delay}ms`,
            animation: `confetti-fall var(--duration) cubic-bezier(0.15, 0.6, 0.4, 1) var(--delay) forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0 }
          10%  { opacity: 1 }
          100% { transform: translate3d(var(--drift), 105vh, 0) rotate(var(--rotate)); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
