'use client'

import React from 'react'

/**
 * Defensive wrapper for mascot-related client components.
 *
 * If anything inside (Jami sprite, the Lurker, a celebration toast)
 * throws during render, this swallows the error so the rest of the
 * page stays alive. Mascot is decorative — there's no value in
 * crashing the app just because a sprite frame is malformed.
 *
 * Logs to console in dev only; silent in prod to avoid noise.
 */
export class MascotErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MascotErrorBoundary] mascot crashed; suppressing:', error, info)
    }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
