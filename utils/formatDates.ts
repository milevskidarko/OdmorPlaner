import { format, parseISO } from 'date-fns'

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd MMM yyyy')
}

export function formatDateRange(dateFrom: string, dateTo: string): string {
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
}
