import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

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
        const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0]
        const todayStr = new Date().toISOString().split('T')[0]

        // Fetch applications
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('id, status, deadline, school_id')
          .eq('owner_id', user.id)

        if (appsError) throw appsError

        // Fetch schools for the applications
        const schoolIds = applications?.map((app) => app.school_id).filter(Boolean) || []
        const { data: schools, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', schoolIds)
          .eq('owner_id', user.id)

        if (schoolsError) throw schoolsError

        // Create a map of school_id to school name
        const schoolMap = new Map(
          schools?.map((school) => [school.id, school.name]) || []
        )

        // Calculate schools stats
        const totalSchools = applications?.length || 0
        const appliedSchools = applications?.filter(
          (app) => app.status === 'submitted' || app.status === 'interview' || app.status === 'accepted'
        ).length || 0
        const plannedSchools = applications?.filter(
          (app) => app.status === 'planned'
        ).length || 0

        // Get upcoming deadlines (next 7 days)
        const upcomingDeadlines =
          applications
            ?.filter((app) => {
              if (!app.deadline) return false
              const deadline = new Date(app.deadline)
              const today = new Date()
              const sevenDays = new Date()
              sevenDays.setDate(today.getDate() + 7)
              return deadline >= today && deadline <= sevenDays
            })
            .map((app) => ({
              id: app.id,
              school_name: schoolMap.get(app.school_id) || 'Unknown School',
              deadline: app.deadline || '',
              status: app.status,
            }))
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 5) || [] // Limit to 5 most recent

        // Fetch observation hours
        const { data: observations, error: obsError } = await supabase
          .from('observations')
          .select('hours')
          .eq('owner_id', user.id)

        if (obsError) throw obsError

        const totalObservationHours =
          observations?.reduce((sum, obs) => sum + (Number(obs.hours) || 0), 0) || 0

        // Fetch courses to calculate GPA
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('grade, credits')
          .eq('user_id', user.id)
          .eq('completed', true)

        if (coursesError) throw coursesError

        // Calculate GPA (4.0 scale)
        // Grade mapping: A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, B- = 2.7, etc.
        const gradePoints: Record<string, number> = {
          'A+': 4.0,
          'A': 4.0,
          'A-': 3.7,
          'B+': 3.3,
          'B': 3.0,
          'B-': 2.7,
          'C+': 2.3,
          'C': 2.0,
          'C-': 1.7,
          'D+': 1.3,
          'D': 1.0,
          'D-': 0.7,
          'F': 0.0,
        }

        let totalPoints = 0
        let totalCredits = 0

        courses?.forEach((course) => {
          const credits = Number(course.credits) || 0
          const grade = (course.grade || '').toUpperCase().trim()
          const points = gradePoints[grade] || 0

          if (credits > 0 && points > 0) {
            totalPoints += points * credits
            totalCredits += credits
          }
        })

        const overallGPA = totalCredits > 0 ? totalPoints / totalCredits : null

        setStats({
          totalSchools,
          appliedSchools,
          plannedSchools,
          upcomingDeadlines,
          totalObservationHours,
          overallGPA,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  return { stats, loading, error }
}

