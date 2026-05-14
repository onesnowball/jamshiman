'use client'

import { useEffect, useState } from 'react'
import { JamMascot } from './JamMascot'
import { Confetti } from './Confetti'

const MESSAGES = [
  'You helped future students make a better decision ✨',
  'Tiny contribution, huge future-student energy 🌱',
  'jamshiman updated. The campus feels slightly less alone 🫧',
  'Thank you — anonymous knowledge only works when people contribute ☕',
]

export function ContributionCelebration({
  show,
  message,
  onDone,
  durationMs = 2600,
  confetti = true,
}: {
  show: boolean
  message?: string
  onDone?: () => void
  durationMs?: number
  confetti?: boolean
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

  return (
    <>
      {confetti && <Confetti show={visible} />}
      {visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] motion-safe:animate-[jam-pop_360ms_cubic-bezier(0.2,0.9,0.3,1.4)]">
          <div className="px-4 py-3 flex items-center gap-3 bg-white shadow-xl rounded-2xl border border-gray-100">
            <JamMascot state="celebrating" size="sm" className="motion-safe:animate-[jam-jump_700ms_ease-out_2]" />
            <p className="text-sm text-gray-800">{text}</p>
          </div>
          <style>{`
            @keyframes jam-pop { from { transform: translate(-50%, 18px) scale(0.92); opacity: 0 } to { transform: translate(-50%, 0) scale(1); opacity: 1 } }
            @keyframes jam-jump { 0%,100% { transform: translateY(0) } 40% { transform: translateY(-10px) rotate(-6deg) } 70% { transform: translateY(0) rotate(4deg) } }
          `}</style>
        </div>
      )}
    </>
  )
}
