import { useCoursesStore } from '@/store/courses'
import { calculateGPA, formatGPA } from '@/lib/gpa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import MyCourses from './prerequisites/MyCourses'

export default function Prerequisites() {
  const { courses } = useCoursesStore()
  const gpa = calculateGPA(courses)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Prerequisites</h1>
      <p className="text-muted-foreground mb-6">
        Track your prerequisite requirements and courses
      </p>

      {/* GPA Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatGPA(gpa)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {courses.filter((c) => c.completed).length} completed course
            {courses.filter((c) => c.completed).length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <MyCourses />
    </div>
  )
}

