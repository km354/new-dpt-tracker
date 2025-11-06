import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Course {
  id: string
  subject: string
  grade: string | null
  credits: number | null
  semester: string | null
  completed: boolean
}

interface CoursesState {
  courses: Course[]
  loading: boolean
  error: string | null

  // Actions
  fetchCourses: () => Promise<void>
  createCourse: (data: {
    subject: string
    grade?: string | null
    credits?: number | null
    semester?: string | null
    completed?: boolean
  }) => Promise<void>
  updateCourse: (id: string, data: {
    subject?: string
    grade?: string | null
    credits?: number | null
    semester?: string | null
    completed?: boolean
  }) => Promise<void>
  deleteCourse: (id: string) => Promise<void>
  reset: () => void
}

export const useCoursesStore = create<CoursesState>((set) => ({
  courses: [],
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, subject, grade, credits, semester, completed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      set({
        courses:
          courses?.map((c: { id: string; subject: string; grade: string | null; credits: number | null; semester: string | null; completed: boolean }) => ({
            id: c.id,
            subject: c.subject,
            grade: c.grade,
            credits: c.credits ? Number(c.credits) : null,
            semester: c.semester,
            completed: c.completed,
          })) || [],
        loading: false,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses'
      set({ error: errorMessage, loading: false })
      console.error('Courses fetch error:', err)
    }
  },

  createCourse: async (data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Create course
      const { data: course, error: createError } = await supabase
        .from('courses')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      // Add to state
      set((state) => ({
        courses: [
          {
            id: course.id,
            subject: course.subject,
            grade: course.grade,
            credits: course.credits ? Number(course.credits) : null,
            semester: course.semester,
            completed: course.completed,
          },
          ...state.courses,
        ],
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course'
      set({ error: errorMessage, loading: false })
      console.error('Course create error:', err)
      throw err
    }
  },

  updateCourse: async (id, data) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update course
      const { data: course, error: updateError } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update in state
      set((state) => ({
        courses: state.courses.map((c) =>
          c.id === id
            ? {
                id: course.id,
                subject: course.subject,
                grade: course.grade,
                credits: course.credits ? Number(course.credits) : null,
                semester: course.semester,
                completed: course.completed,
              }
            : c
        ),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course'
      set({ error: errorMessage, loading: false })
      console.error('Course update error:', err)
      throw err
    }
  },

  deleteCourse: async (id) => {
    set({ loading: true, error: null })

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Delete course
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Remove from state
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course'
      set({ error: errorMessage, loading: false })
      console.error('Course delete error:', err)
      throw err
    }
  },

  reset: () => {
    set({ courses: [], loading: false, error: null })
  },
}))

