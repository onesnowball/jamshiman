import { clsx } from 'clsx'

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

const SIZE_PX: Record<JamSize, number> = { sm: 40, md: 64, lg: 96, xl: 144 }

const STATE_ACCESSORY: Record<JamState, { face: string; bgFrom: string; bgTo: string; label: string }> = {
  default:      { face: '🌙', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', label: 'Jami' },
  sleepy:       { face: '😴', bgFrom: '#EDE9FE', bgTo: '#DDD6FE', label: 'Sleepy Jami' },
  celebrating: { face: '✨', bgFrom: '#FEF3C7', bgTo: '#FDE68A', label: 'Celebrating Jami' },
  studying:     { face: '📖', bgFrom: '#DBEAFE', bgTo: '#BFDBFE', label: 'Studying Jami' },
  empty:        { face: '☕', bgFrom: '#F3F4F6', bgTo: '#E5E7EB', label: 'Quiet Jami' },
  loading:      { face: '🌙', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', label: 'Loading' },
  locked:       { face: '🫧', bgFrom: '#E0F2FE', bgTo: '#BAE6FD', label: 'Locked Jami' },
  caffeinated:  { face: '☕', bgFrom: '#FFE4E6', bgTo: '#FECDD3', label: 'Caffeinated Jami' },
  writing:      { face: '🌱', bgFrom: '#DCFCE7', bgTo: '#BBF7D0', label: 'Writing Jami' },
  confused:     { face: '🫠', bgFrom: '#FEE2E2', bgTo: '#FECACA', label: 'Confused Jami' },
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
  const cfg = STATE_ACCESSORY[state]
  return (
    <div
      role="img"
      aria-label={cfg.label}
      className={clsx('relative inline-flex items-center justify-center rounded-full shadow-sm', className)}
      style={{
        width: px,
        height: px,
        background: `radial-gradient(circle at 30% 30%, ${cfg.bgFrom}, ${cfg.bgTo})`,
      }}
    >
      <svg viewBox="0 0 100 100" width={px} height={px} className="absolute inset-0 motion-safe:animate-[jam-float_4s_ease-in-out_infinite]">
        <circle cx="50" cy="55" r="34" fill="white" opacity="0.85" />
        <circle cx="40" cy="52" r="2.5" fill="#1F2937" />
        <circle cx="60" cy="52" r="2.5" fill="#1F2937" />
        <path d="M42 62 Q50 68 58 62" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="34" cy="60" r="3" fill="#FCA5A5" opacity="0.6" />
        <circle cx="66" cy="60" r="3" fill="#FCA5A5" opacity="0.6" />
      </svg>
      <span style={{ fontSize: px * 0.32 }} className="relative -mt-1">{cfg.face}</span>
      <style>{`@keyframes jam-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }`}</style>
    </div>
  )
}
