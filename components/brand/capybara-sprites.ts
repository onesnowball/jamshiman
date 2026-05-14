// Pixel-art capybara sprites. Each frame is a grid of single-char codes that
// map to colors via PALETTE. Renderer in CapybaraSprite.tsx converts to SVG
// rects with crispEdges shape rendering.
//
// Capybaras: long horizontal body, blunt head, small round ear, stubby legs,
// no visible tail. Profile view, facing right. Grad cap (mortarboard + maize
// tassel) on top of head.

export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  'B': '#B08968', // fur main
  'D': '#7A5A40', // fur shadow / outline
  'b': '#C9A37A', // belly highlight
  'L': '#5C4530', // legs / feet
  'E': '#1A0F08', // eye
  'N': '#1A0F08', // nose
  'M': '#1A0F08', // mouth line
  'P': '#E8B89A', // snout/inner-ear pink
  'C': '#1F2937', // grad cap (dark navy/black)
  'T': '#FFCB05', // tassel (maize)
  'O': '#FFA94D', // carrot orange
  'G': '#5BA552', // carrot leaves
  'Z': '#1A0F08', // sleep Z (same as eye)
  'W': '#FFFFFF', // sparkle / white
}

// ViewBox width per frame = sprite columns × 1 unit. We render with
// `shapeRendering="crispEdges"` and scale up with width/height props.
// All idle frames are 28 cols × 16 rows.

export const FRAME_W = 28
export const FRAME_H = 16

export const SPRITES = {
  idle: [
    '............................',
    '............................',
    '............................',
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '..........BBBBBBB...........',
    '.........BBBBBBBBB...P......',
    '....BBBBBBBBBBBBBBBBBN......',
    '...BBBBBBBBBBBBBBBBBBM......',
    '..BBBBBBBBBBBBBBBBBBB.......',
    '..BbbbbbBBbbbbbbBBBBD.......',
    '..LL...LL.....LL.LL.........',
    '..LL...LL.....LL.LL.........',
    '..DD...DD.....DD.DD.........',
    '............................',
  ],
  // walking right, frame A
  walkA: [
    '............................',
    '............................',
    '............................',
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '..........BBBBBBB...........',
    '.........BBBBBBBBB...P......',
    '....BBBBBBBBBBBBBBBBBN......',
    '...BBBBBBBBBBBBBBBBBBM......',
    '..BBBBBBBBBBBBBBBBBBB.......',
    '..BbbbbbBBbbbbbbBBBBD.......',
    '..LL....LLL....LL...........',
    '...LL....LL....LLL..........',
    '...DD....DD....DDD..........',
    '............................',
  ],
  // walking right, frame B
  walkB: [
    '............................',
    '............................',
    '............................',
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '..........BBBBBBB...........',
    '.........BBBBBBBBB...P......',
    '....BBBBBBBBBBBBBBBBBN......',
    '...BBBBBBBBBBBBBBBBBBM......',
    '..BBBBBBBBBBBBBBBBBBB.......',
    '..BbbbbbBBbbbbbbBBBBD.......',
    '...LL...LL......LLL.........',
    '..LL....LLL.....LL..........',
    '..DD....DDD.....DD..........',
    '............................',
  ],
  // Eyes closed, sleeping curled
  sleeping: [
    '............................',
    '............................',
    '............................',
    '.............ZZZ............',
    '..........ZZZ...............',
    '............................',
    '.........BBBBBBB............',
    '........BBBBBBBBB......P....',
    '...BBBBBBBBBBBBBBBBBBBN.....',
    '..BBBBBBBBBBBBBBBBBBBMM.....',
    '.BBBBBBBBBBBBBBBBBBBBB......',
    '.BbbbbbbBbbbbbbBBBBBBD......',
    '.DDDDDDDDDDDDDDDDDDDDD......',
    '............................',
    '............................',
    '............................',
  ],
  // Head down to mouth: eating something on the floor in front
  eating: [
    '............................',
    '............................',
    '............................',
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '............................',
    '....BBBBBBBBBBBB............',
    '...BBBBBBBBBBBBBBP..........',
    '...BBBBBBBBBBBBBBBN.........',
    '..BBBBBBBBBBBBBBBBM.........',
    '..BbbbbbBBbbbbbBBBD.........',
    '..LL...LL.....LL.LL.........',
    '..LL...LL.....LL.LL.........',
    '..DD...DD.....DD.DD.........',
    '............................',
  ],
  // Mouth slightly open with a bite of something (carrot crumb in front)
  chomp: [
    '............................',
    '............................',
    '............................',
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '..........BBBBBBB...........',
    '.........BBBBBBBBB...P......',
    '....BBBBBBBBBBBBBBBBBN..O...',
    '...BBBBBBBBBBBBBBBBBM..O....',
    '..BBBBBBBBBBBBBBBBBBB.......',
    '..BbbbbbBBbbbbbbBBBBD.......',
    '..LL...LL.....LL.LL.........',
    '..LL...LL.....LL.LL.........',
    '..DD...DD.....DD.DD.........',
    '............................',
  ],
  // Sitting up looking forward (rarer pose)
  sitting: [
    '...........CCCCC............',
    '..........CCCCCCC...........',
    '.........TCCCCCCCCT.........',
    '..........BBBBBBB...........',
    '.........BBBBBBBBB..........',
    '........BBBBBBBBBB..........',
    '........BBBBBBBBBB..........',
    '........BBBBBBBBBB..........',
    '........BBBBBBBBBB..........',
    '.....BBBBBBBBBBBBBB.........',
    '....BBBBBBBBBBBBBBBB........',
    '...BBBBBBBBBBBBBBBBB........',
    '...BbbbbbbbbbbbbbBBB........',
    '...LL...........LL..........',
    '...DD...........DD..........',
    '............................',
  ],
} as const

export type SpriteName = keyof typeof SPRITES

export const CARROT_FRAME = [
  '.......',
  '..GGG..',
  '..GGG..',
  '.OOOOO.',
  '.OOOOO.',
  '..OOO..',
  '...O...',
]
