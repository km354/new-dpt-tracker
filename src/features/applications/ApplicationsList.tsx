import { useState, useImperativeHandle, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { useSchools } from '@/hooks/useSchools'
import { useAuth } from '@/hooks/useAuth'
import { createApplication, updateApplication, deleteApplication } from '@/lib/applications'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  interview: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export interface ApplicationsListHandle {
  openAddDialog: (applicationId?: string) => void
}

const ApplicationsList = forwardRef<ApplicationsListHandle>((_props, ref) => {
  const { applications, loading, error, refetch } = useApplications()
  const { schools, loading: schoolsLoading } = useSchools()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    school_id: '',
    status: 'planned' as 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected',
    app_fee: '',
    deadline: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleOpenDialog = (applicationId?: string) => {
    if (applicationId) {
      const app = applications.find((a) => a.id === applicationId)
      if (app) {
        setEditingApplication(applicationId)
        setFormData({
          school_id: app.school_id,
          status: app.status,
          app_fee: app.app_fee?.toString() || '',
          deadline: app.deadline || '',
          notes: app.notes || '',
        })
      }
    } else {
      setEditingApplication(null)
      setFormData({
        school_id: '',
        status: 'planned',
        app_fee: '',
        deadline: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }


  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingApplication(null)
    setFormData({
      school_id: '',
      status: 'planned',
      app_fee: '',
      deadline: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const payload = {
        school_id: formData.school_id,
        status: formData.status,
        app_fee: formData.app_fee ? parseFloat(formData.app_fee) : null,
        deadline: formData.deadline || null,
        notes: formData.notes || null,
      }

      if (editingApplication) {
        await updateApplication(user, {
          id: editingApplication,
          ...payload,
        })
      } else {
        await createApplication(user, payload)
      }

      await refetch()
      handleCloseDialog()
      // Trigger a custom event to notify parent components
      window.dispatchEvent(new CustomEvent('applicationUpdated'))
    } catch (err) {
      console.error('Error saving application:', err)
      alert(err instanceof Error ? err.message : 'Failed to save application')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this application?')) return

    try {
      await deleteApplication(user, id)
      await refetch()
    } catch (err) {
      console.error('Error deleting application:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete application')
    }
  }

  useImperativeHandle(ref, () => ({
    openAddDialog: (applicationId?: string) => handleOpenDialog(applicationId),
  }))

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="text-destructive p-4">
        Error loading applications: {error}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : applications.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">
              No applications yet. Click "Add Application" to get started!
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/applications/${application.id}`}
                        className="hover:underline text-primary"
                      >
                        {application.school_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'capitalize',
                          statusColors[application.status] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(application.deadline)}</TableCell>
                    <TableCell>{formatCurrency(application.app_fee)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(application.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(application.id)}
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

      {/* Add/Edit Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingApplication ? 'Edit Application' : 'Add Application'}
            </DialogTitle>
            <DialogDescription>
              {editingApplication
                ? 'Update application details'
                : 'Create a new application for a school'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="school_id">School *</Label>
                <Select
                  id="school_id"
                  value={formData.school_id}
                  onChange={(e) =>
                    setFormData({ ...formData, school_id: e.target.value })
                  }
                  required
                  disabled={schoolsLoading || submitting}
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
                {schools.length === 0 && !schoolsLoading && (
                  <p className="text-sm text-muted-foreground">
                    No schools found. Please add a school first.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as typeof formData.status,
                    })
                  }
                  required
                  disabled={submitting}
                >
                  <option value="planned">Planned</option>
                  <option value="submitted">Submitted</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="app_fee">Application Fee ($)</Label>
                <Input
                  id="app_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.app_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, app_fee: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  disabled={submitting}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || schoolsLoading}>
                {submitting
                  ? 'Saving...'
                  : editingApplication
                    ? 'Update'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
    </>
  )
})

ApplicationsList.displayName = 'ApplicationsList'

export default ApplicationsList

