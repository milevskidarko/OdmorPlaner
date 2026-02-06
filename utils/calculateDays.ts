import { differenceInDays, parseISO } from 'date-fns'

export function calculateDays(dateFrom: string, dateTo: string): number {
  const from = parseISO(dateFrom)
  const to = parseISO(dateTo)
  return differenceInDays(to, from) + 1 // +1 to include both start and end date
}
