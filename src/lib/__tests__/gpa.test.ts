import { describe, it, expect } from 'vitest'
import { calculateGPA, formatGPA } from '../gpa'
import type { Course } from '@/store/courses'

describe('GPA Calculation', () => {
  describe('calculateGPA', () => {
    it('should return null for empty array', () => {
      expect(calculateGPA([])).toBeNull()
    })

    it('should return null for no valid courses', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: null,
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBeNull()
    })

    it('should exclude incomplete courses', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 3,
          semester: null,
          completed: false,
        },
        {
          id: '2',
          subject: 'Chemistry',
          grade: 'B',
          credits: 4,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBe(3.0)
    })

    it('should calculate GPA correctly for single course', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBe(4.0)
    })

    it('should calculate weighted GPA correctly', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 3,
          semester: null,
          completed: true,
        },
        {
          id: '2',
          subject: 'Chemistry',
          grade: 'B',
          credits: 4,
          semester: null,
          completed: true,
        },
        {
          id: '3',
          subject: 'Physics',
          grade: 'A-',
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      // (4.0 * 3 + 3.0 * 4 + 3.7 * 3) / (3 + 4 + 3) = (12 + 12 + 11.1) / 10 = 3.51
      expect(calculateGPA(courses)).toBeCloseTo(3.51, 2)
    })

    it('should handle different letter grades', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Math',
          grade: 'A+',
          credits: 3,
          semester: null,
          completed: true,
        },
        {
          id: '2',
          subject: 'English',
          grade: 'C',
          credits: 3,
          semester: null,
          completed: true,
        },
        {
          id: '3',
          subject: 'History',
          grade: 'F',
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      // (4.0 * 3 + 2.0 * 3 + 0.0 * 3) / 9 = 18 / 9 = 2.0
      expect(calculateGPA(courses)).toBe(2.0)
    })

    it('should exclude courses with zero or negative credits', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 3,
          semester: null,
          completed: true,
        },
        {
          id: '2',
          subject: 'Chemistry',
          grade: 'B',
          credits: 0,
          semester: null,
          completed: true,
        },
        {
          id: '3',
          subject: 'Physics',
          grade: 'A',
          credits: -1,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBe(4.0)
    })

    it('should handle courses with null credits', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: null,
          semester: null,
          completed: true,
        },
        {
          id: '2',
          subject: 'Chemistry',
          grade: 'B',
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBe(3.0)
    })

    it('should return null if total credits is zero', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 0,
          semester: null,
          completed: true,
        },
      ]
      expect(calculateGPA(courses)).toBeNull()
    })

    it('should handle mixed completed and incomplete courses', () => {
      const courses: Course[] = [
        {
          id: '1',
          subject: 'Biology',
          grade: 'A',
          credits: 3,
          semester: null,
          completed: true,
        },
        {
          id: '2',
          subject: 'Chemistry',
          grade: 'B',
          credits: 4,
          semester: null,
          completed: false,
        },
        {
          id: '3',
          subject: 'Physics',
          grade: 'A-',
          credits: 3,
          semester: null,
          completed: true,
        },
      ]
      // (4.0 * 3 + 3.7 * 3) / 6 = (12 + 11.1) / 6 = 3.85
      expect(calculateGPA(courses)).toBeCloseTo(3.85, 2)
    })
  })

  describe('formatGPA', () => {
    it('should format GPA with 2 decimals by default', () => {
      expect(formatGPA(3.456)).toBe('3.46')
    })

    it('should format GPA with custom decimals', () => {
      expect(formatGPA(3.456, 1)).toBe('3.5')
      expect(formatGPA(3.456, 3)).toBe('3.456')
    })

    it('should return em dash for null GPA', () => {
      expect(formatGPA(null)).toBe('—')
    })

    it('should handle whole numbers', () => {
      expect(formatGPA(4.0)).toBe('4.00')
    })

    it('should handle zero GPA', () => {
      expect(formatGPA(0)).toBe('0.00')
    })
  })
})

