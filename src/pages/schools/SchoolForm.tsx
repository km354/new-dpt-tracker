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
import { useSchoolsStore } from '@/store/schools'
import type { School } from '@/store/schools'

const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required').max(200, 'Name must be less than 200 characters'),
  location: z.string().max(200, 'Location must be less than 200 characters').optional().nullable(),
  website: z
    .union([
      z.string().url('Must be a valid URL'),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  dpt_program_url: z
    .union([
      z.string().url('Must be a valid URL'),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),
})

type SchoolFormData = z.infer<typeof schoolSchema>

interface SchoolFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  school?: School | null
}

export default function SchoolForm({ open, onOpenChange, school }: SchoolFormProps) {
  const { createSchool, updateSchool, loading } = useSchoolsStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      location: null,
      website: null,
      dpt_program_url: null,
      notes: null,
    },
  })

  // Reset form when dialog opens/closes or school changes
  useEffect(() => {
    if (open) {
      if (school) {
        setValue('name', school.name)
        setValue('location', school.location || null)
        setValue('website', school.website || null)
        setValue('dpt_program_url', school.dpt_program_url || null)
        setValue('notes', school.notes || null)
      } else {
        reset({
          name: '',
          location: null,
          website: null,
          dpt_program_url: null,
          notes: null,
        })
      }
    }
  }, [open, school, reset, setValue])

  const onSubmit = async (data: SchoolFormData) => {
    try {
      const payload = {
        name: data.name,
        location: data.location || null,
        website: data.website || null,
        dpt_program_url: data.dpt_program_url || null,
        notes: data.notes || null,
      }

      if (school) {
        await updateSchool(school.id, payload)
      } else {
        await createSchool(payload)
      }

      onOpenChange(false)
      reset()
    } catch (err) {
      console.error('Error saving school:', err)
      // Error is handled by the store
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{school ? 'Edit School' : 'Add School'}</DialogTitle>
          <DialogDescription>
            {school
              ? 'Update school information'
              : 'Add a new school to your list'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                School Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="University Name"
                disabled={isSubmitting || loading}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="City, State"
                disabled={isSubmitting || loading}
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">General Website</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://university.edu"
                disabled={isSubmitting || loading}
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dpt_program_url">DPT Program Page URL</Label>
              <Input
                id="dpt_program_url"
                type="url"
                {...register('dpt_program_url')}
                placeholder="https://university.edu/dpt-program"
                disabled={isSubmitting || loading}
                className={errors.dpt_program_url ? 'border-destructive' : ''}
              />
              {errors.dpt_program_url && (
                <p className="text-sm text-destructive">{errors.dpt_program_url.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Direct link to the DPT program's admissions/requirements page
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about this school..."
                disabled={isSubmitting || loading}
                rows={4}
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.notes ? 'border-destructive' : ''
                }`}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
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
                : school
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

