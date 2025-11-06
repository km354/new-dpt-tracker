import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useObservationsStore } from '../observations'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

const mockUser = { id: 'user-123', email: 'test@example.com' }

describe('Observations Store', () => {
  beforeEach(() => {
    useObservationsStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('getTotalHours', () => {
    it('should return 0 for empty observations', () => {
      const store = useObservationsStore.getState()
      expect(store.getTotalHours()).toBe(0)
    })

    it('should calculate total hours correctly', () => {
      useObservationsStore.setState({
        observations: [
          {
            id: '1',
            setting: 'Hospital',
            hours: 10,
            date: '2024-01-01',
            supervisor: 'Dr. Smith',
            verified: true,
            notes: null,
          },
          {
            id: '2',
            setting: 'Clinic',
            hours: 15,
            date: '2024-01-02',
            supervisor: 'Dr. Jones',
            verified: false,
            notes: null,
          },
        ],
      })

      const store = useObservationsStore.getState()
      expect(store.getTotalHours()).toBe(25)
    })

    it('should handle decimal hours', () => {
      useObservationsStore.setState({
        observations: [
          {
            id: '1',
            setting: 'Hospital',
            hours: 10.5,
            date: '2024-01-01',
            supervisor: 'Dr. Smith',
            verified: true,
            notes: null,
          },
          {
            id: '2',
            setting: 'Clinic',
            hours: 7.25,
            date: '2024-01-02',
            supervisor: 'Dr. Jones',
            verified: false,
            notes: null,
          },
        ],
      })

      const store = useObservationsStore.getState()
      expect(store.getTotalHours()).toBeCloseTo(17.75, 2)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', () => {
      const store = useObservationsStore.getState()
      store.reset()
      expect(store.observations).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})

