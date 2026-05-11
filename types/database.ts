export type DegreeType = 'ms' | 'phd'
export type ContentStatus = 'active' | 'flagged' | 'removed' | 'pending' | 'pending_delete' | 'archived'
export type UserRole = 'student' | 'admin'
export type FlagReason = 'inappropriate' | 'inaccurate' | 'spam' | 'harmful' | 'other'
export type BoardType = 'department' | 'course'

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          domain: string
          active: boolean
          created_at: string
        }
        Insert: Omit<universities['Row'], 'id' | 'created_at'>
        Update: Partial<universities['Insert']>
      }
      departments: {
        Row: {
          id: string
          university_id: string
          name: string
          slug: string
          active: boolean
          is_board_category: boolean
          created_at: string
        }
        Insert: Omit<departments['Row'], 'id' | 'created_at'>
        Update: Partial<departments['Insert']>
      }
      users: {
        Row: {
          id: string
          email_hash: string
          university_id: string
          dept_id: string | null
          degree_type: DegreeType | null
          role: UserRole
          is_banned: boolean
          created_at: string
        }
        Insert: Omit<users['Row'], 'created_at'>
        Update: Partial<users['Insert']>
      }
      advisors: {
        Row: {
          id: string
          university_id: string
          dept_id: string
          name: string
          title: string | null
          lab_name: string | null
          research_areas: string[]
          active: boolean
          created_at: string
        }
        Insert: Omit<advisors['Row'], 'id' | 'created_at'>
        Update: Partial<advisors['Insert']>
      }
      advisor_reviews: {
        Row: {
          id: string
          advisor_id: string
          reviewer_id: string
          degree_type: DegreeType
          ratings: AdvisorRatings
          original_text: string
          anonymized_text: string
          years_in_lab: number | null
          is_current: boolean
          status: ContentStatus
          created_at: string
        }
        Insert: Omit<advisor_reviews['Row'], 'id' | 'created_at'>
        Update: Partial<advisor_reviews['Insert']>
      }
      courses: {
        Row: {
          id: string
          university_id: string
          dept_id: string
          code: string
          name: string
          credits: number | null
          created_at: string
        }
        Insert: Omit<courses['Row'], 'id' | 'created_at'>
        Update: Partial<courses['Insert']>
      }
      course_reviews: {
        Row: {
          id: string
          course_id: string
          reviewer_id: string
          semester: string
          degree_type: DegreeType
          ratings: CourseRatings
          anonymized_text: string
          original_text: string
          status: ContentStatus
          created_at: string
        }
        Insert: Omit<course_reviews['Row'], 'id' | 'created_at'>
        Update: Partial<course_reviews['Insert']>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          dept_id: string
          course_id: string | null
          university_id: string
          board_type: BoardType
          title: string
          body: string
          is_anonymous: boolean
          upvotes: number
          status: ContentStatus
          created_at: string
        }
        Insert: Omit<posts['Row'], 'id' | 'upvotes' | 'created_at'>
        Update: Partial<posts['Insert']>
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          is_anonymous: boolean
          upvotes: number
          status: ContentStatus
          created_at: string
        }
        Insert: Omit<comments['Row'], 'id' | 'upvotes' | 'created_at'>
        Update: Partial<comments['Insert']>
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          semester: string
          name: string
          created_at: string
        }
        Insert: Omit<schedules['Row'], 'id' | 'created_at'>
        Update: Partial<schedules['Insert']>
      }
      schedule_courses: {
        Row: {
          id: string
          schedule_id: string
          course_id: string
          day_of_week: number
          start_time: string
          end_time: string
          location: string | null
        }
        Insert: Omit<schedule_courses['Row'], 'id'>
        Update: Partial<schedule_courses['Insert']>
      }
      flags: {
        Row: {
          id: string
          reporter_id: string
          content_type: 'review' | 'post' | 'comment' | 'course_review'
          content_id: string
          reason: FlagReason
          notes: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          resolved_by: string | null
          created_at: string
        }
        Insert: Omit<flags['Row'], 'id' | 'status' | 'resolved_by' | 'created_at'>
        Update: Partial<flags['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: Omit<audit_log['Row'], 'id' | 'created_at'>
        Update: never
      }
      post_votes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string; created_at?: string }
        Update: { post_id?: string; user_id?: string; created_at?: string }
        Relationships: []
      }
      comment_votes: {
        Row: { comment_id: string; user_id: string; created_at: string }
        Insert: { comment_id: string; user_id: string; created_at?: string }
        Update: { comment_id?: string; user_id?: string; created_at?: string }
        Relationships: []
      }
    }
    Views: {
      advisor_aggregates: {
        Row: {
          advisor_id: string
          review_count: number
          avg_mentorship: number
          avg_funding: number
          avg_worklife: number
          avg_communication: number
          avg_career: number
          avg_overall: number
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}

// Convenience aliases
type Tables = Database['public']['Tables']
type universities = Tables['universities']
type departments = Tables['departments']
type users = Tables['users']
type advisors = Tables['advisors']
type advisor_reviews = Tables['advisor_reviews']
type courses = Tables['courses']
type course_reviews = Tables['course_reviews']
type posts = Tables['posts']
type comments = Tables['comments']
type schedules = Tables['schedules']
type schedule_courses = Tables['schedule_courses']
type flags = Tables['flags']
type audit_log = Tables['audit_log']

export type University = universities['Row']
export type Department = departments['Row']
export type User = users['Row']
export type Advisor = advisors['Row']
export type AdvisorReview = advisor_reviews['Row']
export type Course = courses['Row']
export type CourseReview = course_reviews['Row']
export type Post = posts['Row']
export type Comment = comments['Row']
export type Schedule = schedules['Row']
export type ScheduleCourse = schedule_courses['Row']
export type Flag = flags['Row']
export type AuditLog = audit_log['Row']

export interface AdvisorRatings {
  mentorship: number      // 1-5
  funding: number         // 1-5
  worklife: number        // 1-5
  communication: number   // 1-5
  career: number          // 1-5
}

export interface CourseRatings {
  difficulty: number      // 1-5
  usefulness: number      // 1-5
  workload: number        // 1-5
  professor: number       // 1-5
}

export interface AdvisorWithStats extends Advisor {
  dept_name?: string
  review_count: number
  avg_overall: number
  avg_mentorship: number
  avg_funding: number
  avg_worklife: number
  avg_communication: number
  avg_career: number
}
