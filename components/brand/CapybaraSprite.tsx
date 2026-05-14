import { PALETTE, SPRITES, FRAME_W, FRAME_H, CARROT_FRAME, type SpriteName } from './capybara-sprites'

/** Render a sprite from the SPRITES table at a given pixel size.
 *  Each grid cell becomes a 1×1 unit rect; consumer scales via width/height. */
export function CapybaraSprite({
  sprite,
  size = 96,
  flip = false,
  className,
}: {
  sprite: SpriteName
  size?: number
  flip?: boolean // mirror horizontally for left-facing walks
  className?: string
}) {
  const frame = SPRITES[sprite]
  return (
    <svg
      viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
      width={size}
      height={(size * FRAME_H) / FRAME_W}
      shapeRendering="crispEdges"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      role="img"
      aria-label="capybara"
    >
      {frame.map((row, y) =>
        Array.from(row).map((ch, x) => {
          const fill = PALETTE[ch]
          if (!fill || fill === 'transparent') return null
          return <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} />
        })
      )}
    </svg>
  )
}

export function CarrotSprite({ size = 18 }: { size?: number }) {
  const W = 7, H = CARROT_FRAME.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W} shapeRendering="crispEdges" role="img" aria-label="carrot">
      {CARROT_FRAME.map((row, y) =>
        Array.from(row).map((ch, x) => {
          const fill = PALETTE[ch]
          if (!fill || fill === 'transparent') return null
          return <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} />
        })
      )}
    </svg>
  )
}
