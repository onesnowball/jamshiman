'use client'

import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function RollingNumber({
  value,
  decimals = 0,
  durationMs = 600,
  className,
  suffix,
}: {
  value: number | null | undefined
  decimals?: number
  durationMs?: number
  className?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState<number>(typeof value === 'number' ? value : 0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef<number>(typeof value === 'number' ? value : 0)
  const toRef = useRef<number>(typeof value === 'number' ? value : 0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      setDisplay(0)
      return
    }
    if (prefersReducedMotion()) {
      setDisplay(value)
      return
    }
    fromRef.current = display
    toRef.current = value
    startRef.current = null

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts
      const t = Math.min(1, (ts - startRef.current) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = fromRef.current + (toRef.current - fromRef.current) * eased
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return <span className={className}>—</span>
  }
  return <span className={className}>{display.toFixed(decimals)}{suffix ?? ''}</span>
}
