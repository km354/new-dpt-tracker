import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApplicationsStore } from '../applications'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

describe('Applications Store', () => {
  beforeEach(() => {
    useApplicationsStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('reset', () => {
    it('should reset state to initial values', () => {
      const store = useApplicationsStore.getState()
      store.reset()
      expect(store.applications).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchApplications', () => {
    it('should fetch applications successfully', async () => {
      const mockApps = [
        {
          id: 'app-1',
          school_id: 'school-1',
          status: 'planned' as const,
          app_fee: 50,
          deadline: '2024-12-31',
          submitted_at: null,
          notes: null,
        },
      ]
      const mockSchools = [{ id: 'school-1', name: 'Test University' }]

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnValue({
        data: mockApps,
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: mockSelect,
            eq: mockEq,
            order: mockOrder,
          } as any
        }
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnValue({
              data: mockSchools,
              error: null,
            }),
          } as any
        }
        return {} as any
      })

      const store = useApplicationsStore.getState()
      await store.fetchApplications()

      expect(store.applications).toHaveLength(1)
      expect(store.applications[0].school_name).toBe('Test University')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle authentication error', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated', status: 401 } as any,
      })

      const store = useApplicationsStore.getState()
      await store.fetchApplications()

      expect(store.error).toBe('User not authenticated')
      expect(store.loading).toBe(false)
    })
  })

  describe('createApplication', () => {
    it('should create application successfully', async () => {
      const mockApp = {
        id: 'app-new',
        school_id: 'school-1',
        status: 'planned' as const,
        app_fee: 50,
        deadline: '2024-12-31',
        submitted_at: null,
        notes: null,
      }
      const mockSchool = { id: 'school-1', name: 'Test University' }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'applications') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockApp,
              error: null,
            }),
          } as any
        }
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSchool,
              error: null,
            }),
          } as any
        }
        return {} as any
      })

      const store = useApplicationsStore.getState()
      await store.createApplication({
        school_id: 'school-1',
        status: 'planned',
        app_fee: 50,
        deadline: '2024-12-31',
      })

      expect(store.applications).toHaveLength(1)
      expect(store.applications[0].id).toBe('app-new')
      expect(store.loading).toBe(false)
    })
  })

  describe('deleteApplication', () => {
    it('should delete application successfully', async () => {
      const store = useApplicationsStore.getState()
      // Set initial state
      useApplicationsStore.setState({
        applications: [
          {
            id: 'app-1',
            school_id: 'school-1',
            school_name: 'Test University',
            status: 'planned' as const,
            app_fee: 50,
            deadline: '2024-12-31',
            submitted_at: null,
            notes: null,
          },
        ],
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      } as any)

      await store.deleteApplication('app-1')

      expect(store.applications).toHaveLength(0)
      expect(store.loading).toBe(false)
    })
  })
})

