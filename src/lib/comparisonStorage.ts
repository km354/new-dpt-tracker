const COMPARISON_STORAGE_KEY = 'dpt-tracker-comparison'

export interface ComparisonConfig {
  selectedSchoolIds: string[]
  schoolData: Record<
    string,
    {
      tuition?: string
      acceptanceRate?: string
    }
  >
}

export function getComparisonConfig(): ComparisonConfig {
  try {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading comparison config from localStorage:', error)
  }
  return {
    selectedSchoolIds: [],
    schoolData: {},
  }
}

export function saveComparisonConfig(config: ComparisonConfig): void {
  try {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Error saving comparison config to localStorage:', error)
  }
}

export function updateSelectedSchools(schoolIds: string[]): void {
  const config = getComparisonConfig()
  config.selectedSchoolIds = schoolIds
  saveComparisonConfig(config)
}

export function updateSchoolData(
  schoolId: string,
  data: { tuition?: string; acceptanceRate?: string }
): void {
  const config = getComparisonConfig()
  config.schoolData[schoolId] = {
    ...config.schoolData[schoolId],
    ...data,
  }
  saveComparisonConfig(config)
}

