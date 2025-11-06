import { useEffect, useState } from 'react'
import { useSchoolsStore } from '@/store/schools'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  getComparisonConfig,
  updateSelectedSchools,
  updateSchoolData,
  type ComparisonConfig,
} from '@/lib/comparisonStorage'
import { MultiSelect } from '@/components/ui/multiselect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SchoolComparisonData {
  id: string
  name: string
  location: string | null
  website: string | null
  notes: string | null
  prereqs: Array<{
    subject: string
    min_grade: string | null
    required_credits: number | null
  }>
  tuition?: string
  acceptanceRate?: string
}

export default function Comparison() {
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolsStore()
  const { user } = useAuth()
  const [comparisonConfig, setComparisonConfig] =
    useState<ComparisonConfig>(getComparisonConfig)
  const [comparisonData, setComparisonData] = useState<SchoolComparisonData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  useEffect(() => {
    loadComparisonData()
  }, [comparisonConfig.selectedSchoolIds, user])

  const loadComparisonData = async () => {
    if (comparisonConfig.selectedSchoolIds.length === 0 || !user) {
      setComparisonData([])
      return
    }

    setLoading(true)
    try {
      // Fetch schools
      const selectedSchools = schools.filter((s) =>
        comparisonConfig.selectedSchoolIds.includes(s.id)
      )

      // Fetch prereqs for selected schools
      const { data: prereqs, error: prereqsError } = await supabase
        .from('prereqs')
        .select('school_id, subject, min_grade, required_credits')
        .in('school_id', comparisonConfig.selectedSchoolIds)
        .eq('owner_id', user.id)

      if (prereqsError) throw prereqsError

      // Group prereqs by school
      const prereqsBySchool = new Map<string, typeof prereqs>()
      prereqs?.forEach((prereq) => {
        if (!prereqsBySchool.has(prereq.school_id)) {
          prereqsBySchool.set(prereq.school_id, [])
        }
        prereqsBySchool.get(prereq.school_id)?.push(prereq)
      })

      // Build comparison data
      const data: SchoolComparisonData[] = selectedSchools.map((school) => {
        const prereqsList =
          prereqsBySchool.get(school.id)?.map((p) => ({
            subject: p.subject,
            min_grade: p.min_grade,
            required_credits: p.required_credits ? Number(p.required_credits) : null,
          })) || []

        return {
          id: school.id,
          name: school.name,
          location: school.location,
          website: school.website,
          notes: school.notes,
          prereqs: prereqsList,
          tuition: comparisonConfig.schoolData[school.id]?.tuition,
          acceptanceRate: comparisonConfig.schoolData[school.id]?.acceptanceRate,
        }
      })

      setComparisonData(data)
    } catch (error) {
      console.error('Error loading comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolSelection = (selectedIds: string[]) => {
    const newConfig = { ...comparisonConfig, selectedSchoolIds: selectedIds }
    setComparisonConfig(newConfig)
    updateSelectedSchools(selectedIds)
  }

  const handleDataChange = (
    schoolId: string,
    field: 'tuition' | 'acceptanceRate',
    value: string
  ) => {
    const newConfig = {
      ...comparisonConfig,
      schoolData: {
        ...comparisonConfig.schoolData,
        [schoolId]: {
          ...comparisonConfig.schoolData[schoolId],
          [field]: value,
        },
      },
    }
    setComparisonConfig(newConfig)
    updateSchoolData(schoolId, { [field]: value })
    
    // Update local comparison data
    setComparisonData((prev) =>
      prev.map((school) =>
        school.id === schoolId ? { ...school, [field]: value } : school
      )
    )
  }

  const handleRemoveSchool = (schoolId: string) => {
    const newSelected = comparisonConfig.selectedSchoolIds.filter(
      (id) => id !== schoolId
    )
    handleSchoolSelection(newSelected)
  }

  const schoolOptions = schools.map((school) => ({
    value: school.id,
    label: school.name,
  }))

  if (schoolsLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Program Comparison</h1>
        <p className="text-muted-foreground mb-6">
          Compare different DPT programs
        </p>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Program Comparison</h1>
      <p className="text-muted-foreground mb-6">
        Compare different DPT programs side-by-side
      </p>

      <div className="mb-6">
        <Label htmlFor="school-select" className="mb-2 block">
          Select Schools to Compare
        </Label>
        <MultiSelect
          options={schoolOptions}
          selected={comparisonConfig.selectedSchoolIds}
          onChange={handleSchoolSelection}
          placeholder="Select schools to compare..."
          className="w-full"
        />
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : comparisonData.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            Select schools from the dropdown above to start comparing
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Criteria</TableHead>
                {comparisonData.map((school) => (
                  <TableHead key={school.id} className="min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{school.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveSchool(school.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Tuition */}
              <TableRow>
                <TableCell className="font-medium">Tuition</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    <Input
                      type="text"
                      placeholder="$0.00"
                      value={school.tuition || ''}
                      onChange={(e) =>
                        handleDataChange(school.id, 'tuition', e.target.value)
                      }
                      className="w-full"
                    />
                  </TableCell>
                ))}
              </TableRow>

              {/* Acceptance Rate */}
              <TableRow>
                <TableCell className="font-medium">Acceptance Rate</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    <Input
                      type="text"
                      placeholder="0%"
                      value={school.acceptanceRate || ''}
                      onChange={(e) =>
                        handleDataChange(
                          school.id,
                          'acceptanceRate',
                          e.target.value
                        )
                      }
                      className="w-full"
                    />
                  </TableCell>
                ))}
              </TableRow>

              {/* Location */}
              <TableRow>
                <TableCell className="font-medium">Location</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    {school.location || '—'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Website */}
              <TableRow>
                <TableCell className="font-medium">Website</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    {school.website ? (
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {school.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Prerequisites */}
              <TableRow>
                <TableCell className="font-medium">Prerequisites</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    {school.prereqs.length > 0 ? (
                      <div className="space-y-1">
                        {school.prereqs.map((prereq, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">{prereq.subject}</div>
                            {(prereq.min_grade || prereq.required_credits) && (
                              <div className="text-xs text-muted-foreground">
                                {prereq.min_grade && (
                                  <span>Min Grade: {prereq.min_grade}</span>
                                )}
                                {prereq.min_grade && prereq.required_credits && (
                                  <span> • </span>
                                )}
                                {prereq.required_credits && (
                                  <span>{prereq.required_credits} credits</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Notes */}
              <TableRow>
                <TableCell className="font-medium">Notes</TableCell>
                {comparisonData.map((school) => (
                  <TableCell key={school.id}>
                    <div className="max-w-xs text-sm">
                      {school.notes || '—'}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

