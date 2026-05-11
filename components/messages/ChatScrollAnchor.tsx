'use client'

import { useEffect, useRef } from 'react'

/**
 * Invisible div placed at the bottom of the message list.
 * On mount it scrolls itself into view, keeping the chat
 * anchored to the most recent message.
 */
export function ChatScrollAnchor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  return <div ref={ref} />
}
