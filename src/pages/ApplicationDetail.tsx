import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import ApplicationsList, { ApplicationsListHandle } from '@/features/applications/ApplicationsList'

interface ApplicationDetail {
  id: string
  school_id: string
  school_name: string
  status: 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected'
  app_fee: number | null
  deadline: string | null
  submitted_at: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  interview: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const applicationsListRef = useRef<ApplicationsListHandle | null>(null)

  useEffect(() => {
    if (!id || !user) return

    async function fetchApplication() {
      try {
        setLoading(true)
        setError(null)

        // Fetch application
        const { data: applicationData, error: appError } = await supabase
          .from('applications')
          .select('id, school_id, status, app_fee, deadline, submitted_at, notes, created_at, updated_at')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single()

        if (appError) throw appError
        if (!applicationData) {
          throw new Error('Application not found')
        }

        // Fetch school name
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('id, name')
          .eq('id', applicationData.school_id)
          .eq('owner_id', user.id)
          .single()

        if (schoolError) throw schoolError

        setApplication({
          id: applicationData.id,
          school_id: applicationData.school_id,
          school_name: school?.name || 'Unknown School',
          status: applicationData.status as ApplicationDetail['status'],
          app_fee: applicationData.app_fee ? Number(applicationData.app_fee) : null,
          deadline: applicationData.deadline,
          submitted_at: applicationData.submitted_at,
          notes: applicationData.notes,
          created_at: applicationData.created_at,
          updated_at: applicationData.updated_at,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch application')
        console.error('Application fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [id, user])

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleEdit = () => {
    if (applicationsListRef.current && id) {
      applicationsListRef.current.openAddDialog(id)
    }
  }

  // Listen for application updates
  useEffect(() => {
    const handleUpdate = async () => {
      if (id && user) {
        try {
          const { data: applicationData, error: appError } = await supabase
            .from('applications')
            .select('id, school_id, status, app_fee, deadline, submitted_at, notes, created_at, updated_at')
            .eq('id', id)
            .eq('owner_id', user.id)
            .single()

          if (appError || !applicationData) return

          const { data: school } = await supabase
            .from('schools')
            .select('id, name')
            .eq('id', applicationData.school_id)
            .eq('owner_id', user.id)
            .single()

          setApplication({
            id: applicationData.id,
            school_id: applicationData.school_id,
            school_name: school?.name || 'Unknown School',
            status: applicationData.status as ApplicationDetail['status'],
            app_fee: applicationData.app_fee ? Number(applicationData.app_fee) : null,
            deadline: applicationData.deadline,
            submitted_at: applicationData.submitted_at,
            notes: applicationData.notes,
            created_at: applicationData.created_at,
            updated_at: applicationData.updated_at,
          })
        } catch (err) {
          console.error('Error refetching application:', err)
        }
      }
    }

    window.addEventListener('applicationUpdated', handleUpdate)
    return () => window.removeEventListener('applicationUpdated', handleUpdate)
  }, [id, user])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/applications')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error || 'Application not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/applications')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{application.school_name}</h1>
              <p className="text-muted-foreground">Application Details</p>
            </div>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Application
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    className={cn(
                      'capitalize',
                      statusColors[application.status] || 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {application.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  School
                </label>
                <p className="mt-1 font-medium">{application.school_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Application Fee
                </label>
                <p className="mt-1">{formatCurrency(application.app_fee)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Deadline
                </label>
                <p className="mt-1">{formatDate(application.deadline)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Submitted At
                </label>
                <p className="mt-1">{formatDateTime(application.submitted_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Notes
                </label>
                <p className="mt-1 whitespace-pre-wrap">
                  {application.notes || 'No notes provided'}
                </p>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <p className="mt-1 text-sm">{formatDateTime(application.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="mt-1 text-sm">{formatDateTime(application.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog - Hidden but functional */}
      <div className="hidden">
        <ApplicationsList ref={applicationsListRef} />
      </div>
    </>
  )
}

