'use client'

/**
 * Jami — pixel-art capybara mascot for jamshiman.
 *
 * Sprite frames are from Rainloaf's "Simple Capybara Sprite Sheet"
 * (https://rainloaf.itch.io/capybara-sprite-sheet), repacked from the
 * original .aseprite into a clean 4-row × 5-column grid:
 *
 *     row 0  walk   ←─ side-view walking gait
 *     row 1  sit    ←─ side-view sitting
 *     row 2  stand  ←─ side-view standing (idle)
 *     row 3  sleep  ←─ lying down (laying-down pose)
 *
 *   Frame box: 32×24 px. Sheet: 160×96 px. File: /public/brand/jami.png
 *
 * **Credit Rainloaf somewhere visible** — required by the license.
 * The CapybaraLurker tooltip carries the credit in app.
 *
 * Animation strategy: pure CSS background-position step. One setInterval
 * per mounted instance advances the frame index. No requestAnimationFrame,
 * no per-frame setState storms, no pixel-grid SVG. ~60 lines total.
 */

import { useEffect, useState } from 'react'

export type JamiState = 'walking' | 'sitting' | 'idle' | 'sleeping'

const FRAME_W = 32
const FRAME_H = 24
const FRAMES_PER_ANIM = 5

// Row index per state matches the repacked sheet's row order.
const ROW_BY_STATE: Record<JamiState, number> = {
  walking:  0,
  sitting:  1,
  idle:     2,  // "stand" pose, still + alert
  sleeping: 3,  // lying down
}

// Per-state frame timing. Sleep is mostly static so it ticks slow.
const FRAME_MS_BY_STATE: Record<JamiState, number> = {
  walking:  140,
  sitting:  260,
  idle:     320,
  sleeping: 900,
}

export interface JamiProps {
  state: JamiState
  /** Rendered width in CSS pixels. Pick integer multiples of 32 for crisp art. */
  size?: number
  className?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Jami({ state, size = 128, className }: JamiProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    setFrame(0)
    if (prefersReducedMotion()) return
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES_PER_ANIM)
    }, FRAME_MS_BY_STATE[state])
    return () => clearInterval(id)
  }, [state])

  // Scale factor — keeps pixels crisp.
  const scale = size / FRAME_W
  const row = ROW_BY_STATE[state]

  return (
    <div
      role="img"
      aria-label="Jami the capybara"
      className={className}
      style={{
        width: size,
        height: FRAME_H * scale,
        backgroundImage: 'url(/brand/jami.png)',
        backgroundRepeat: 'no-repeat',
        // The browser scales the entire sheet by `scale`. Sheet is 160×96
        // unscaled; sized = scale × that. background-position offsets are
        // in the scaled coordinate space.
        backgroundSize: `${160 * scale}px ${96 * scale}px`,
        backgroundPosition: `${-frame * FRAME_W * scale}px ${-row * FRAME_H * scale}px`,
        imageRendering: 'pixelated',
      }}
    />
  )
}
