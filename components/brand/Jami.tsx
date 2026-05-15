"use client";

/**
 * Jami — pixel-art capybara mascot for jamshiman.
 *
 * Sprites are extracted from Rainloaf's "Simple Capybara Sprite Sheet"
 * (https://rainloaf.itch.io/capybara-sprite-sheet), used under
 * Rainloaf's terms (free for commercial use with credit). The graduation
 * cap and maize tassel are added as an overlay during extraction.
 *
 * **Credit Rainloaf somewhere visible** — README, About page, or a
 * small "mascot by Rainloaf" line near the mascot. This is a hard
 * requirement of the license.
 *
 * ──────────────────────────────────────────────────────────────────────
 * ANIMATION SYSTEM
 * ──────────────────────────────────────────────────────────────────────
 *
 * Each frame is a 32×32 grid of single-character pixels. Characters
 * map to colors via PALETTE; "." is transparent. Frames are rendered
 * as inline <rect> elements inside an SVG with viewBox="0 0 32 32"
 * and shapeRendering="crispEdges" so they stay pixel-perfect at any
 * integer scale (56, 88, 112, 144 px ...).
 *
 * On top of the sprite frames we apply a tiny INTEGER-PIXEL transform
 * (translate by 0 or ±1 SVG-unit) to add life that the sprite alone
 * cannot easily express:
 *
 *   • Idle:       a slow time-based "breathing" bob (sine wave quantized
 *                 to ±1 px) on top of the existing 5-frame idle cycle.
 *   • Walking:    a per-frame waddle synced to the gait so the body
 *                 looks heavier when the foot plants.
 *   • Sleeping:   a very slow breath bob; the sprite itself is static.
 *   • Sit/Wake:   no overlay bob — the existing 5 sprite frames already
 *                 carry all the motion these states need.
 *
 * IMPORTANT: every overlay translation is an INTEGER number of pixels
 * in sprite space (1 SVG unit = 1 art pixel). Sub-pixel translation
 * would blur the art. To make motion smoother, tune frequency and
 * per-frame durations rather than fractional offsets.
 *
 * State transitions are smoothed by holding the new state's first
 * frame for STATE_ENTER_HOLD_MS extra ms — a tiny "settle" beat that
 * removes the visual jolt of cutting between cycles. Frame timing
 * itself uses requestAnimationFrame + performance.now(), so it is
 * frame-rate independent.
 *
 * Respect prefers-reduced-motion: when reduced, we render frame 0 of
 * the current state with no overlay transform.
 *
 * ──────────────────────────────────────────────────────────────────────
 * HOW TO TUNE
 * ──────────────────────────────────────────────────────────────────────
 * Every knob that affects "feel" lives in the TUNING block below. You
 * should not need to touch the hooks or the render loop to change
 * pacing.
 *
 *   • Faster idle           → lower  IDLE_FRAME_MS
 *   • Calmer breathing      → raise  IDLE_BREATH_PERIOD_MS
 *   • Heavier breathing     → raise  IDLE_BREATH_AMOUNT_PX to 2
 *                             (gets obvious — keep 1 for "alive")
 *   • Snappier walk         → lower  WALK_FRAME_MS
 *   • Springier walk        → use more non-zero entries in
 *                             WALK_BOUNCE_PER_FRAME (e.g. [0,1,0,-1,0])
 *   • Flatter walk          → set WALK_BOUNCE_PER_FRAME to all zeros
 *   • Smoother state change → raise STATE_ENTER_HOLD_MS (try 60-160)
 */

import { useEffect, useRef, useState } from "react";

export type JamiState = "idle" | "walking" | "sleeping" | "stretching" | "sitting";

export interface JamiProps {
  state: JamiState;
  /** Rendered width in CSS pixels. */
  size?: number;
  /** Force reduced-motion regardless of system setting. For testing. */
  forceReducedMotion?: boolean;
  className?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// TUNING — animation feel. Adjust freely; no other code needs to change.
// ════════════════════════════════════════════════════════════════════════════

/** Time each idle sprite frame is held, in ms. Higher = slower idle. */
const IDLE_FRAME_MS = 280;
/** Full inhale → exhale cycle of the idle breathing bob, in ms. */
const IDLE_BREATH_PERIOD_MS = 2400;
/**
 * Vertical bob amplitude in sprite pixels. The bob is quantized to
 * integers, so 1 reads as a soft "alive" rise/fall; 2 reads as a more
 * obvious sigh; 0 disables the bob.
 */
const IDLE_BREATH_AMOUNT_PX = 1;

/** Time each walk sprite frame is held, in ms. Lower = faster gait. */
const WALK_FRAME_MS = 140;
/**
 * One vertical offset per WALK frame, in sprite pixels. Negative
 * lifts the body, positive drops it. Length MUST match WALK.length
 * (5). The default below adds a gentle alternating waddle on top of
 * the motion already baked into the sprite.
 */
const WALK_BOUNCE_PER_FRAME = [0, -1, 0, -1, 0] as const;

/** Time each sit sprite frame is held, in ms. */
const SIT_FRAME_MS = 260;

/** Time each stretching/wake sprite frame is held, in ms. */
const STRETCH_FRAME_MS = 220;

/** Full breath cycle while sleeping, in ms. Long = deep sleep. */
const SLEEP_BREATH_PERIOD_MS = 4200;
/** Sleep bob amplitude in sprite pixels. */
const SLEEP_BREATH_AMOUNT_PX = 1;

/**
 * On any state change, hold the new state's frame 0 for this many ms
 * before the cycle starts. Smooths the visual cut between states.
 * Set to 0 to disable.
 */
const STATE_ENTER_HOLD_MS = 90;

/**
 * Hard clamp on the combined overlay Y offset, in sprite pixels.
 * Prevents amplified bobs from pushing art outside the viewBox.
 */
const MAX_Y_OFFSET_PX = 2;

// ════════════════════════════════════════════════════════════════════════════

const PALETTE: Record<string, string> = {
  K: "#250002", // outline
  M: "#D1824A", // main fur
  L: "#C28664", // light fur
  S: "#542C2A", // shadow
  D: "#8E5836", // mid brown
  W: "#FEECFD", // white particle
  C: "#111111", // cap
  T: "#FFCB05", // maize tassel
};

type Frame = readonly string[];
type Animation = readonly Frame[];


const IDLE: readonly Frame[] = [
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSK............",
    "................KDSKKKKKKKKS....",
    "...............KKDLLLLLLDDKK....",
    "..............KKLLMLKKLLDDDK....",
    ".............KKLMMMMLLMMMDDK....",
    "......SKKKKKKKLLMMMMMMMMMLDK....",
    "......KKLLLLLLLMMMMMMMMMMLDK....",
    "......KLLMMMMMMMMMMLKKKKKKKKS...",
    "......KLLMDDMMMMMMLKKSSS........",
    ".....SKLMMMMMMMMMLLK............",
    ".....SKLDDMMDDMMMLLK............",
    ".....KKLMMMMMMMMMMKK............",
    ".....KLLLMMMMMMMMLKS............",
    "....KKSLMLLKKKKLLSK.............",
    "....KSSSLKKKSSKKSSK.............",
    "....KSSSKK....SKSSK.............",
    "....KKSSKS.....KSSK.............",
    "....SKSSKS.....KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSKS...........",
    "...............SKDSKKKKKKKKS....",
    "...............KKDLLLLLLDDKK....",
    ".............KKKLMMLKKLLDDDK....",
    ".......KKKKKKKLLMMMMMMMMMDDK....",
    "......KKLLLLLLMMMMMMMMMMMMDK....",
    "......KLLMMMMMMMMMMMLLLLMLDK....",
    ".....SKLLMDDMMMMMMLLKKKKKKKK....",
    "......KLMMMMMMMMMMLKKS.S........",
    ".....SKLDDMMDDMMMMLK............",
    ".....KKLMMMMLMMMMLKK............",
    ".....KLLLMMLLLLLLLK.............",
    "....KKSLLLKKKKKLLSK.............",
    "....KSSSKKK...KKSSK.............",
    "....KKSSKS....SKSSK.............",
    ".....KSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSKS...........",
    "................KDSKKKKKKKK.....",
    "..............SKKDLLLLLLDDKK....",
    "......SKKKKKKKKKLLMMKKLLDDDK....",
    "......KKLLLLLLLMMMMMMMMMMDDK....",
    "......KLLLMMMMMMMMMMMLMMMLDK....",
    "......KLMMDDMMMMMMMMLLLLLLDK....",
    "......KLMMMMMMMMMMMLKKKKKKKK....",
    "......KLDDMMDDMMMMLKK...........",
    ".....KKLMMDLLLMMMLKK............",
    ".....KLLMMLLLLMMMLK.............",
    "....KKSLLLKKKKKLLSK.............",
    "....KSSSKKK...KKSSKS............",
    "....KKSSKS.....KSSK.............",
    "....SKSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSK............",
    "...............SKDSKKKKKKKK.....",
    "..............SKKDLLLLLLDDKK....",
    "..............KKLMMMKKMMDDDK....",
    "......SKKKKKKKKLMMMMMMMMLDDK....",
    "......KKLLLLLLLMMMMMMMMLLLDK....",
    "......KLLLLLLMMMMMMLLLLLLLDK....",
    ".....SKLLMDDMMMMMMMLKKKKKKKK....",
    "......KLMMMMMMMMMMLKK...........",
    "......KLDDMMDDMMMLLK............",
    ".....KKLMMMMMMMMMMKK............",
    ".....KLLMMMLMMMMMLKS............",
    "....KKSLLLLKKKKLLSK.............",
    "....KSSSLKKKSSKKSSKS............",
    "....KSSSKK....SKSSKS............",
    "....KKSSK......KSSK.............",
    "....SKSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "...............SKSSK............",
    "................KDSKKKKKKKK.....",
    "...............KKDLLLLLLDDKK....",
    "..............KKLMMMKKLLDDDK....",
    ".............SKLMMMMMMMMMDDK....",
    "............SKKLMMMMMMMMMLDK....",
    ".......KKKKKKKLMMMMMLLLMMLDK....",
    "......KKLLLLMMMMMMMLKKKKKKKK....",
    "......KLLLMMMMMMMMMKKS..........",
    "......KLLMDDMMMMMMLKS...........",
    ".....SKLMMMMMMMMMMLK............",
    ".....SKLDDMMDDMMMMLK............",
    ".....KKLMMMMLMMMMLKK............",
    ".....KLLMMMLLLLMMLK.............",
    "....KKSLLMLKKKKLLSK.............",
    "....KSSSLKKK..KKSSK.............",
    "....KSSSKK.....KSSK.............",
    "....KKSSKS.....KSSK.............",
    ".....KSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ]
] as const;

const WALK: readonly Frame[] = [
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSKS..S........",
    "...............SKDSKKKKKKKK.....",
    "..............SKKDLLLLLLDDKK....",
    ".............SKKLLLLKKLLDD.K....",
    "............SKKLLMMMMMMLLDDK....",
    ".......KKKKKKKLMMMMMMMMLLLDK....",
    "......KKLLLLLLMMMMMMMMLLLLDK....",
    "......KLLMMMMMMMMMMLKKKKKKKK....",
    "......KLMMDDMMMMMMLKKSS.........",
    "......KLMMMMMMMMMMMKS...........",
    "......KLDDMMDDMMMMLK............",
    ".....KKMMMMMMMMMMLKK............",
    "....SKLMMMMMLLLMLLKS............",
    "....KKSLMMLKKKKLLSK.............",
    "....KSSSLKKKSKKKSSKK............",
    "....KSSSKKKSSKKKSSSKS...........",
    "....KKSSKKKKSKKKKSSK............",
    ".....KSSKSKK.KKSKKSKS...........",
    ".....KKKK........KKK.D..........",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "...............KSSK.....S.......",
    "..............SKDSKKKKKKKK......",
    "..............KKDLLLLLLDDKK.....",
    ".............SKLLLLKKLLDDDK.....",
    "............SKKLMMMMMMMLDDK.....",
    ".......KKKKKKKLLMMMMMMMLLDK.....",
    "......KKLLLMLLLMMMMLLLLLLDK.....",
    ".....SKLLMMMMMMMMMMKKKKKKKK.....",
    "......KLMMDDMMMMMMLKS...........",
    "......KLMMMMMMMMMMLK............",
    "......KLDDMMDDMMMMLK............",
    ".....KKLMMMMMMMMMMKK............",
    ".....KSLMMLLLLLLLSKK............",
    ".....KSSLKKKKKKKSSKK............",
    ".....KKSSKKS..SKSSKK............",
    "......KKSSKK...KSSKK............",
    ".......KKKKK...KSSK.............",
    "........SKKK...KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    ".............CCCCC..............",
    "..............CCT...............",
    "..............KKKK..............",
    "..............KSSK..............",
    ".............SKDSKKKKKKKKS......",
    ".............KKDLLLLLLDDKK......",
    ".............KLLLMKKLLDDDK......",
    "............SKLLMMMMLLLDDK......",
    "......SKKKKKKKLMMMMMMMMLDK......",
    "......KKLLLLLLMMMMMMMMLLDK......",
    "......KLLMMMMMMMMMLKKKKKKK......",
    "......KLMMDDMMMMMMLKS...........",
    "......KLLMMMMMMMMMLK............",
    "......KLDDMMDDMMMLLK............",
    "......KKLMMMMMMMMLKK............",
    "......KKLMLLLMMMMLKK............",
    "......KLLLLKKKKLLSKKK...........",
    "......KSSSKKSSKSSSKKK...........",
    "......KKSSSKSSKSSSKKKS..........",
    "......KKKSSSKSKSSKKKKK..........",
    "......KKKKKKK.KSSKKKKK..........",
    "......KKKSS...KKKKS.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "...............KSSKSSS..........",
    "..............SKDSKKKKKKKK......",
    "..............KKDLLLLLLDDKK.....",
    "..............KLLLLKKMMDDDK.....",
    "..............KLMMMMMMMMDDK.....",
    "..............KLMMMMMMMMLDK.....",
    "..........S..SKLMMMMLLLLLDKS....",
    "........KKKKKKKLMMMMLKKKKKK.....",
    ".......KKLLLLLMMMMMMKK..........",
    "......SKLLMMMMMMMMMLKS..........",
    "......SKLMMDDMMMMMMLKS..........",
    "......DKLLMMMMMMMMMLK...........",
    "......SKLDDMMDDMMMLLK...........",
    "......SKKLLMMMLLMMLSK...........",
    "......KKLLLLLLLLLLSSK...........",
    ".....KKKSSSKKKKKKSSSK...........",
    ".....KKKSSSKSS.KSSSKK...........",
    ".....KKKKSSKK..KSSKKK...........",
    ".....KKKKKSSK..KKKKKK...........",
    "......KKSKKKK....SKKK...........",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "...............KSSK.............",
    "...............KDSKKKKKKKK......",
    "..............KKDLLLLLLDDKK.....",
    "..............KLMMLKKMMDDDK.....",
    ".............SKLMMMMMMMLDDK.....",
    "............SKKMMMMMMMMLLDKS....",
    ".......KKKKKKKLMMMMMMMLLLDK.....",
    "......KKLLLLLMMMMMMMLKKKKKK.....",
    "......KLMMMMMMMMMMMKKK..........",
    "......KLMMDDMMMMMMLKS...........",
    "......KLMMMMMMMMMMLKS...........",
    "......KLDDMMDDMMMMLKS...........",
    "......KMMMMMMMMMMMLKS...........",
    ".....SKMMMLLLLMMMMSKS...........",
    ".....KKLLLKKKKKKLSSKK...........",
    ".....KKSSSKS...KKSSSK...........",
    ".....KKSSKK....SKSSSK...........",
    "......KSSSK....KKSSKK...........",
    "......KKSSK....KKKKK............",
    "......SKKKK....KKKS.............",
    "................................",
    "................................"
  ]
] as const;

const SIT: readonly Frame[] = [
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSK......S.....",
    "...............SKDSKKKKKKKKS....",
    "..............SKKDLLLLLLDDKK....",
    "..............KKLLMMKKLMDDDK....",
    "...........SSKKLLMMMMMMMMDDK....",
    ".......KKKKKKKLLMMMMMMLMMLDK....",
    "......KKLLLLMLMMMMMMLLLLLLDK....",
    "......KLLLMMMMMMMMMMKKKKKKKK....",
    "......KLLLDDMMMMMMMKK...........",
    "......KLLMMMMMMMMMLK............",
    "......KLDDMMDDMMMLLK............",
    ".....KKLMMMMLMMMLLKK............",
    "....SKLLLMLLLLLLLLK.............",
    "....KKSLLLLKKKKLLSK.............",
    "....KSSSLKKK.SKKSSK.............",
    "....KSSSKK....SKSSK.............",
    "....KKSSKS....SKSSK.............",
    "....SKSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "...............KSSK.............",
    "..............SKDSKKKKKKKK......",
    ".............SKKDLLLLLLDDKK.....",
    ".............KKLMMMKKLLDDDK.....",
    "...........SKKLMMMMMMMMLDDK.....",
    "..........KKKLLMMMMMMMLLLDK.....",
    "........KKKLLLMMMMMLLLLLLDK.....",
    ".......KKLLLMMMMMMLKKKKKKKK.....",
    "......KKLLMMMMMMMMLK............",
    ".....KKLDMMMMMMMMLKK............",
    ".....KLDMMMDMMMMMLK.............",
    ".....KLLMMDMMMMMMLK.............",
    ".....KLLMMMLLLLLLLK.............",
    ".....KLLDMMLKKKLLKK.............",
    ".....KLDLLLKKSKSSK..............",
    ".....KSSSKKKSSKSSK..............",
    ".....KKSSSKKSSKSSK..............",
    ".....SKSSSSKSDKSSK..............",
    "......KKKKKK..KKKK..............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "..............SKSSKS............",
    "..............SKDSKKKKKKKKS.....",
    "..............KKDLLLLLLDDKK.....",
    "..............KLLMMKKLLDDDK.....",
    "..............KLMMMMMMMMDDK.....",
    ".............KKLMMMMMMMMLDK.....",
    "............SKLMMMMMLLLLLDK.....",
    "..........SKKKLMMMMMKKKKKKK.....",
    ".........KKKLLMMMMMLKSS.........",
    ".......SKKLLLMMMMMMLKS..........",
    "......SKKLLMMMMMMMMLK...........",
    "......KKLLMMMMMMMMMLK...........",
    "......KLLMDMMMMMMMLKK...........",
    "......KLLDMMMDLLLLLK............",
    "......KLLMMMDLKKLLKK............",
    "......KLLDDMLLKKSSKS............",
    "......KLLLLLLKKKSSK.............",
    "......KSSSSSKKKKSSKS............",
    "......KKSSSSSSKKSSK.............",
    ".......KKKKKKKKKKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............CCCCC.............",
    "...............CCT..............",
    "...............KKKK.............",
    "...............KSSKS.S..........",
    "..............SKDSKKKKKKKK......",
    "..............KKDMLLLLLDDKK.....",
    "..............KLMMMKKMMDDDK.....",
    ".............SKLMMMMMMMLDDK.....",
    ".............KKLMMMMMMMLLDK.....",
    ".............KLLMMMMLLLLLDK.....",
    "............KKLMMMMLKKKKKKK.....",
    "...........KKMMMMMMLK...........",
    "..........KKLMMMMMMLK...........",
    ".........KKLMMMMMMMLK...........",
    "........KKLMMMMMMMMLK...........",
    ".......KKLMMMMMMMMMLK...........",
    ".......KLLMMMLLMMMMKK...........",
    "......KKLDDMMMLLLMLKS...........",
    "......KLMLLMDDLKKLLK............",
    "......KLMLLMMMLKKSSK............",
    "......KLLDDMLLKKKSSK............",
    "......KLLLLLLKKKKSSK............",
    "......KKKSSSSSSKKSSK............",
    "........KKKKKKKKKKKK............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    ".............CCCCC..............",
    "..............CCT...............",
    ".............SKKKK..............",
    "..............KSSKK.SS..........",
    "..............KDSSKKKKKKKKS.....",
    "..............KDDLLLLLLDDKK.....",
    "..............KLLLMKKMLDDDK.....",
    "..............KLMMMMMMLLDDK.....",
    ".............KKLMMMMMMMLLDK.....",
    "............SKLMMMMMLLLLLDK.....",
    "............KKMMMMMMKKKKKKK.....",
    "..........SKKLMMMMMMKSS.........",
    "..........KKLLMMMMMLK...........",
    ".........KKLLMMMMMMLK...........",
    ".......SKKLLMMMMMMMLK...........",
    ".......KKLLMMMMMMMMLK...........",
    "......SKLLMMMMMMMMLKK...........",
    "......KKLDDMMMMLLLLK............",
    "......KLLMMMDDLKKLLK............",
    "......KLLMMMLLLKKSSK............",
    "......KLLDDMLLKKKSSK............",
    "......KLLLLLLKKKKSSK............",
    "......KKKSSSSSSKKSSK............",
    "........KKKKKKKKKKKK............",
    "...............SS...............",
    "................................",
    "................................"
  ]
] as const;

const WAKE: readonly Frame[] = [
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSK............",
    "...............SKDSKKKKKKKKS....",
    "..............SKKDLLLLLLDDKK....",
    "..............KKLMMMKKMLDDDK....",
    "..............KLLMMMMMMMMDDK....",
    "..............KLMMMMMMMMMLDK....",
    ".........KKKKKKLMMMMLLLLLLDK....",
    ".......KKKLLLLLMMMMLKKKKKKKK....",
    "......KKLLLMMMMMMMLKKSS.........",
    "......KLLDDMMMMMMMLK............",
    "......KLLMMMMMMMMMLK............",
    ".....SKDDMMDDMMMMMLK............",
    "......KLMMMMMMMMMLKK............",
    ".....KKLMMLKMLLLLLK.............",
    ".....KLLLLLKKKSSLKK.............",
    ".....KKSSKKKSKSSKK..............",
    "......KSSSKSSKSSKS..............",
    "......KKSSKSSKSKK...............",
    ".......KKSK..KSK................",
    "........KKK..KKK................",
    "........S.......................",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKKK............",
    "................KSSKS...........",
    "................KDSKKKKKKKK.....",
    "..............SKKDLLLLLMDDKK....",
    "..............KKLLLMKKMMDDDK....",
    "...........SSSKLLMMMMMMMMDDK....",
    "........KKKKKKKLMMMMMMMMLLDK....",
    ".......KKLLLLMMMMMMMLLLLLLDK....",
    "......KKLLMMMMMMMMLKKKKKKKKK....",
    "......KLLMDDMMMMMMLK............",
    ".....SKLLMMMMMMMMLLK............",
    ".....SKLDDMMDDMMMMLK............",
    "....KKKLLLMMLLLLLLKK............",
    "....KSSLLLLKKKKLLSKKS...........",
    "....KSSSKKKK.SKKSKSKS...........",
    "....KSSKKS.S..SKSSSK............",
    "....KSSKKS.....KSSKK............",
    "....KKSSK......KSSK.............",
    ".....KKKK......KKKK.............",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................CCCCC...........",
    ".................CCT............",
    ".................KKKS...........",
    ".................KSKK...........",
    ".................KSSKKKKKKKKK...",
    "................SKDSLLLLLLDDKK..",
    "................KKLLLLKKLLDDDK..",
    "...............SKLMMMMMMMMMDDK..",
    ".............SSKKLMMMMMMMMMLDK..",
    ".......KKKKKKKKKLMMMMMMLLLLLDK..",
    "......KKLLLMLLLLLMMMMLKKKKKKKK..",
    ".....SKLLMMMMMMMMMMMLKK.SSSS....",
    "......KLMMMDDMMMMMMMLK..........",
    "......KLMMMMMMMMMMMMLK..........",
    "......KLMDDMMDDMMMMMLKS.........",
    "......KLMMMMMLLMMMMMKKS.........",
    ".....KKLLMMLLLLLLLLSKS..........",
    "....KKSLLLLKKKKKKSSSKK..........",
    "....KSSSKKKK....KKSSSK..........",
    "....KSSKK........KKSSK..........",
    "...SKSKKS.........KSKK..........",
    "....KKKS..........KKK...........",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............CCCCC............",
    "................CCT.............",
    "................KKK.............",
    "................KSKK............",
    "................KSSKKKKKKKKK....",
    "...............SKDSLLLLLLDDKK...",
    "..............SKKLLLLKKMMDDDK...",
    "......KKKKKKKKKKLMMMMLLMMMDDK...",
    ".....KKLLLLLLLMMMMMMMMMMMMLDK...",
    ".....KLLMMMMMMMMMMMMMLLLLLLDK...",
    ".....KLMMMDDMMMMMMMLLKKKKKKKK...",
    "....SKLMMMMMMMMMMMMLKK...SS.....",
    "....SKLMDDMMDDMMMMMLK...........",
    "....SKLMMMMMMLLMMMMLK...........",
    "...SKKLMMLLLLLLMMMMKK...........",
    "...KKSLLLLKKKKKLLLSKS...........",
    "...KSSSKKKK..SKKSSSKS...........",
    "...KSSKKS......KKSSKKS..........",
    "...KSKK........SKKSSK...........",
    "...KKK..........SKSSK...........",
    ".................KKSK...........",
    ".................SKKK...........",
    "................................",
    "................................"
  ],
  [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................CCCCC...........",
    ".................CCT............",
    ".................KKKK...........",
    ".................KSSK...........",
    ".................KDSKKKKKKKKS...",
    "................KKDLLLLLLDDKK...",
    "...............KKLLMMKKLLDDDK...",
    ".......KKKKKKKKKLMMMMMMMMMDDK...",
    ".....KKKLLLLMMMMMMMMMMMMMMLDK...",
    ".....KLLLLLMMMMMMMMMMMLLLLLDK...",
    "....KKLLMMMMMMMMMMMMLKKKKKKKK...",
    "....KLLDDMMMMMMMMMLLKKS..SS.....",
    "....KLLMMMMMMMMMMLLKK...........",
    "....KDDMMDDMMMMMMLKKS...........",
    "....KLLMMMMLLLMMLLKS............",
    "...KKSLMMMLKKKKLLSK.............",
    "...KSSSLLKKK..KKSSK.............",
    "...KKSSSKKS....KSSK.............",
    "....KKSSSK.....KSSK.............",
    "....SKKSSK.....KSSK.............",
    "......KKKK.....KKKK.............",
    "................................",
    "................................"
  ]
] as const;

const SLEEP: Frame = WAKE[0];

/**
 * Per-state configuration.
 *
 *  - frames:           the sprite sequence to cycle through.
 *  - frameMs:          ms each frame is held. With requestAnimationFrame
 *                      the runtime picks the closest tick to that.
 *  - bouncePerFrame:   optional vertical offset (sprite px) for each
 *                      frame index. Used for the walk waddle. Length
 *                      must equal frames.length.
 *  - breath:           optional sine-wave bob over absolute time —
 *                      independent of the sprite cycle. Used for idle
 *                      breathing and the slow sleep breath.
 *
 * `bouncePerFrame` and `breath` can both be set; their offsets sum,
 * then get clamped to ±MAX_Y_OFFSET_PX so the art never leaves the
 * viewBox.
 */
interface StateConfig {
  frames: Animation | readonly [Frame];
  frameMs: number;
  bouncePerFrame?: readonly number[];
  breath?: { periodMs: number; amountPx: number };
}

const STATE_CONFIG: Record<JamiState, StateConfig> = {
  idle: {
    frames: IDLE,
    frameMs: IDLE_FRAME_MS,
    breath: { periodMs: IDLE_BREATH_PERIOD_MS, amountPx: IDLE_BREATH_AMOUNT_PX },
  },
  walking: {
    frames: WALK,
    frameMs: WALK_FRAME_MS,
    bouncePerFrame: WALK_BOUNCE_PER_FRAME,
  },
  sleeping: {
    frames: [SLEEP],
    // A single frame never advances, but frameMs is still used to drive
    // the RAF loop and keep the breath wave updating each tick.
    frameMs: 2000,
    breath: { periodMs: SLEEP_BREATH_PERIOD_MS, amountPx: SLEEP_BREATH_AMOUNT_PX },
  },
  stretching: {
    frames: WAKE,
    frameMs: STRETCH_FRAME_MS,
  },
  sitting: {
    frames: SIT,
    frameMs: SIT_FRAME_MS,
  },
};

function useReducedMotion(force: boolean): boolean {
  const [reduced, setReduced] = useState<boolean>(force);
  useEffect(() => {
    if (force) { setReduced(true); return; }
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [force]);
  return reduced;
}

/**
 * Drive a requestAnimationFrame loop and expose:
 *   - idx:        the current sprite frame index for this state
 *   - elapsedMs:  total ms since this state began (used by breath wave)
 *
 * The frame index formula is:
 *     idx = floor((elapsed - STATE_ENTER_HOLD_MS) / frameMs) mod frameCount
 *
 * During the first STATE_ENTER_HOLD_MS, idx is clamped to 0 so each
 * new state gets a brief "settle" before its cycle starts. This is
 * what makes transitions between idle ↔ walking feel less abrupt.
 *
 * `state` is included in the effect deps so changing state ALWAYS
 * restarts the clock, even if two states happen to share a frame
 * count and duration.
 *
 * Returning elapsedMs lets the renderer compute time-based effects
 * (e.g. the breathing sine wave) without spinning up a second RAF
 * loop.
 */
function useAnimationClock(
  state: JamiState,
  active: boolean,
  frameCount: number,
  frameMs: number,
): { idx: number; elapsedMs: number } {
  const [tick, setTick] = useState<{ idx: number; elapsedMs: number }>({ idx: 0, elapsedMs: 0 });
  const startRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Reset clock on any state change.
    startRef.current = performance.now();
    if (!active) {
      setTick({ idx: 0, elapsedMs: 0 });
      return;
    }
    const loop = () => {
      const elapsed = performance.now() - startRef.current;
      const afterHold = Math.max(0, elapsed - STATE_ENTER_HOLD_MS);
      const idx = frameCount <= 1 ? 0 : Math.floor(afterHold / frameMs) % frameCount;
      setTick({ idx, elapsedMs: elapsed });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, active, frameCount, frameMs]);

  return tick;
}

/**
 * Compute the integer-pixel Y offset to apply to the sprite this tick.
 *
 * Two additive sources, then clamp:
 *
 *   1. Per-frame bounce (cfg.bouncePerFrame[idx])
 *        — used for the walk waddle. Exact integer.
 *
 *   2. Time-based breath (cfg.breath)
 *        — sine wave quantized to integer pixels:
 *            round( amountPx * sin(2π · elapsed / periodMs) )
 *          For amountPx=1, output is one of {-1, 0, 1} and changes
 *          every periodMs/4. Crisp pixel art, no sub-pixel blur.
 *
 * The result is clamped to ±MAX_Y_OFFSET_PX so big amplitudes never
 * push the art outside the viewBox. The sprite frames already leave
 * a few rows of empty space top and bottom, so ±2 is the safe limit.
 */
function computeYOffset(cfg: StateConfig, idx: number, elapsedMs: number): number {
  let y = 0;

  if (cfg.bouncePerFrame && cfg.bouncePerFrame[idx] !== undefined) {
    y += cfg.bouncePerFrame[idx];
  }

  if (cfg.breath) {
    const { periodMs, amountPx } = cfg.breath;
    const phase = (elapsedMs % periodMs) / periodMs;     // 0..1
    const wave = Math.sin(phase * Math.PI * 2);          // -1..1
    y += Math.round(amountPx * wave);
  }

  if (y > MAX_Y_OFFSET_PX) y = MAX_Y_OFFSET_PX;
  if (y < -MAX_Y_OFFSET_PX) y = -MAX_Y_OFFSET_PX;
  return y;
}

export function Jami({ state, size = 112, forceReducedMotion = false, className }: JamiProps) {
  const reduced = useReducedMotion(forceReducedMotion);
  const cfg = STATE_CONFIG[state];
  const { idx, elapsedMs } = useAnimationClock(state, !reduced, cfg.frames.length, cfg.frameMs);

  // Reduced motion: freeze on frame 0, no overlay bob.
  const frame: Frame = reduced ? cfg.frames[0] : cfg.frames[idx];
  const yOffset = reduced ? 0 : computeYOffset(cfg, idx, elapsedMs);

  // Walk each pixel of the current frame, emit one <rect> per coloured cell.
  // This is the same approach the original component used; the only change
  // is that the rects now live inside a transform-applying <g>.
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const color = PALETTE[ch];
      if (color) {
        rects.push(<rect key={`${c}-${r}`} x={c} y={r} width={1} height={1} fill={color} />);
      }
    }
  }

  return (
    <svg
      width={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/*
        The inner <g> applies the integer-pixel overlay bob (breath +
        waddle). Using only integer translations keeps every pixel
        snapped to the SVG grid, so the art stays crisp at every scale.
        When yOffset is 0 we omit the transform attribute entirely to
        avoid any chance of the renderer doing extra compositing work.
      */}
      <g transform={yOffset !== 0 ? `translate(0 ${yOffset})` : undefined}>
        {rects}
      </g>
    </svg>
  );
}

