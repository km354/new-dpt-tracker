import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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

interface ApplicationsState {
  applications: Application[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchApplications: () => Promise<void>
  createApplication: (data: {
    school_id: string
    status: 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected'
    app_fee?: number | null
    deadline?: string | null
    notes?: string | null
  }) => Promise<void>
  updateApplication: (id: string, data: {
    school_id?: string
    status?: 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected'
    app_fee?: number | null
    deadline?: string | null
    notes?: string | null
  }) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  reset: () => void
}

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async () => {
    set({ loading: true, error: null })
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Fetch applications
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id, school_id, status, app_fee, deadline, submitted_at, notes')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      // Fetch schools if we have applications
      if (applicationsData && applicationsData.length > 0) {
        const schoolIds = applicationsData
          .map((app: { school_id: string }) => app.school_id)
          .filter(Boolean) as string[]

        if (schoolIds.length > 0) {
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select('id, name')
            .in('id', schoolIds)
            .eq('owner_id', user.id)

          if (schoolsError) throw schoolsError

          // Map school names to applications
          const schoolMap = new Map(
            schools?.map((school: { id: string; name: string }) => [school.id, school.name]) || []
          )

          const applicationsWithSchools: Application[] = applicationsData.map((app: { id: string; school_id: string; status: string; app_fee: number | null; deadline: string | null; submitted_at: string | null; notes: string | null }) => ({
            id: app.id,
            school_id: app.school_id,
            school_name: schoolMap.get(app.school_id) || 'Unknown School',
            status: app.status as Application['status'],
            app_fee: app.app_fee ? Number(app.app_fee) : null,
            deadline: app.deadline,
            submitted_at: app.submitted_at,
            notes: app.notes,
          }))

          set({ applications: applicationsWithSchools, loading: false })
          return
        }
      }

      // No applications or no schools
      set({ applications: [], loading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications'
      set({ error: errorMessage, loading: false })
      console.error('Applications fetch error:', err)
    }
  },

  createApplication: async (data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Create application
      const { data: application, error: createError } = await supabase
        .from('applications')
        .insert({
          ...data,
          owner_id: user.id,
          submitted_at: data.status === 'submitted' ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (createError) throw createError

      // Fetch school name for the new application
      if (application.school_id) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('id, name')
          .eq('id', application.school_id)
          .eq('owner_id', user.id)
          .single()

        if (schoolError) throw schoolError

        const newApplication: Application = {
          id: application.id,
          school_id: application.school_id,
          school_name: school?.name || 'Unknown School',
          status: application.status as Application['status'],
          app_fee: application.app_fee ? Number(application.app_fee) : null,
          deadline: application.deadline,
          submitted_at: application.submitted_at,
          notes: application.notes,
        }

        // Add to state
        set((state) => ({
          applications: [newApplication, ...state.applications],
          loading: false,
        }))
      } else {
        // Refetch all if we can't get school name
        await get().fetchApplications()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create application'
      set({ error: errorMessage, loading: false })
      console.error('Application create error:', err)
      throw err
    }
  },

  updateApplication: async (id, data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Prepare update payload
      const updatePayload: any = { ...data }
      if (data.status === 'submitted' && !updatePayload.submitted_at) {
        updatePayload.submitted_at = new Date().toISOString()
      }

      // Update application
      const { data: application, error: updateError } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Fetch school name if school_id changed or we need it
      let schoolName = get().applications.find((app) => app.id === id)?.school_name
      
      if (data.school_id && data.school_id !== get().applications.find((app) => app.id === id)?.school_id) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('id, name')
          .eq('id', data.school_id)
          .eq('owner_id', user.id)
          .single()

        if (!schoolError && school) {
          schoolName = school.name
        }
      }

      // Update in state
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id
            ? {
                ...app,
                ...data,
                school_id: data.school_id || app.school_id,
                school_name: schoolName || app.school_name,
                status: data.status || app.status,
                app_fee: data.app_fee !== undefined ? data.app_fee : app.app_fee,
                deadline: data.deadline !== undefined ? data.deadline : app.deadline,
                notes: data.notes !== undefined ? data.notes : app.notes,
                submitted_at: application.submitted_at,
              }
            : app
        ),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application'
      set({ error: errorMessage, loading: false })
      console.error('Application update error:', err)
      throw err
    }
  },

  deleteApplication: async (id) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Delete application
      const { error: deleteError } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

      if (deleteError) throw deleteError

      // Remove from state
      set((state) => ({
        applications: state.applications.filter((app) => app.id !== id),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete application'
      set({ error: errorMessage, loading: false })
      console.error('Application delete error:', err)
      throw err
    }
  },

  reset: () => {
    set({ applications: [], loading: false, error: null })
  },
}))

