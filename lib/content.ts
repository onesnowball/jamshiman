import type { Database } from '@/types/database'

export const CONTENT_TABLE_BY_TYPE = {
  review: 'advisor_reviews',
  course_review: 'course_reviews',
  post: 'posts',
  comment: 'comments',
} as const

export type FlagContentType = Database['public']['Tables']['flags']['Row']['content_type']
export type ContentTableName = typeof CONTENT_TABLE_BY_TYPE[FlagContentType]

export function isFlagContentType(value: string): value is FlagContentType {
  return value in CONTENT_TABLE_BY_TYPE
}

export function getContentTable(contentType: FlagContentType): ContentTableName {
  return CONTENT_TABLE_BY_TYPE[contentType]
}
