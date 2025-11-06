import { useDashboard } from '@/hooks/useDashboard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, GraduationCap, Clock, School } from 'lucide-react'

export default function Dashboard() {
  const { stats, loading, error } = useDashboard()

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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
              <div className="text-2xl font-bold">
                {stats.totalObservationHours.toFixed(1)}h
              </div>
            )}
            <CardDescription className="text-xs mt-1">
              Total verified hours
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
