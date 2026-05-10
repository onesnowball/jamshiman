'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { clsx } from 'clsx'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' }

export function StarRating({ value, onChange, readonly = false, size = 'md', label }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <div className={clsx('flex gap-0.5', !readonly && 'cursor-pointer')}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={clsx(
              sizeMap[size],
              'transition-colors',
              star <= display
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-200 fill-gray-100',
              !readonly && 'hover:scale-110'
            )}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
          />
        ))}
      </div>
    </div>
  )
}

export function RatingDisplay({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(value)} readonly size="sm" />
      <span className="text-sm font-medium text-gray-700">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count} reviews)</span>
      )}
    </div>
  )
}
