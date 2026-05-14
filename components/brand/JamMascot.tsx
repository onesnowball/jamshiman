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

// Capybara palette
const FUR = '#A57858'
const FUR_DARK = '#7C5638'
const BELLY = '#C9A37A'
const EYE = '#2D1A0E'
const NOSE = '#2D1A0E'
const EAR = '#8B6240'
const LEAF = '#5BA552'
const ACCENT = '#FFCB05'

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

/** Chunky pixel-art capybara, rendered as composed SVG rects (no raster).
 *  State changes face details and overlay accessories. Same public API
 *  as the previous mascot — drop-in compatible.
 *  ViewBox is 64x48; one pixel grid unit = 4 SVG units. */
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
      className={clsx('inline-block', className)}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 64 48" width={px} height={px} shapeRendering="crispEdges">
        <CapyBody state={state} />
        <CapyFace state={state} />
        <CapyAccessory state={state} />
      </svg>
    </span>
  )
}

function P({ x, y, w = 1, h = 1, fill }: { x: number; y: number; w?: number; h?: number; fill: string }) {
  // 1 pixel-grid unit = 4 SVG units
  return <rect x={x * 4} y={y * 4} width={w * 4} height={h * 4} fill={fill} />
}

function CapyBody({ state }: { state: JamState }) {
  const sleeping = state === 'sleepy'
  if (sleeping) {
    // Lying-down pose: lower, wider, shorter
    return (
      <>
        {/* feet tucked under */}
        <P x={3} y={9} w={11} h={1} fill={FUR_DARK} />
        {/* belly/body */}
        <P x={2} y={7} w={13} h={2} fill={FUR} />
        <P x={3} y={8} w={11} h={1} fill={BELLY} />
        {/* head on the right (curled) */}
        <P x={11} y={6} w={4} h={2} fill={FUR} />
        <P x={14} y={6} w={1} h={1} fill={EAR} />
      </>
    )
  }
  return (
    <>
      {/* legs */}
      <P x={3} y={9} w={2} h={2} fill={FUR_DARK} />
      <P x={11} y={9} w={2} h={2} fill={FUR_DARK} />
      {/* body */}
      <P x={2} y={6} w={12} h={3} fill={FUR} />
      <P x={3} y={8} w={10} h={1} fill={BELLY} />
      {/* head (left, slightly above body) */}
      <P x={1} y={3} w={5} h={3} fill={FUR} />
      <P x={1} y={4} w={1} h={1} fill={FUR_DARK} />
      {/* ear */}
      <P x={3} y={2} w={1} h={1} fill={EAR} />
      <P x={4} y={2} w={1} h={1} fill={FUR_DARK} />
      {/* snout/nose */}
      <P x={0} y={4} w={1} h={1} fill={FUR_DARK} />
    </>
  )
}

function CapyFace({ state }: { state: JamState }) {
  // Sleeping → eyes already drawn as closed lines via accessory; skip here.
  if (state === 'sleepy') {
    return (
      <>
        {/* closed eye line on the curled head */}
        <P x={12} y={6} w={1} h={1} fill={EYE} />
      </>
    )
  }
  const eyeShape = state === 'celebrating' || state === 'caffeinated'
  if (eyeShape) {
    // Wide / sparkly eyes
    return (
      <>
        <P x={3} y={4} w={1} h={1} fill={EYE} />
        <P x={3} y={4} w={1} h={1} fill={EYE} />
        {/* sparkle */}
        <P x={2} y={4} w={1} h={1} fill="#FFFFFF" />
      </>
    )
  }
  if (state === 'confused') {
    return <P x={3} y={4} w={1} h={1} fill={EYE} />
  }
  // Default eye (one visible from profile)
  return <P x={3} y={4} w={1} h={1} fill={EYE} />
}

function CapyAccessory({ state }: { state: JamState }) {
  switch (state) {
    case 'sleepy':
      return (
        <g>
          <text x="44" y="14" fill={EYE} fontSize="8" fontFamily="monospace" fontWeight="bold">z</text>
          <text x="52" y="10" fill={EYE} fontSize="6" fontFamily="monospace" fontWeight="bold">z</text>
        </g>
      )
    case 'celebrating':
      return (
        <>
          <P x={6} y={0} w={1} h={1} fill={ACCENT} />
          <P x={10} y={1} w={1} h={1} fill={ACCENT} />
          <P x={14} y={0} w={1} h={1} fill={ACCENT} />
          <P x={8} y={2} w={1} h={1} fill="#FFFFFF" />
        </>
      )
    case 'studying':
      return (
        <>
          {/* leaf in mouth */}
          <P x={-1} y={4} w={1} h={1} fill={LEAF} />
          {/* book */}
          <P x={6} y={7} w={3} h={1} fill="#FFFFFF" />
          <P x={6} y={6} w={1} h={1} fill={EYE} />
        </>
      )
    case 'writing':
      return (
        <>
          <P x={-1} y={4} w={1} h={1} fill={LEAF} />
          <P x={6} y={5} w={3} h={1} fill={ACCENT} />
        </>
      )
    case 'caffeinated':
      return (
        <>
          {/* steam */}
          <P x={2} y={1} w={1} h={1} fill="#FECDD3" />
          <P x={4} y={0} w={1} h={1} fill="#FECDD3" />
          <P x={6} y={1} w={1} h={1} fill="#FECDD3" />
        </>
      )
    case 'confused':
      return (
        <>
          <text x="24" y="8" fill={EYE} fontSize="6" fontFamily="monospace" fontWeight="bold">?</text>
        </>
      )
    case 'locked':
      return (
        <>
          <P x={4} y={1} w={1} h={1} fill="#7DD3FC" />
        </>
      )
    case 'loading':
      return (
        <g>
          <circle cx="44" cy="20" r="1.5" fill={EYE}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="50" cy="20" r="1.5" fill={EYE}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0.2s" />
          </circle>
          <circle cx="56" cy="20" r="1.5" fill={EYE}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" begin="0.4s" />
          </circle>
        </g>
      )
    default:
      return null
  }
}
