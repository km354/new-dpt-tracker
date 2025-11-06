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

      // First, deduplicate schools by name (case-insensitive)
      const uniqueSchools = new Map<string, typeof data.schools[0]>()
      for (const schoolData of data.schools) {
        if (!schoolData.name || schoolData.name.trim() === '') {
          continue
        }
        const key = schoolData.name.trim().toLowerCase()
        // Keep the first occurrence, or merge data if later one has more info
        if (!uniqueSchools.has(key)) {
          uniqueSchools.set(key, schoolData)
        } else {
          // Merge: prefer non-null values
          const existing = uniqueSchools.get(key)!
          uniqueSchools.set(key, {
            name: schoolData.name,
            location: schoolData.location || existing.location || null,
            website: schoolData.website || existing.website || null,
            dpt_program_url: schoolData.dpt_program_url || existing.dpt_program_url || null,
            notes: schoolData.notes || existing.notes || null,
          })
        }
      }

      // Import unique schools
      for (const schoolData of uniqueSchools.values()) {
        // Check if school already exists first
        const { data: existingSchools } = await supabase
          .from('schools')
          .select('id, name')
          .eq('name', schoolData.name.trim())
          .eq('owner_id', user.id)
          .limit(1)

        if (existingSchools && existingSchools.length > 0) {
          // School already exists, use it
          schoolNameMap.set(schoolData.name.trim(), existingSchools[0].id)
          continue
        }

        // Clean and validate URLs
        let website = schoolData.website || null
        if (website && (website.includes('google.com/search') || !website.startsWith('http'))) {
          website = null
        }

        let dptUrl = schoolData.dpt_program_url || null
        if (dptUrl) {
          if (dptUrl.includes('google.com/search')) {
            dptUrl = null
          } else if (!dptUrl.startsWith('http')) {
            dptUrl = null
          }
        }
        // If no DPT URL but we have a website, use website as fallback
        if (!dptUrl && website) {
          dptUrl = website
        }

        // Create new school
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: schoolData.name.trim(),
            location: schoolData.location || null,
            website: website,
            dpt_program_url: dptUrl,
            notes: schoolData.notes || null,
            owner_id: user.id,
          })
          .select()
          .single()

        if (schoolError) {
          console.warn('Error creating school:', schoolData.name, schoolError)
          continue
        }

        if (school) {
          schoolNameMap.set(schoolData.name.trim(), school.id)
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
    // Handle different line endings (Windows vs Unix)
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalizedText.split('\n').filter((line) => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    // Detect delimiter (tab or comma) - check first few lines
    let hasTabs = false
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].includes('\t')) {
        hasTabs = true
        break
      }
    }
    const delimiter = hasTabs ? '\t' : ','

    // Parse header row properly (handle quoted fields)
    const headerValues = parseCSVLine(lines[0], delimiter)
    const headers = headerValues.map((h) => h.trim().toLowerCase())
    
    // Debug: log headers to console
    console.log('CSV Headers found:', headers)
    console.log('First data row:', parseCSVLine(lines[1] || '', delimiter))
    
    const schools: BulkImportData['schools'] = []
    const prerequisites: BulkImportData['prerequisites'] = []
    const seen = new Set<string>()

    // Find column indices for common variations
    // Prioritize columns with both "school" and "name" (like "School Name (CAPTE)")
    let nameIdx = headers.findIndex((h) => 
      h.includes('school') && h.includes('name')
    )
    if (nameIdx === -1) {
      nameIdx = headers.findIndex((h) => 
        h.includes('name') && !h.includes('school_name') && !h.includes('previous')
      )
    }
    
    // Debug: log which column was selected
    console.log('Name column index:', nameIdx, headers[nameIdx] || 'NOT FOUND')
    const cityIdx = headers.findIndex((h) => h === 'city')
    const stateIdx = headers.findIndex((h) => h === 'state')
    const locationIdx = headers.findIndex((h) => h === 'location')
    const websiteIdx = headers.findIndex((h) => 
      h === 'website' || h === 'primary link' || h.includes('primary') || h.includes('link')
    )
    const dptUrlIdx = headers.findIndex((h) => 
      (h.includes('dpt') && h.includes('url')) || 
      (h.includes('ptcas') && h.includes('url')) ||
      h.includes('program url')
    )
    const notesIdx = headers.findIndex((h) => h === 'notes')

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter)
      
      // Skip if row doesn't have enough columns
      if (values.length < headers.length) {
        console.warn(`Row ${i} has fewer columns than headers, skipping`)
        continue
      }
      
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Get school name - prioritize "School Name (CAPTE)" format
      let name = ''
      if (nameIdx >= 0 && nameIdx < values.length && values[nameIdx]) {
        name = values[nameIdx].trim()
      } else {
        // Try alternative column names
        name = (
          row['school name (capte)'] ||
          row['capte::account name'] ||
          row.name ||
          ''
        ).trim()
      }

      // Debug first few rows
      if (i <= 3) {
        console.log(`Row ${i} parsed:`, {
          name,
          nameIdx,
          allValues: values.slice(0, 5),
          headers: headers.slice(0, 5)
        })
      }

      // Skip if name is empty, "nan", or too short
      if (!name || name === 'nan' || name.length < 3) continue
      
      // Skip rows that don't look like school names
      // Skip if it starts with a date pattern like "(05/2009-" or "(2004 - present)"
      if (name.match(/^\(\d{2}\/\d{4}/) || name.match(/^\(\d{4}\s*-/)) {
        console.log(`Skipping row ${i}: date pattern - ${name}`)
        continue
      }
      // Skip if it's just a number or address-like (starts with number followed by street name)
      if (name.match(/^\d+\s+(Backbone|Morrow|Technology|Rd\.|Way|Drive|CN)/i) && !name.match(/University|College|School|Institute/i)) {
        console.log(`Skipping row ${i}: address pattern - ${name}`)
        continue
      }
      // Skip if it's clearly not a school (looks like dates, accreditation info, etc.)
      if (name.match(/^(Spring|Fall)\s+\d{4}$/i)) {
        console.log(`Skipping row ${i}: date pattern - ${name}`)
        continue
      }
      if (name.match(/^Accreditation|Non-Accreditation/i)) {
        console.log(`Skipping row ${i}: accreditation status - ${name}`)
        continue
      }
      // Skip if it contains multiple comma-separated values that look like CSV parsing errors
      // But allow if it contains school-related keywords
      if (name.split(',').length > 3 && !name.match(/University|College|School|Institute|PT/i)) {
        console.log(`Skipping row ${i}: multiple commas - ${name}`)
        continue
      }
      // Skip if it's just a location/address without school name
      if (name.match(/^[A-Z]{2}\s+[A-Z]{2}$/) && name.length < 10) {
        console.log(`Skipping row ${i}: location code - ${name}`)
        continue
      }
      // More lenient: require school-related keywords OR be at least 10 characters
      // This allows for valid school names that might not have obvious keywords
      if (name.length < 10 && !name.match(/University|College|School|Institute|PT|Program|Center|Academy|Medical/i)) {
        console.log(`Skipping row ${i}: too short and no keywords - ${name}`)
        continue
      }
      
      // Skip duplicates
      const key = name.toLowerCase().trim()
      if (seen.has(key)) continue
      seen.add(key)

      // Build location from City and State columns
      let location: string | null = null
      if (locationIdx >= 0 && values[locationIdx] && values[locationIdx].trim()) {
        location = values[locationIdx].trim()
      } else if (cityIdx >= 0 || stateIdx >= 0) {
        const city = (cityIdx >= 0 && values[cityIdx] ? values[cityIdx].trim() : '').trim()
        const state = (stateIdx >= 0 && values[stateIdx] ? values[stateIdx].trim() : '').trim()
        if (city || state) {
          location = [city, state].filter(Boolean).join(', ') || null
        }
      }

      // Get website - clean and validate
      let website: string | null = null
      if (websiteIdx >= 0 && values[websiteIdx]) {
        let url = values[websiteIdx].trim()
        // Remove Google search URLs
        if (url && !url.includes('google.com/search') && url.startsWith('http')) {
          website = url
        }
      }

      // Get DPT program URL - prefer real PTCAS directory URLs
      let dptUrl: string | null = null
      if (dptUrlIdx >= 0 && values[dptUrlIdx]) {
        let url = values[dptUrlIdx].trim()
        if (url && url.includes('ptcasdirectory.apta.org')) {
          dptUrl = url
        } else if (url && url.startsWith('http') && !url.includes('google.com/search')) {
          // Use as fallback if it's a valid URL
          dptUrl = url
        }
      }
      // If no DPT URL but we have a website, use website as fallback
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

