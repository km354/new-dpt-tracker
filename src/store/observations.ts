import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Observation {
  id: string
  setting: string
  hours: number
  date: string
  supervisor: string | null
  verified: boolean
  notes: string | null
}

interface ObservationsState {
  observations: Observation[]
  loading: boolean
  error: string | null

  // Actions
  fetchObservations: () => Promise<void>
  createObservation: (data: {
    setting: string
    hours: number
    date: string
    supervisor?: string | null
    verified?: boolean
    notes?: string | null
  }) => Promise<void>
  updateObservation: (id: string, data: {
    setting?: string
    hours?: number
    date?: string
    supervisor?: string | null
    verified?: boolean
    notes?: string | null
  }) => Promise<void>
  deleteObservation: (id: string) => Promise<void>
  getTotalHours: () => number
  reset: () => void
}

export const useObservationsStore = create<ObservationsState>((set, get) => ({
  observations: [],
  loading: false,
  error: null,

  fetchObservations: async () => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Fetch observations
      const { data: observations, error: observationsError } = await supabase
        .from('observations')
        .select('id, setting, hours, date, supervisor, verified, notes')
        .eq('owner_id', user.id)
        .order('date', { ascending: false })

      if (observationsError) throw observationsError

      set({
        observations:
          observations?.map((obs: { id: string; setting: string; hours: number | string; date: string; supervisor: string | null; verified: boolean; notes: string | null }) => ({
            id: obs.id,
            setting: obs.setting,
            hours: Number(obs.hours) || 0,
            date: obs.date,
            supervisor: obs.supervisor,
            verified: obs.verified,
            notes: obs.notes,
          })) || [],
        loading: false,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch observations'
      set({ error: errorMessage, loading: false })
      console.error('Observations fetch error:', err)
    }
  },

  createObservation: async (data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Create observation
      const { data: observation, error: createError } = await supabase
        .from('observations')
        .insert({
          ...data,
          owner_id: user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      // Add to state
      set((state) => ({
        observations: [
          {
            id: observation.id,
            setting: observation.setting,
            hours: Number(observation.hours) || 0,
            date: observation.date,
            supervisor: observation.supervisor,
            verified: observation.verified,
            notes: observation.notes,
          },
          ...state.observations,
        ],
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create observation'
      set({ error: errorMessage, loading: false })
      console.error('Observation create error:', err)
      throw err
    }
  },

  updateObservation: async (id, data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update observation
      const { data: observation, error: updateError } = await supabase
        .from('observations')
        .update(data)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update in state
      set((state) => ({
        observations: state.observations.map((obs) =>
          obs.id === id
            ? {
                id: observation.id,
                setting: observation.setting,
                hours: Number(observation.hours) || 0,
                date: observation.date,
                supervisor: observation.supervisor,
                verified: observation.verified,
                notes: observation.notes,
              }
            : obs
        ),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update observation'
      set({ error: errorMessage, loading: false })
      console.error('Observation update error:', err)
      throw err
    }
  },

  deleteObservation: async (id) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Delete observation
      const { error: deleteError } = await supabase
        .from('observations')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

      if (deleteError) throw deleteError

      // Remove from state
      set((state) => ({
        observations: state.observations.filter((obs) => obs.id !== id),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete observation'
      set({ error: errorMessage, loading: false })
      console.error('Observation delete error:', err)
      throw err
    }
  },

  getTotalHours: () => {
    const state = get()
    return state.observations.reduce((sum, obs) => sum + obs.hours, 0)
  },

  reset: () => {
    set({ observations: [], loading: false, error: null })
  },
}))

