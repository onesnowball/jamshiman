import { clsx } from 'clsx'
import { CapybaraSprite } from './CapybaraSprite'
import type { SpriteName } from './capybara-sprites'

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

const STATE_SPRITE: Record<JamState, SpriteName> = {
  default: 'idle',
  sleepy: 'sleeping',
  celebrating: 'sitting',
  studying: 'sitting',
  empty: 'idle',
  loading: 'idle',
  locked: 'idle',
  caffeinated: 'idle',
  writing: 'idle',
  confused: 'sitting',
}

const STATE_LABEL: Record<JamState, string> = {
  default: 'Capy',
  sleepy: 'Sleepy Capy',
  celebrating: 'Celebrating Capy',
  studying: 'Studying Capy',
  empty: 'Quiet Capy',
  loading: 'Loading',
  locked: 'Locked Capy',
  caffeinated: 'Caffeinated Capy',
  writing: 'Writing Capy',
  confused: 'Confused Capy',
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
      style={{ width: px, height: (px * 16) / 28 + 12 }}
    >
      <CapybaraSprite sprite={STATE_SPRITE[state]} size={px} />
      {state === 'sleepy' && (
        <span className="absolute -top-1 right-1 text-[10px] font-bold text-gray-700">z</span>
      )}
      {state === 'caffeinated' && (
        <span className="absolute -top-0 left-1 text-[10px]">☕</span>
      )}
      {state === 'celebrating' && (
        <span className="absolute -top-1 right-2 text-[12px]">✨</span>
      )}
      {state === 'confused' && (
        <span className="absolute -top-1 right-2 text-[12px] font-bold text-gray-700">?</span>
      )}
    </span>
  )
}
