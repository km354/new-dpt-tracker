import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Application {
  id: string
  school_id: string
  school_name: string
  status: 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected'
  app_fee: number | null
  deadline: string | null
  submitted_at: string | null
  notes: string | null
}

export function useApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchApplications() {
      try {
        setLoading(true)
        setError(null)

        // Fetch applications
        const { data: applicationsData, error: appsError } = await supabase
          .from('applications')
          .select('id, school_id, status, app_fee, deadline, submitted_at, notes')
          .eq('owner_id', user!.id)
          .order('created_at', { ascending: false })

        if (appsError) throw appsError

        // Fetch schools
        const schoolIds = applicationsData?.map((app: { school_id: string }) => app.school_id).filter(Boolean) || []
        const { data: schools, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', schoolIds)
          .eq('owner_id', user!.id)

        if (schoolsError) throw schoolsError

        // Map school names to applications
        const schoolMap = new Map(
          schools?.map((school: { id: string; name: string }) => [school.id, school.name]) || []
        )

        const applicationsWithSchools: Application[] =
          applicationsData?.map((app: { id: string; school_id: string; status: string; app_fee: number | null; deadline: string | null; submitted_at: string | null; notes: string | null }) => ({
            id: app.id,
            school_id: app.school_id,
            school_name: schoolMap.get(app.school_id) || 'Unknown School',
            status: app.status as Application['status'],
            app_fee: app.app_fee ? Number(app.app_fee) : null,
            deadline: app.deadline,
            submitted_at: app.submitted_at,
            notes: app.notes,
          })) || []

        setApplications(applicationsWithSchools)
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : (err && typeof err === 'object' && 'message' in err) 
            ? String(err.message) 
            : 'Failed to fetch applications'
        setError(errorMessage)
        console.error('Applications fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [user])

  const refetch = async () => {
    if (!user) return
    // Re-fetch applications
    const { data: applicationsData, error: appsError } = await supabase
      .from('applications')
      .select('id, school_id, status, app_fee, deadline, submitted_at, notes')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false })

    if (appsError) {
      setError(appsError.message)
      return
    }

    const schoolIds = applicationsData?.map((app: { school_id: string }) => app.school_id).filter(Boolean) || []
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .in('id', schoolIds)
      .eq('owner_id', user!.id)

    if (schoolsError) {
      setError(schoolsError.message)
      return
    }

    const schoolMap = new Map(
      schools?.map((school: { id: string; name: string }) => [school.id, school.name]) || []
    )

    const applicationsWithSchools: Application[] =
      applicationsData?.map((app: { id: string; school_id: string; status: string; app_fee: number | null; deadline: string | null; submitted_at: string | null; notes: string | null }) => ({
        id: app.id,
        school_id: app.school_id,
        school_name: schoolMap.get(app.school_id) || 'Unknown School',
        status: app.status as Application['status'],
        app_fee: app.app_fee ? Number(app.app_fee) : null,
        deadline: app.deadline,
        submitted_at: app.submitted_at,
        notes: app.notes,
      })) || []

    setApplications(applicationsWithSchools)
  }

  return { applications, loading, error, refetch }
}

