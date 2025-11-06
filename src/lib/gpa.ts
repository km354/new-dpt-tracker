import { getNumericGrade } from './gradeMapper'
import type { Course } from '@/store/courses'

/**
 * Calculates overall GPA from an array of courses
 * Only includes completed courses with valid grades and credits
 * @param courses Array of course objects
 * @returns GPA as a number (4.0 scale) or null if no valid courses
 */
export function calculateGPA(courses: Course[]): number | null {
  if (!courses || courses.length === 0) {
    return null
  }

  let totalPoints = 0
  let totalCredits = 0

  courses.forEach((course) => {
    // Only count completed courses
    if (!course.completed) {
      return
    }

    // Get numeric grade value
    const gradePoints = getNumericGrade(course.grade)
    if (gradePoints === null) {
      return
    }

    // Get credits
    const credits = course.credits || 0
    if (credits <= 0) {
      return
    }

    // Calculate weighted points
    totalPoints += gradePoints * credits
    totalCredits += credits
  })

  // Return GPA if we have valid credits, otherwise null
  return totalCredits > 0 ? totalPoints / totalCredits : null
}

/**
 * Formats GPA for display
 * @param gpa GPA value or null
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string or "—" if null
 */
export function formatGPA(gpa: number | null, decimals: number = 2): string {
  if (gpa === null) {
    return '—'
  }
  return gpa.toFixed(decimals)
}

