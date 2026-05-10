'use client'

import { useMemo, useState } from 'react'
import { CalendarRange, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Course, Schedule, ScheduleCourse } from '@/types/database'

type ScheduleBlock = ScheduleCourse & {
  courses: Pick<Course, 'code' | 'name'> | null
}

type ScheduleWithBlocks = Schedule & {
  schedule_courses: ScheduleBlock[]
}

const BLOCK_COLORS = [
  { bg: 'bg-blue-100',   border: 'border-blue-200',   text: 'text-blue-800',   sub: 'text-blue-700'   },
  { bg: 'bg-emerald-100',border: 'border-emerald-200', text: 'text-emerald-800',sub: 'text-emerald-700' },
  { bg: 'bg-violet-100', border: 'border-violet-200',  text: 'text-violet-800', sub: 'text-violet-700'  },
  { bg: 'bg-amber-100',  border: 'border-amber-200',   text: 'text-amber-800',  sub: 'text-amber-700'   },
  { bg: 'bg-rose-100',   border: 'border-rose-200',    text: 'text-rose-800',   sub: 'text-rose-700'    },
  { bg: 'bg-cyan-100',   border: 'border-cyan-200',    text: 'text-cyan-800',   sub: 'text-cyan-700'    },
  { bg: 'bg-orange-100', border: 'border-orange-200',  text: 'text-orange-800', sub: 'text-orange-700'  },
  { bg: 'bg-teal-100',   border: 'border-teal-200',    text: 'text-teal-800',   sub: 'text-teal-700'    },
]

const DAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
]

const HOURS = Array.from({ length: 13 }, (_, index) => 8 + index)

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function formatHour(hour: number) {
  return hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

export function ScheduleBuilder({
  schedules,
  courses,
  initialScheduleId,
}: {
  schedules: ScheduleWithBlocks[]
  courses: Course[]
  initialScheduleId?: string
}) {
  const router = useRouter()
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId ?? schedules[0]?.id ?? '')
  const [newScheduleName, setNewScheduleName] = useState('')
  const [newScheduleSemester, setNewScheduleSemester] = useState('Fall 2026')
  const [blockForm, setBlockForm] = useState({
    id: '',
    course_id: courses[0]?.id ?? '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:30',
    location: '',
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const selectedSchedule = schedules.find(schedule => schedule.id === selectedScheduleId) ?? null

  const sortedBlocks = useMemo(() => {
    if (!selectedSchedule) return []
    return [...selectedSchedule.schedule_courses].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
      return minutesFromTime(a.start_time) - minutesFromTime(b.start_time)
    })
  }, [selectedSchedule])

  const courseColorMap = useMemo(() => {
    const seen = new Map<string, number>()
    for (const block of sortedBlocks) {
      if (!seen.has(block.course_id)) seen.set(block.course_id, seen.size)
    }
    return seen
  }, [sortedBlocks])

  async function createSchedule() {
    setSaving('schedule')
    setError('')

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScheduleName,
          semester: newScheduleSemester,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not create schedule.')

      window.location.href = `/schedule?schedule=${data.schedule.id}`
    } catch (err: any) {
      setError(err.message || 'Could not create schedule.')
    } finally {
      setSaving(null)
    }
  }

  async function deleteSchedule() {
    if (!selectedSchedule) return
    setSaving('delete-schedule')
    setError('')

    try {
      const response = await fetch('/api/schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: selectedSchedule.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not delete schedule.')
      window.location.href = '/schedule'
    } catch (err: any) {
      setError(err.message || 'Could not delete schedule.')
    } finally {
      setSaving(null)
    }
  }

  async function saveBlock() {
    if (!selectedSchedule) return

    setSaving('block')
    setError('')

    const method = blockForm.id ? 'PATCH' : 'POST'
    const payload = {
      schedule_id: selectedSchedule.id,
      schedule_course_id: blockForm.id || undefined,
      course_id: blockForm.course_id,
      day_of_week: blockForm.day_of_week,
      start_time: blockForm.start_time,
      end_time: blockForm.end_time,
      location: blockForm.location.trim() || null,
    }

    try {
      const response = await fetch('/api/schedule-courses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save block.')

      setBlockForm({
        id: '',
        course_id: courses[0]?.id ?? '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:30',
        location: '',
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not save block.')
    } finally {
      setSaving(null)
    }
  }

  async function removeBlock(scheduleCourseId: string) {
    setSaving(scheduleCourseId)
    setError('')

    try {
      const response = await fetch('/api/schedule-courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_course_id: scheduleCourseId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not remove block.')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not remove block.')
    } finally {
      setSaving(null)
    }
  }

  function loadBlock(block: ScheduleBlock) {
    setBlockForm({
      id: block.id,
      course_id: block.course_id,
      day_of_week: block.day_of_week,
      start_time: block.start_time,
      end_time: block.end_time,
      location: block.location ?? '',
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="font-medium text-gray-900">Your schedules</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create private timetable drafts and compare semester options.
            </p>
          </div>

          {schedules.length > 0 ? (
            <select
              value={selectedScheduleId}
              onChange={event => {
                setSelectedScheduleId(event.target.value)
                setBlockForm(current => ({ ...current, id: '' }))
              }}
              className="input"
            >
              {schedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} · {schedule.semester}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">No schedules yet. Create your first one below.</p>
          )}

          {selectedSchedule && (
            <button
              type="button"
              onClick={deleteSchedule}
              disabled={saving === 'delete-schedule'}
              className="btn-secondary text-sm"
            >
              {saving === 'delete-schedule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete selected schedule
            </button>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-600" />
            <h2 className="font-medium text-gray-900">Create schedule</h2>
          </div>
          <input
            value={newScheduleName}
            onChange={event => setNewScheduleName(event.target.value)}
            placeholder="e.g. Research-heavy draft"
            className="input"
          />
          <input
            value={newScheduleSemester}
            onChange={event => setNewScheduleSemester(event.target.value)}
            placeholder="Fall 2026"
            className="input"
          />
          <button
            type="button"
            onClick={createSchedule}
            disabled={saving === 'schedule' || newScheduleName.trim().length < 3}
            className="btn-primary"
          >
            {saving === 'schedule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarRange className="w-4 h-4" />}
            Create schedule
          </button>
        </div>

        {selectedSchedule && (
          <div className="card p-5 space-y-4">
            <h2 className="font-medium text-gray-900">
              {blockForm.id ? 'Edit meeting block' : 'Add meeting block'}
            </h2>

            {!courses.length ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                Seed at least one course in the catalog before adding schedule blocks.
              </div>
            ) : (
              <select
                value={blockForm.course_id}
                onChange={event => setBlockForm(current => ({ ...current, course_id: event.target.value }))}
                className="input"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={blockForm.day_of_week}
              onChange={event => setBlockForm(current => ({ ...current, day_of_week: Number(event.target.value) }))}
              className="input"
            >
              {DAY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={blockForm.start_time}
                onChange={event => setBlockForm(current => ({ ...current, start_time: event.target.value }))}
                className="input"
              />
              <input
                type="time"
                value={blockForm.end_time}
                onChange={event => setBlockForm(current => ({ ...current, end_time: event.target.value }))}
                className="input"
              />
            </div>

            <input
              value={blockForm.location}
              onChange={event => setBlockForm(current => ({ ...current, location: event.target.value }))}
              placeholder="Optional location"
              className="input"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveBlock}
                disabled={saving === 'block' || !blockForm.course_id || !courses.length}
                className="btn-primary"
              >
                {saving === 'block' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {blockForm.id ? 'Save changes' : 'Add block'}
              </button>

              {blockForm.id && (
                <button
                  type="button"
                  onClick={() => setBlockForm({
                    id: '',
                    course_id: courses[0]?.id ?? '',
                    day_of_week: 1,
                    start_time: '09:00',
                    end_time: '10:30',
                    location: '',
                  })}
                  className="btn-secondary"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="font-medium text-gray-900">
            {selectedSchedule ? `${selectedSchedule.name} · ${selectedSchedule.semester}` : 'Weekly view'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manual blocks for Mon–Fri, 8 AM–8 PM. Edit any block from the list below.
          </p>
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-[64px,repeat(5,minmax(0,1fr))] border-b border-gray-100 bg-gray-50">
            <div className="p-3 text-xs text-gray-400">Time</div>
            {DAY_OPTIONS.map(day => (
              <div key={day.value} className="p-3 text-xs font-medium text-gray-600">{day.label}</div>
            ))}
          </div>

          <div className="grid grid-cols-[64px,repeat(5,minmax(0,1fr))]">
            <div className="border-r border-gray-100">
              {HOURS.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-100 px-2 py-1 text-[11px] text-gray-400">
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {DAY_OPTIONS.map(day => (
              <div key={day.value} className="relative border-r last:border-r-0 border-gray-100">
                {HOURS.map(hour => (
                  <div key={hour} className="h-16 border-b border-gray-100" />
                ))}

                {sortedBlocks
                  .filter(block => block.day_of_week === day.value)
                  .map(block => {
                    const startMinutes = minutesFromTime(block.start_time)
                    const endMinutes = minutesFromTime(block.end_time)
                    const top = ((startMinutes - 8 * 60) / 60) * 64
                    const height = ((endMinutes - startMinutes) / 60) * 64
                    const colorIdx = (courseColorMap.get(block.course_id) ?? 0) % BLOCK_COLORS.length
                    const c = BLOCK_COLORS[colorIdx]

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => loadBlock(block)}
                        className={`absolute left-2 right-2 rounded-xl border px-3 py-2 text-left shadow-sm ${c.bg} ${c.border}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <p className={`text-xs font-semibold ${c.text}`}>{block.courses?.code ?? 'Course'}</p>
                        <p className={`text-[11px] ${c.sub} mt-1 leading-tight`}>{block.courses?.name}</p>
                        <p className={`text-[10px] ${c.sub} mt-1`}>
                          {block.start_time}–{block.end_time}
                        </p>
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>

        {selectedSchedule && (
          <div className="card p-5 space-y-3">
            <h2 className="font-medium text-gray-900">Saved blocks</h2>
            {!sortedBlocks.length ? (
              <p className="text-sm text-gray-500">No class blocks yet for this schedule.</p>
            ) : (
              sortedBlocks.map(block => (
                <div key={block.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {block.courses?.code} · {block.courses?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {DAY_OPTIONS.find(option => option.value === block.day_of_week)?.label} · {block.start_time}–{block.end_time}
                      {block.location ? ` · ${block.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => loadBlock(block)} className="btn-secondary text-xs">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      disabled={saving === block.id}
                      className="btn-secondary text-xs"
                    >
                      {saving === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
