import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useCoursesStore } from '@/store/courses'
import { gradeOptions, getNumericGrade } from '@/lib/gradeMapper'
import type { Course } from '@/store/courses'

const courseSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  grade: z.string().optional().nullable(),
  credits: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null
      const num = typeof val === 'string' ? parseFloat(val) : val
      return isNaN(num) ? null : num
    }),
  semester: z.string().max(100, 'Semester must be less than 100 characters').optional().nullable(),
  completed: z.boolean().default(false),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course | null
}

export default function CourseForm({ open, onOpenChange, course }: CourseFormProps) {
  const { createCourse, updateCourse, loading } = useCoursesStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      subject: '',
      grade: null,
      credits: null,
      semester: null,
      completed: false,
    },
  })

  const selectedGrade = watch('grade')

  // Reset form when dialog opens/closes or course changes
  useEffect(() => {
    if (open) {
      if (course) {
        setValue('subject', course.subject)
        setValue('grade', course.grade || null)
        setValue('credits', course.credits || null)
        setValue('semester', course.semester || null)
        setValue('completed', course.completed)
      } else {
        reset({
          subject: '',
          grade: null,
          credits: null,
          semester: null,
          completed: false,
        })
      }
    }
  }, [open, course, reset, setValue])

  const onSubmit = async (data: CourseFormData) => {
    try {
      const payload = {
        subject: data.subject,
        grade: data.grade || null,
        credits: data.credits,
        semester: data.semester || null,
        completed: data.completed,
      }

      if (course) {
        await updateCourse(course.id, payload)
      } else {
        await createCourse(payload)
      }

      onOpenChange(false)
      reset()
    } catch (err) {
      console.error('Error saving course:', err)
      // Error is handled by the store
    }
  }

  const numericGrade = selectedGrade ? getNumericGrade(selectedGrade) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course information' : 'Add a new course to your transcript'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="e.g., Biology, Chemistry"
                disabled={isSubmitting || loading}
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade">Grade</Label>
              <div className="flex gap-2">
                <Select
                  id="grade"
                  {...register('grade')}
                  disabled={isSubmitting || loading}
                  className={errors.grade ? 'border-destructive flex-1' : 'flex-1'}
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </Select>
                {numericGrade !== null && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                    {numericGrade.toFixed(1)}
                  </div>
                )}
              </div>
              {errors.grade && (
                <p className="text-sm text-destructive">{errors.grade.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                step="0.5"
                min="0"
                placeholder="3.0"
                {...register('credits')}
                disabled={isSubmitting || loading}
                className={errors.credits ? 'border-destructive' : ''}
              />
              {errors.credits && (
                <p className="text-sm text-destructive">{errors.credits.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                {...register('semester')}
                placeholder="Fall 2023, Spring 2024, etc."
                disabled={isSubmitting || loading}
                className={errors.semester ? 'border-destructive' : ''}
              />
              {errors.semester && (
                <p className="text-sm text-destructive">{errors.semester.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="completed"
                {...register('completed')}
                disabled={isSubmitting || loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="completed" className="font-normal cursor-pointer">
                Completed
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading
                ? 'Saving...'
                : course
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

