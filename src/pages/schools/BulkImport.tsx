import { useState } from 'react'
import { useSchoolsStore } from '@/store/schools'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface BulkImportData {
  schools: Array<{
    name: string
    location?: string | null
    website?: string | null
    dpt_program_url?: string | null
    notes?: string | null
  }>
  prerequisites?: Array<{
    school_name: string
    subject: string
    min_grade?: string | null
    required_credits?: number | null
  }>
}

interface BulkImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BulkImport({ open, onOpenChange }: BulkImportProps) {
  const { user } = useAuth()
  const { fetchSchools } = useSchoolsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [importStats, setImportStats] = useState({ schools: 0, prerequisites: 0 })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(false)
    setImportStats({ schools: 0, prerequisites: 0 })

    try {
      const text = await file.text()
      let data: BulkImportData

      // Try to parse as JSON first
      try {
        data = JSON.parse(text)
      } catch {
        // If not JSON, try CSV
        data = parseCSV(text)
      }

      if (!data.schools || !Array.isArray(data.schools)) {
        throw new Error('Invalid format: schools array is required')
      }

      if (!user) {
        throw new Error('User not authenticated')
      }

      let schoolsCreated = 0
      let prerequisitesCreated = 0
      const schoolNameMap = new Map<string, string>() // school_name -> school_id

      // Import schools
      for (const schoolData of data.schools) {
        if (!schoolData.name) {
          console.warn('Skipping school with no name:', schoolData)
          continue
        }

        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: schoolData.name,
            location: schoolData.location || null,
            website: schoolData.website || null,
            dpt_program_url: schoolData.dpt_program_url || null,
            notes: schoolData.notes || null,
            owner_id: user.id,
          })
          .select()
          .single()

        if (schoolError) {
          // If school already exists, try to find it
          const { data: existingSchool } = await supabase
            .from('schools')
            .select('id')
            .eq('name', schoolData.name)
            .eq('owner_id', user.id)
            .single()

          if (existingSchool) {
            schoolNameMap.set(schoolData.name, existingSchool.id)
            continue
          }
          throw schoolError
        }

        if (school) {
          schoolNameMap.set(schoolData.name, school.id)
          schoolsCreated++
        }
      }

      // Import prerequisites if provided
      if (data.prerequisites && Array.isArray(data.prerequisites)) {
        for (const prereqData of data.prerequisites) {
          if (!prereqData.school_name || !prereqData.subject) {
            console.warn('Skipping prerequisite with missing data:', prereqData)
            continue
          }

          const schoolId = schoolNameMap.get(prereqData.school_name)
          if (!schoolId) {
            console.warn(`School "${prereqData.school_name}" not found for prerequisite`)
            continue
          }

          const { error: prereqError } = await supabase
            .from('prereqs')
            .insert({
              school_id: schoolId,
              subject: prereqData.subject,
              min_grade: prereqData.min_grade || null,
              required_credits: prereqData.required_credits || null,
              owner_id: user.id,
            })

          if (prereqError) {
            console.warn('Error creating prerequisite:', prereqError)
            continue
          }

          prerequisitesCreated++
        }
      }

      setImportStats({ schools: schoolsCreated, prerequisites: prerequisitesCreated })
      setSuccess(true)
      await fetchSchools()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data')
      console.error('Import error:', err)
    } finally {
      setLoading(false)
    }
  }

  const parseCSV = (csvText: string): BulkImportData => {
    const lines = csvText.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    // Detect delimiter (tab or comma)
    const hasTabs = lines[0].includes('\t')
    const delimiter = hasTabs ? '\t' : ','

    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())
    const schools: BulkImportData['schools'] = []
    const prerequisites: BulkImportData['prerequisites'] = []
    const seen = new Set<string>()

    // Find column indices for common variations
    const nameIdx = headers.findIndex((h) => 
      h.includes('name') && !h.includes('school_name') && !h.includes('previous')
    )
    const cityIdx = headers.findIndex((h) => h === 'city')
    const stateIdx = headers.findIndex((h) => h === 'state')
    const locationIdx = headers.findIndex((h) => h === 'location')
    const websiteIdx = headers.findIndex((h) => 
      h === 'website' || h === 'primary link' || h.includes('primary')
    )
    const dptUrlIdx = headers.findIndex((h) => 
      (h.includes('dpt') && h.includes('url')) || 
      h.includes('ptcas url') && !h.includes('search')
    )
    const notesIdx = headers.findIndex((h) => h === 'notes')

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter)
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Get school name - try multiple column formats
      const name = 
        (nameIdx >= 0 ? values[nameIdx] : '') ||
        row.name ||
        row['school name (capte)'] ||
        row['capte::account name'] ||
        ''

      if (!name || name.trim() === '' || name === 'nan') continue

      // Skip duplicates
      const key = name.toLowerCase().trim()
      if (seen.has(key)) continue
      seen.add(key)

      // Build location
      let location: string | null = null
      if (locationIdx >= 0 && values[locationIdx]) {
        location = values[locationIdx]
      } else if (cityIdx >= 0 || stateIdx >= 0) {
        const city = cityIdx >= 0 ? values[cityIdx] : ''
        const state = stateIdx >= 0 ? values[stateIdx] : ''
        location = [city, state].filter(Boolean).join(', ') || null
      }

      // Get website
      let website: string | null = null
      if (websiteIdx >= 0 && values[websiteIdx]) {
        const url = values[websiteIdx]
        if (url && !url.includes('google.com/search')) {
          website = url
        }
      }

      // Get DPT program URL
      let dptUrl: string | null = null
      if (dptUrlIdx >= 0 && values[dptUrlIdx]) {
        const url = values[dptUrlIdx]
        if (url.includes('ptcasdirectory.apta.org')) {
          dptUrl = url
        }
      }
      if (!dptUrl && website) {
        dptUrl = website
      }

      const notes = notesIdx >= 0 ? values[notesIdx] : null

      schools.push({
        name: name.trim(),
        location: location,
        website: website,
        dpt_program_url: dptUrl,
        notes: notes,
      })
    }

    return { schools, prerequisites }
  }

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim()) // Add last value
    return values
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSuccess(false)
      setImportStats({ schools: 0, prerequisites: 0 })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Schools</DialogTitle>
          <DialogDescription>
            Import multiple schools and prerequisites from a JSON or CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Import Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">Import Successful!</p>
              <p className="text-sm text-green-700 mt-1">
                {importStats.schools} school{importStats.schools !== 1 ? 's' : ''} imported
                {importStats.prerequisites > 0 &&
                  `, ${importStats.prerequisites} prerequisite${importStats.prerequisites !== 1 ? 's' : ''} imported`}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file-upload">Import File (JSON or CSV)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <input
                id="file-upload"
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Importing...' : 'Choose File'}
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                JSON or CSV format supported
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold">Expected Format (JSON):</p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{
  "schools": [
    {
      "name": "University Name",
      "location": "City, State",
      "website": "https://...",
      "dpt_program_url": "https://...",
      "notes": "..."
    }
  ],
  "prerequisites": [
    {
      "school_name": "University Name",
      "subject": "Anatomy",
      "min_grade": "B",
      "required_credits": 3
    }
  ]
}`}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {success ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

