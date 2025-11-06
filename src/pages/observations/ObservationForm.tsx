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
import { useObservationsStore } from '@/store/observations'
import type { Observation } from '@/store/observations'

const observationSchema = z.object({
  setting: z.string().min(1, 'Setting is required').max(200, 'Setting must be less than 200 characters'),
  hours: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val
      return isNaN(num) ? 0 : num
    })
    .refine((val) => val > 0, 'Hours must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  supervisor: z.string().max(200, 'Supervisor must be less than 200 characters').optional().nullable(),
  verified: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),
})

type ObservationFormData = z.infer<typeof observationSchema>

interface ObservationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  observation?: Observation | null
}

export default function ObservationForm({ open, onOpenChange, observation }: ObservationFormProps) {
  const { createObservation, updateObservation, loading } = useObservationsStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ObservationFormData>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      setting: '',
      hours: 0,
      date: new Date().toISOString().split('T')[0],
      supervisor: null,
      verified: false,
      notes: null,
    },
  })

  // Reset form when dialog opens/closes or observation changes
  useEffect(() => {
    if (open) {
      if (observation) {
        setValue('setting', observation.setting)
        setValue('hours', observation.hours)
        setValue('date', observation.date)
        setValue('supervisor', observation.supervisor || null)
        setValue('verified', observation.verified)
        setValue('notes', observation.notes || null)
      } else {
        reset({
          setting: '',
          hours: 0,
          date: new Date().toISOString().split('T')[0],
          supervisor: null,
          verified: false,
          notes: null,
        })
      }
    }
  }, [open, observation, reset, setValue])

  const onSubmit = async (data: ObservationFormData) => {
    try {
      const payload = {
        setting: data.setting,
        hours: data.hours,
        date: data.date,
        supervisor: data.supervisor || null,
        verified: data.verified,
        notes: data.notes || null,
      }

      if (observation) {
        await updateObservation(observation.id, payload)
      } else {
        await createObservation(payload)
      }

      onOpenChange(false)
      reset()
    } catch (err) {
      console.error('Error saving observation:', err)
      // Error is handled by the store
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{observation ? 'Edit Observation' : 'Add Observation'}</DialogTitle>
          <DialogDescription>
            {observation
              ? 'Update observation information'
              : 'Record a new observation session'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="setting">
                Setting <span className="text-destructive">*</span>
              </Label>
              <Input
                id="setting"
                {...register('setting')}
                placeholder="e.g., Hospital, Outpatient Clinic, School"
                disabled={isSubmitting || loading}
                className={errors.setting ? 'border-destructive' : ''}
              />
              {errors.setting && (
                <p className="text-sm text-destructive">{errors.setting.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hours">
                Hours <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="0.0"
                {...register('hours')}
                disabled={isSubmitting || loading}
                className={errors.hours ? 'border-destructive' : ''}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">{errors.hours.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                disabled={isSubmitting || loading}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supervisor">Supervisor</Label>
              <Input
                id="supervisor"
                {...register('supervisor')}
                placeholder="Supervisor name"
                disabled={isSubmitting || loading}
                className={errors.supervisor ? 'border-destructive' : ''}
              />
              {errors.supervisor && (
                <p className="text-sm text-destructive">{errors.supervisor.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                {...register('verified')}
                disabled={isSubmitting || loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="verified" className="font-normal cursor-pointer">
                Verified
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about this observation..."
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
                : observation
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

