import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { Skeleton } from '@/components/ui/skeleton'

export default function Calendar() {
  const navigate = useNavigate()
  const { events, loading, error } = useCalendarEvents()

  // Transform events to FullCalendar format with colors
  const calendarEvents = useMemo<EventInput[]>(() => {
    return events.map((event) => {
      let color = '#6B7280' // Default gray

      switch (event.type) {
        case 'deadline':
          color = '#EF4444' // Red
          break
        case 'interview':
          color = '#F97316' // Orange
          break
        case 'decision':
          color = '#22C55E' // Green
          break
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        backgroundColor: color,
        borderColor: color,
        textColor: '#FFFFFF',
        extendedProps: {
          applicationId: event.applicationId,
          type: event.type,
        },
      }
    })
  }, [events])

  const handleEventClick = (clickInfo: EventClickArg) => {
    const applicationId = clickInfo.event.extendedProps.applicationId
    
    // If it's an application deadline, navigate to application detail
    if (applicationId) {
      navigate(`/applications/${applicationId}`)
    }
    // Otherwise, it's a regular event (could show event details in future)
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Important Dates</h1>
        <p className="text-muted-foreground mb-6">
          Manage your important dates and deadlines
        </p>
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Important Dates</h1>
      <p className="text-muted-foreground mb-6">
        Manage your important dates and deadlines
      </p>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm">Deadline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span className="text-sm">Interview</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm">Decision</span>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <div className="bg-white rounded-lg border p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventDisplay="block"
            editable={false}
            selectable={false}
            dayMaxEvents={true}
            moreLinkClick="popover"
          />
        </div>
      )}
    </div>
  )
}
