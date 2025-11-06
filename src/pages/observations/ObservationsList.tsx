import { useEffect, useState } from 'react'
import { useObservationsStore } from '@/store/observations'
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
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus, Download } from 'lucide-react'
import { exportToCSV } from '@/lib/csvExport'
import ObservationForm from './ObservationForm'
import type { Observation } from '@/store/observations'

export default function ObservationsList() {
  const {
    observations,
    loading,
    error,
    fetchObservations,
    deleteObservation,
    getTotalHours,
  } = useObservationsStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null)

  useEffect(() => {
    fetchObservations()
  }, [fetchObservations])

  const handleAdd = () => {
    setEditingObservation(null)
    setFormOpen(true)
  }

  const handleEdit = (observation: Observation) => {
    setEditingObservation(observation)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this observation?')) {
      return
    }

    try {
      await deleteObservation(id)
    } catch (err) {
      console.error('Error deleting observation:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete observation')
    }
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingObservation(null)
    }
  }

  const handleExport = () => {
    const exportData = observations.map((obs) => ({
      Setting: obs.setting,
      Hours: obs.hours,
      Date: obs.date,
      Supervisor: obs.supervisor || '',
      Verified: obs.verified ? 'Yes' : 'No',
      Notes: obs.notes || '',
    }))

    exportToCSV(exportData, 'observations', {
      Setting: 'Setting',
      Hours: 'Hours',
      Date: 'Date',
      Supervisor: 'Supervisor',
      Verified: 'Verified',
      Notes: 'Notes',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="text-destructive p-4">
        Error loading observations: {error}
      </div>
    )
  }

  const totalHours = getTotalHours()

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Total: {totalHours.toFixed(1)}h
            </Badge>
          </div>
          <div className="flex gap-2">
            {observations.length > 0 && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Observation
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : observations.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">
              No observations yet. Click "Add Observation" to get started!
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {observations.map((observation) => (
                  <TableRow key={observation.id}>
                    <TableCell className="font-medium">
                      {observation.setting}
                    </TableCell>
                    <TableCell>{observation.hours.toFixed(1)}h</TableCell>
                    <TableCell>{formatDate(observation.date)}</TableCell>
                    <TableCell>{observation.supervisor || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={observation.verified ? 'default' : 'secondary'}>
                        {observation.verified ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {observation.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(observation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(observation.id)}
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

      <ObservationForm
        open={formOpen}
        onOpenChange={handleFormClose}
        observation={editingObservation}
      />
    </>
  )
}

