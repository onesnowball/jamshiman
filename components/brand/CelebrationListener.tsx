'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ContributionCelebration } from './ContributionCelebration'
import { consumeQueuedCelebration } from '@/lib/celebrate'

/** Mounted once in the root layout. Watches for queued celebrations
 *  (set via queueCelebration() before navigation) and renders confetti + toast. */
export function CelebrationListener() {
  const pathname = usePathname()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const queued = consumeQueuedCelebration()
    if (queued) setMessage(queued.message)
  }, [pathname])

  return (
    <ContributionCelebration
      show={message != null}
      message={message ?? undefined}
      onDone={() => setMessage(null)}
    />
  )
}
