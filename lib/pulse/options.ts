export const ACADEMIC_STATUSES = ['masters', 'phd', 'postdoc', 'other_grad'] as const
export type AcademicStatus = (typeof ACADEMIC_STATUSES)[number]

export const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  masters: "Master's",
  phd: 'PhD',
  postdoc: 'Postdoc',
  other_grad: 'Other grad',
}

export const MOODS = [
  'okay',
  'cooked',
  'caffeinated',
  'locked_in',
  'sleepy',
  'deadline_mode',
  'surviving',
  'weirdly_fine',
] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, { emoji: string; label: string }> = {
  okay:          { emoji: '🌱', label: 'okay' },
  cooked:        { emoji: '😵', label: 'cooked' },
  caffeinated:   { emoji: '☕', label: 'caffeinated' },
  locked_in:     { emoji: '🧠', label: 'locked in' },
  sleepy:        { emoji: '🌙', label: 'sleepy' },
  deadline_mode: { emoji: '🔥', label: 'deadline mode' },
  surviving:     { emoji: '🫠', label: 'surviving' },
  weirdly_fine:  { emoji: '✨', label: 'weirdly fine' },
}

export const CONTEXT_TAGS = [
  'normal_week',
  'deadline',
  'conference_submission',
  'quals',
  'job_search',
  'ta_grading',
  'paper_revision',
  'personal',
] as const
export type ContextTag = (typeof CONTEXT_TAGS)[number]

export const CONTEXT_TAG_LABELS: Record<ContextTag, string> = {
  normal_week: 'normal week',
  deadline: 'deadline',
  conference_submission: 'conference submission',
  quals: 'quals',
  job_search: 'job search',
  ta_grading: 'TA grading',
  paper_revision: 'paper revision',
  personal: 'personal',
}
