import { useDashboard } from '@/hooks/useDashboard'
import { useObservationsStore } from '@/store/observations'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { useNotifications } from '@/hooks/useNotifications'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Calendar, GraduationCap, Clock, School } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt'

export default function Dashboard() {
  const { stats, loading, error } = useDashboard()
  const { observations, fetchObservations, getTotalHours } = useObservationsStore()
  const { events } = useCalendarEvents()
  const { showNotification } = useNotifications()
  const notifiedEventsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetchObservations()
  }, [fetchObservations])

  // Check for events within 3 days and show toasts
  useEffect(() => {
    if (!events || events.length === 0) return

    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(now.getDate() + 3)

    events.forEach((event) => {
      // Skip if already notified
      if (notifiedEventsRef.current.has(event.id)) return

      const eventDate = new Date(event.date)
      const daysUntil = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if event is within 3 days
      if (eventDate >= now && eventDate <= threeDaysFromNow && daysUntil >= 0) {
        const eventTypeLabels = {
          deadline: 'Deadline',
          interview: 'Interview',
          decision: 'Decision',
        }

        const schoolText = event.schoolName ? ` for ${event.schoolName}` : ''
        const daysText =
          daysUntil === 0
            ? 'today'
            : daysUntil === 1
              ? 'tomorrow'
              : `in ${daysUntil} days`

        const toastTitle = `${eventTypeLabels[event.type]}${schoolText}`
        const toastDescription = `${event.title} is ${daysText}`

        // Show toast with appropriate type
        if (event.type === 'deadline') {
          toast.error(toastTitle, {
            description: toastDescription,
            duration: 5000,
          })
        } else if (event.type === 'interview') {
          toast.warning(toastTitle, {
            description: toastDescription,
            duration: 5000,
          })
        } else if (event.type === 'decision') {
          toast.success(toastTitle, {
            description: toastDescription,
            duration: 5000,
          })
        } else {
          toast.info(toastTitle, {
            description: toastDescription,
            duration: 5000,
          })
        }

        // Show browser notification if permission is granted
        showNotification(
          `${eventTypeLabels[event.type]}${schoolText}`,
          {
            body: `${event.title} is ${daysText}`,
            tag: event.id, // Prevent duplicate notifications
          }
        )

        // Mark as notified
        notifiedEventsRef.current.add(event.id)
      }
    })
  }, [events, showNotification])

  const totalObservationHours = getTotalHours()

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Overview of your DPT application progress
      </p>

      <NotificationPermissionPrompt />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Schools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSchools}</div>
            )}
            <CardDescription className="text-xs mt-1">
              {stats.appliedSchools} applied, {stats.plannedSchools} planned
            </CardDescription>
          </CardContent>
        </Card>

        {/* Observation Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Observation Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {totalObservationHours.toFixed(1)}h
                </div>
                <Badge variant="secondary" className="text-xs">
                  {observations.filter((o) => o.verified).length} verified
                </Badge>
              </div>
            )}
            <CardDescription className="text-xs mt-1">
              Total observation hours
            </CardDescription>
          </CardContent>
        </Card>

        {/* Overall GPA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : stats.overallGPA !== null ? (
              <div className="text-2xl font-bold">
                {stats.overallGPA.toFixed(2)}
              </div>
            ) : (
              <div className="text-2xl font-bold">—</div>
            )}
            <CardDescription className="text-xs mt-1">
              Based on completed courses
            </CardDescription>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Deadlines
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.upcomingDeadlines.length}
              </div>
            )}
            <CardDescription className="text-xs mt-1">
              Next 7 days
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>
            Application deadlines in the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : stats.upcomingDeadlines.length > 0 ? (
            <div className="space-y-4">
              {stats.upcomingDeadlines.map((deadline) => {
                const deadlineDate = new Date(deadline.deadline)
                const daysUntil = Math.ceil(
                  (deadlineDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                return (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{deadline.school_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {deadlineDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          daysUntil <= 1
                            ? 'text-destructive'
                            : daysUntil <= 3
                              ? 'text-orange-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                            ? '1 day'
                            : `${daysUntil} days`}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {deadline.status}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No upcoming deadlines in the next 7 days
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
