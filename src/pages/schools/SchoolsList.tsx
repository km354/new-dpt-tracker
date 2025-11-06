import { useEffect, useState } from 'react'
import { useSchoolsStore } from '@/store/schools'
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
import { Edit, Trash2, Plus, ExternalLink, Upload } from 'lucide-react'
import SchoolForm from './SchoolForm'
import BulkImport from './BulkImport'
import type { School } from '@/store/schools'

export default function SchoolsList() {
  const { schools, loading, error, fetchSchools, deleteSchool } = useSchoolsStore()
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  const handleAdd = () => {
    setEditingSchool(null)
    setFormOpen(true)
  }

  const handleEdit = (school: School) => {
    setEditingSchool(school)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school? This will also delete all associated applications.')) {
      return
    }

    try {
      await deleteSchool(id)
    } catch (err) {
      console.error('Error deleting school:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete school')
    }
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingSchool(null)
    }
  }

  if (error) {
    return (
      <div className="text-destructive p-4">
        Error loading schools: {error}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : schools.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">
              No schools yet. Click "Add School" to get started!
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>DPT Program</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.location || '—'}</TableCell>
                    <TableCell>
                      {school.dpt_program_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={school.dpt_program_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            View Program
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {school.website ? (
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Website
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {school.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(school)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(school.id)}
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

      <SchoolForm
        open={formOpen}
        onOpenChange={handleFormClose}
        school={editingSchool}
      />

      <BulkImport
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </>
  )
}

