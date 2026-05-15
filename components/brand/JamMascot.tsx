/**
 * JamMascot — thin compatibility wrapper around <Jami>.
 *
 * Pages around the app pass states like 'sleepy' / 'celebrating' /
 * 'studying' / 'caffeinated' etc. The underlying Jami component only
 * knows five real animation cycles (idle / walking / sleeping /
 * stretching / sitting). This wrapper maps the old vocabulary to the
 * new sprite states and keeps every existing call site working.
 *
 * Art credit: sprite frames from Rainloaf's "Simple Capybara Sprite Sheet"
 * (https://rainloaf.itch.io/capybara-sprite-sheet), used with credit per
 * Rainloaf's license. See Jami.tsx for the full notice.
 */

import { clsx } from 'clsx'
import { Jami, type JamiState } from './Jami'
import { MascotErrorBoundary } from './MascotErrorBoundary'

export type JamState =
  | 'default'
  | 'sleepy'
  | 'celebrating'
  | 'studying'
  | 'empty'
  | 'loading'
  | 'locked'
  | 'caffeinated'
  | 'writing'
  | 'confused'

export type JamSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<JamSize, number> = { sm: 56, md: 88, lg: 128, xl: 176 }

// Map legacy state names to the underlying Jami animation states.
const STATE_MAP: Record<JamState, JamiState> = {
  default:      'idle',
  sleepy:       'sleeping',
  celebrating:  'idle',     // (no celebration cycle in the sprite set — Confetti carries the moment)
  studying:     'sitting',
  empty:        'sitting',
  loading:      'idle',
  locked:       'sitting',
  caffeinated:  'idle',
  writing:      'sitting',
  confused:     'sitting',
}

const STATE_LABEL: Record<JamState, string> = {
  default: 'Jami',
  sleepy: 'Sleepy Jami',
  celebrating: 'Celebrating Jami',
  studying: 'Studying Jami',
  empty: 'Quiet Jami',
  loading: 'Loading',
  locked: 'Locked Jami',
  caffeinated: 'Caffeinated Jami',
  writing: 'Writing Jami',
  confused: 'Confused Jami',
}

export function JamMascot({
  state = 'default',
  size = 'md',
  className,
}: {
  state?: JamState
  size?: JamSize
  className?: string
}) {
  const px = SIZE_PX[size]
  return (
    <span
      role="img"
      aria-label={STATE_LABEL[state]}
      className={clsx('inline-block relative', className)}
      style={{ width: px, height: px }}
    >
      <MascotErrorBoundary>
        <Jami state={STATE_MAP[state]} size={px} />
      </MascotErrorBoundary>
      {/* tiny status overlays — Jami's sprite is neutral; these still
          carry the per-state meaning the old wrapper conveyed. */}
      {state === 'caffeinated' && (
        <span className="absolute -top-1 left-1 text-[10px] pointer-events-none">☕</span>
      )}
      {state === 'celebrating' && (
        <span className="absolute -top-1 right-1 text-[12px] pointer-events-none">✨</span>
      )}
      {state === 'confused' && (
        <span className="absolute -top-1 right-1 text-[12px] font-bold text-gray-700 pointer-events-none">?</span>
      )}
      {state === 'writing' && (
        <span className="absolute -top-1 right-1 text-[10px] pointer-events-none">🌱</span>
      )}
    </span>
  )
}
