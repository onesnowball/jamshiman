import { JamMascot, JamState } from './JamMascot'

export type EmptyVariant =
  | 'advisor_no_reviews'
  | 'pulse_locked'
  | 'pulse_not_enough_data'
  | 'no_reviews'
  | 'no_xp'
  | 'generic'

const VARIANT_TO_STATE: Record<EmptyVariant, JamState> = {
  advisor_no_reviews: 'empty',
  pulse_locked: 'locked',
  pulse_not_enough_data: 'sleepy',
  no_reviews: 'empty',
  no_xp: 'studying',
  generic: 'default',
}

export function EmptyStateIllustration({
  variant = 'generic',
  title,
  body,
  children,
}: {
  variant?: EmptyVariant
  title?: string
  body?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <JamMascot state={VARIANT_TO_STATE[variant]} size="lg" />
      {title && <p className="text-sm font-medium text-gray-800">{title}</p>}
      {body && <p className="text-xs text-gray-500 max-w-sm">{body}</p>}
      {children}
    </div>
  )
}
