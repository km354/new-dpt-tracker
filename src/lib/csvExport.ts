/**
 * Converts an array of objects to CSV format and downloads it
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param headers Optional custom headers mapping
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Get all unique keys from the data
  const keys = Object.keys(data[0]) as Array<keyof T>

  // Create header row
  const headerRow = keys.map((key) => headers?.[key] || String(key))

  // Create data rows
  const dataRows = data.map((row) =>
    keys.map((key) => {
      const value = row[key]
      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      // Handle dates
      if (value && typeof value === 'object' && value instanceof Date) {
        return value.toISOString().split('T')[0]
      }
      // Handle booleans
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      // Handle strings that might contain commas or quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  )

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows]
    .map((row) => row.join(','))
    .join('\n')

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

