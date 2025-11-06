import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'deadline' | 'interview' | 'decision'
  applicationId?: string
  schoolId?: string
  schoolName?: string
}

export function useCalendarEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchEvents() {
      try {
        setLoading(true)
        setError(null)

        // Fetch events from events table
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date, type, school_id')
          .eq('owner_id', user!.id)
          .order('date', { ascending: true })

        if (eventsError) throw eventsError

        // Fetch applications for deadlines
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('id, deadline, school_id')
          .eq('owner_id', user!.id)
          .not('deadline', 'is', null)

        if (appsError) throw appsError

        // Fetch schools for events
        const schoolIds = [
          ...(eventsData?.map((e: { school_id: string | null }) => e.school_id).filter(Boolean) || []),
          ...(applications?.map((a: { school_id: string | null }) => a.school_id).filter(Boolean) || []),
        ]
        const uniqueSchoolIds = [...new Set(schoolIds)]

        let schoolMap = new Map<string, string>()
        if (uniqueSchoolIds.length > 0) {
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select('id, name')
            .in('id', uniqueSchoolIds)
            .eq('owner_id', user!.id)

          if (schoolsError) throw schoolsError
          schoolMap = new Map(schools?.map((s: { id: string; name: string }) => [s.id, s.name]) || [])
        }

        // Combine events and application deadlines
        const calendarEvents: CalendarEvent[] = []

        // Add events from events table
        eventsData?.forEach((event: { id: string; title: string; date: string; type: string; school_id: string | null }) => {
          calendarEvents.push({
            id: event.id,
            title: event.title,
            date: event.date,
            type: event.type as 'deadline' | 'interview' | 'decision',
            schoolId: event.school_id || undefined,
            schoolName: event.school_id ? schoolMap.get(event.school_id) : undefined,
          })
        })

        // Add application deadlines as events
        applications?.forEach((app: { id: string; deadline: string | null; school_id: string | null }) => {
          if (app.deadline) {
            const schoolName = app.school_id
              ? schoolMap.get(app.school_id) || 'Unknown School'
              : 'Unknown School'
            calendarEvents.push({
              id: `deadline-${app.id}`,
              title: `Deadline: ${schoolName}`,
              date: app.deadline,
              type: 'deadline',
              applicationId: app.id,
              schoolId: app.school_id || undefined,
              schoolName,
            })
          }
        })

        setEvents(calendarEvents)
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : (err && typeof err === 'object' && 'message' in err) 
            ? String(err.message) 
            : 'Failed to fetch calendar events'
        setError(errorMessage)
        console.error('Calendar events fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [user])

  return { events, loading, error }
}

