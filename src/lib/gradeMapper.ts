// Grade mapping from letter grades to numeric values (4.0 scale)
export const gradePoints: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
}

export const gradeOptions = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-',
  'F',
]

export function getNumericGrade(letterGrade: string | null): number | null {
  if (!letterGrade) return null
  return gradePoints[letterGrade.toUpperCase()] ?? null
}

export function formatGradeDisplay(letterGrade: string | null): string {
  if (!letterGrade) return '—'
  const numeric = getNumericGrade(letterGrade)
  return numeric !== null ? `${letterGrade} (${numeric.toFixed(1)})` : letterGrade
}

