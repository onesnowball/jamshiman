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

const PALETTE: Record<JamState, { body: string; accent: string; bg: string; label: string }> = {
  default:      { body: '#1F2937', accent: '#A5B4FC', bg: '#EEF2FF', label: 'Jami' },
  sleepy:       { body: '#1F2937', accent: '#C4B5FD', bg: '#EDE9FE', label: 'Sleepy Jami' },
  celebrating:  { body: '#1F2937', accent: '#FCD34D', bg: '#FEF3C7', label: 'Celebrating Jami' },
  studying:     { body: '#1F2937', accent: '#93C5FD', bg: '#DBEAFE', label: 'Studying Jami' },
  empty:        { body: '#374151', accent: '#9CA3AF', bg: '#F3F4F6', label: 'Quiet Jami' },
  loading:      { body: '#1F2937', accent: '#A5B4FC', bg: '#EEF2FF', label: 'Loading' },
  locked:       { body: '#1F2937', accent: '#7DD3FC', bg: '#E0F2FE', label: 'Locked Jami' },
  caffeinated:  { body: '#1F2937', accent: '#FCA5A5', bg: '#FFE4E6', label: 'Caffeinated Jami' },
  writing:      { body: '#1F2937', accent: '#86EFAC', bg: '#DCFCE7', label: 'Writing Jami' },
  confused:     { body: '#1F2937', accent: '#FDA4AF', bg: '#FEE2E2', label: 'Confused Jami' },
}

/**
 * Blocky pixel-style mascot. Self-contained inline SVG — no emoji overlay.
 * Public API is stable: state + size. Designer SVGs can later replace the
 * body of this component without changing any caller.
 */
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
  const p = PALETTE[state]
  return (
    <span
      role="img"
      aria-label={p.label}
      className={clsx('inline-block motion-safe:animate-[jam-float_4s_ease-in-out_infinite]', className)}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 64 64" width={px} height={px} shapeRendering="crispEdges">
        {/* rounded square body */}
        <rect x="6" y="10" width="52" height="48" rx="14" ry="14" fill={p.bg} stroke={p.body} strokeWidth="3" />
        {/* tuft on top */}
        <rect x="28" y="4" width="8" height="8" rx="2" fill={p.accent} stroke={p.body} strokeWidth="2.5" />
        <FaceForState state={state} body={p.body} accent={p.accent} />
        {/* cheeks */}
        <rect x="14" y="38" width="6" height="4" rx="2" fill={p.accent} opacity="0.7" />
        <rect x="44" y="38" width="6" height="4" rx="2" fill={p.accent} opacity="0.7" />
      </svg>
      <style>{`@keyframes jam-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }`}</style>
    </span>
  )
}

function FaceForState({ state, body, accent }: { state: JamState; body: string; accent: string }) {
  // eye blocks
  const Eye = ({ x }: { x: number }) => (
    <rect x={x} y="26" width="6" height="8" rx="1" fill={body} />
  )
  switch (state) {
    case 'sleepy':
    case 'locked':
      return (
        <>
          <rect x="22" y="30" width="6" height="3" rx="1" fill={body} />
          <rect x="36" y="30" width="6" height="3" rx="1" fill={body} />
          <rect x="28" y="44" width="8" height="3" rx="1" fill={body} />
        </>
      )
    case 'celebrating':
      return (
        <>
          {/* arc eyes */}
          <path d="M22 32 Q25 28 28 32" stroke={body} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M36 32 Q39 28 42 32" stroke={body} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M24 42 Q32 50 40 42" stroke={body} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* sparkle */}
          <rect x="46" y="14" width="4" height="4" rx="1" fill={accent} />
          <rect x="12" y="20" width="3" height="3" rx="1" fill={accent} />
        </>
      )
    case 'studying':
    case 'writing':
      return (
        <>
          <Eye x={22} />
          <Eye x={36} />
          <rect x="26" y="44" width="12" height="3" rx="1" fill={body} />
          {/* book/pencil block */}
          <rect x="38" y="48" width="14" height="6" rx="1" fill={accent} stroke={body} strokeWidth="2" />
        </>
      )
    case 'caffeinated':
      return (
        <>
          <rect x="22" y="26" width="6" height="6" rx="3" fill={body} />
          <rect x="36" y="26" width="6" height="6" rx="3" fill={body} />
          <rect x="24" y="44" width="16" height="3" rx="1" fill={body} />
          {/* steam */}
          <rect x="14" y="6" width="2" height="6" rx="1" fill={accent} />
          <rect x="50" y="6" width="2" height="6" rx="1" fill={accent} />
        </>
      )
    case 'confused':
      return (
        <>
          <Eye x={22} />
          <Eye x={36} />
          <path d="M24 46 Q28 42 32 46 T40 46" stroke={body} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    case 'empty':
      return (
        <>
          <Eye x={22} />
          <Eye x={36} />
          <rect x="28" y="46" width="8" height="2" rx="1" fill={body} />
        </>
      )
    case 'loading':
      return (
        <>
          <Eye x={22} />
          <Eye x={36} />
          <g>
            <circle cx="26" cy="46" r="1.6" fill={body}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="32" cy="46" r="1.6" fill={body}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0.2s" />
            </circle>
            <circle cx="38" cy="46" r="1.6" fill={body}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0.4s" />
            </circle>
          </g>
        </>
      )
    default:
      return (
        <>
          <Eye x={22} />
          <Eye x={36} />
          <path d="M26 44 Q32 48 38 44" stroke={body} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
  }
}
