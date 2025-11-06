import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { calculateGPA } from '@/lib/gpa'

interface DashboardStats {
  totalSchools: number
  appliedSchools: number
  plannedSchools: number
  upcomingDeadlines: Array<{
    id: string
    school_name: string
    deadline: string
    status: string
  }>
  totalObservationHours: number
  overallGPA: number | null
}

export function useDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    appliedSchools: 0,
    plannedSchools: 0,
    upcomingDeadlines: [],
    totalObservationHours: 0,
    overallGPA: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        // Fetch applications
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('id, status, deadline, school_id')
          .eq('owner_id', user!.id)

        if (appsError) throw appsError

        // Fetch schools for the applications
        const schoolIds = applications?.map((app: { school_id: string }) => app.school_id).filter(Boolean) || []
        const { data: schools, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', schoolIds)
          .eq('owner_id', user!.id)

        if (schoolsError) throw schoolsError

        // Create a map of school_id to school name
        const schoolMap = new Map(
          schools?.map((school: { id: string; name: string }) => [school.id, school.name]) || []
        )

        // Calculate schools stats
        const totalSchools = applications?.length || 0
        const appliedSchools = applications?.filter(
          (app: { status: string }) => app.status === 'submitted' || app.status === 'interview' || app.status === 'accepted'
        ).length || 0
        const plannedSchools = applications?.filter(
          (app: { status: string }) => app.status === 'planned'
        ).length || 0

        // Get upcoming deadlines (next 7 days)
        const upcomingDeadlines =
          applications
            ?.filter((app: { deadline: string | null }) => {
              if (!app.deadline) return false
              const deadline = new Date(app.deadline)
              const today = new Date()
              const sevenDays = new Date()
              sevenDays.setDate(today.getDate() + 7)
              return deadline >= today && deadline <= sevenDays
            })
            .map((app: { id: string; school_id: string; deadline: string | null; status: string }) => ({
              id: app.id,
              school_name: schoolMap.get(app.school_id) || 'Unknown School',
              deadline: app.deadline || '',
              status: app.status,
            }))
            .sort((a: { deadline: string }, b: { deadline: string }) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 5) || [] // Limit to 5 most recent

        // Fetch observation hours
        const { data: observations, error: obsError } = await supabase
          .from('observations')
          .select('hours')
          .eq('owner_id', user!.id)

        if (obsError) throw obsError

        const totalObservationHours =
          observations?.reduce((sum: number, obs: { hours: number | string }) => sum + (Number(obs.hours) || 0), 0) || 0

        // Fetch courses to calculate GPA
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, subject, grade, credits, semester, completed')
          .eq('user_id', user!.id)
          .eq('completed', true)

        if (coursesError) throw coursesError

        // Calculate GPA using the centralized function
        const coursesForGPA =
          courses?.map((c: { id: string; subject: string; grade: string | null; credits: number | null; semester: string | null; completed: boolean }) => ({
            id: c.id,
            subject: c.subject,
            grade: c.grade,
            credits: c.credits ? Number(c.credits) : null,
            semester: c.semester,
            completed: c.completed,
          })) || []

        const overallGPA = calculateGPA(coursesForGPA)

        setStats({
          totalSchools,
          appliedSchools,
          plannedSchools,
          upcomingDeadlines,
          totalObservationHours,
          overallGPA,
        })
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : (err && typeof err === 'object' && 'message' in err) 
            ? String(err.message) 
            : 'Failed to fetch dashboard data'
        setError(errorMessage)
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  return { stats, loading, error }
}

