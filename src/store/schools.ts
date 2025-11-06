import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface School {
  id: string
  name: string
  location: string | null
  website: string | null
  notes: string | null
}

interface SchoolsState {
  schools: School[]
  loading: boolean
  error: string | null

  // Actions
  fetchSchools: () => Promise<void>
  createSchool: (data: {
    name: string
    location?: string | null
    website?: string | null
    notes?: string | null
  }) => Promise<void>
  updateSchool: (id: string, data: {
    name?: string
    location?: string | null
    website?: string | null
    notes?: string | null
  }) => Promise<void>
  deleteSchool: (id: string) => Promise<void>
  reset: () => void
}

export const useSchoolsStore = create<SchoolsState>((set, get) => ({
  schools: [],
  loading: false,
  error: null,

  fetchSchools: async () => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Fetch schools
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, location, website, notes')
        .eq('owner_id', user.id)
        .order('name', { ascending: true })

      if (schoolsError) throw schoolsError

      set({ schools: schools || [], loading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schools'
      set({ error: errorMessage, loading: false })
      console.error('Schools fetch error:', err)
    }
  },

  createSchool: async (data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Create school
      const { data: school, error: createError } = await supabase
        .from('schools')
        .insert({
          ...data,
          owner_id: user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      // Add to state
      set((state) => ({
        schools: [...state.schools, school].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create school'
      set({ error: errorMessage, loading: false })
      console.error('School create error:', err)
      throw err
    }
  },

  updateSchool: async (id, data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update school
      const { data: school, error: updateError } = await supabase
        .from('schools')
        .update(data)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update in state
      set((state) => ({
        schools: state.schools
          .map((s) => (s.id === id ? school : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update school'
      set({ error: errorMessage, loading: false })
      console.error('School update error:', err)
      throw err
    }
  },

  deleteSchool: async (id) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Delete school
      const { error: deleteError } = await supabase
        .from('schools')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

      if (deleteError) throw deleteError

      // Remove from state
      set((state) => ({
        schools: state.schools.filter((s) => s.id !== id),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete school'
      set({ error: errorMessage, loading: false })
      console.error('School delete error:', err)
      throw err
    }
  },

  reset: () => {
    set({ schools: [], loading: false, error: null })
  },
}))

