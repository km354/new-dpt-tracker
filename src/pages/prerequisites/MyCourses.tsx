import { useEffect, useState } from 'react'
import { useCoursesStore } from '@/store/courses'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import CourseForm from './CourseForm'
import { formatGradeDisplay } from '@/lib/gradeMapper'
import type { Course } from '@/store/courses'

export default function MyCourses() {
  const { courses, loading, error, fetchCourses, deleteCourse } = useCoursesStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleAdd = () => {
    setEditingCourse(null)
    setFormOpen(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return
    }

    try {
      await deleteCourse(id)
    } catch (err) {
      console.error('Error deleting course:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingCourse(null)
    }
  }

  if (error) {
    return (
      <div className="text-destructive p-4">
        Error loading courses: {error}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : courses.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">
              No courses yet. Click "Add Course" to get started!
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.subject}</TableCell>
                    <TableCell>
                      {course.grade ? formatGradeDisplay(course.grade) : '—'}
                    </TableCell>
                    <TableCell>{course.credits ?? '—'}</TableCell>
                    <TableCell>{course.semester || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={course.completed ? 'default' : 'secondary'}
                      >
                        {course.completed ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CourseForm
        open={formOpen}
        onOpenChange={handleFormClose}
        course={editingCourse}
      />
    </>
  )
}

