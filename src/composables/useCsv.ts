import type { GridColumn, GridRow } from '../types'

function escapeCsvField(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function rowsToCsv(columns: GridColumn[], rows: GridRow[]): string {
  const header = columns.map((c) => escapeCsvField(c.label ?? c.key)).join(',')
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(row.data[c.key])).join(','))

  return [header, ...lines].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()

  URL.revokeObjectURL(url)
}

/**
 * Parses a CSV string produced by (or shaped like) `rowsToCsv`'s output for the given
 * columns - positional, skips the header row - into plain data objects keyed by column.key.
 */
export function csvToRowData(csv: string, columns: GridColumn[]): Record<string, string>[] {
  const [, ...dataRows] = parseCsv(csv)

  return dataRows
    .filter((cells) => cells.length > 1 || cells[0] !== '')
    .map((cells) => {
      const data: Record<string, string> = {}
      columns.forEach((c, i) => {
        data[c.key] = cells[i] ?? ''
      })
      return data
    })
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
