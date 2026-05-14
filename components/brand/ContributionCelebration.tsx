'use client'

import { useEffect, useState } from 'react'
import { JamMascot } from './JamMascot'

const MESSAGES = [
  'You helped future students make a better decision ✨',
  'Tiny contribution, huge future-student energy 🌱',
  'Grad Pulse updated. The campus feels slightly less alone 🫧',
  'Thank you — anonymous knowledge only works when people contribute ☕',
]

export function ContributionCelebration({
  show,
  message,
  onDone,
  durationMs = 2400,
}: {
  show: boolean
  message?: string
  onDone?: () => void
  durationMs?: number
}) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState(message ?? MESSAGES[0])

  useEffect(() => {
    if (!show) return
    setText(message ?? MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, durationMs)
    return () => clearTimeout(t)
  }, [show, message, durationMs, onDone])

  if (!visible) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 motion-safe:animate-[jam-pop_300ms_ease-out]">
      <div className="card px-4 py-3 flex items-center gap-3 bg-white shadow-lg rounded-2xl border border-gray-100">
        <JamMascot state="celebrating" size="sm" />
        <p className="text-sm text-gray-800">{text}</p>
      </div>
      <style>{`@keyframes jam-pop { from { transform: translate(-50%, 12px); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }`}</style>
    </div>
  )
}
