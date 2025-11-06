import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface School {
  id: string
  name: string
  location: string | null
  website: string | null
}

export function useSchools() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchSchools() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name, location, website')
          .eq('owner_id', user.id)
          .order('name', { ascending: true })

        if (schoolsError) throw schoolsError

        setSchools(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schools')
        console.error('Schools fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchools()
  }, [user])

  return { schools, loading, error }
}

