import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './formatDates'

export interface VacationReportData {
  employeeName: string
  dateFrom: string
  dateTo: string
  type: string
  days: number
  status: string
}

export function generateMonthlyReport(
  data: VacationReportData[],
  month: string,
  year: number
): void {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text(`Извештај за одмори - ${month} ${year}`, 14, 20)
  
  // Summary
  const totalDays = data.reduce((sum, item) => sum + item.days, 0)
  const approvedDays = data
    .filter(item => item.status === 'approved')
    .reduce((sum, item) => sum + item.days, 0)
  
  doc.setFontSize(12)
  doc.text(`Вкупно одобрени денови: ${approvedDays}`, 14, 30)
  doc.text(`Вкупно барања: ${data.length}`, 14, 36)
  
  // Table
  const tableData = data.map(item => [
    item.employeeName,
    formatDate(item.dateFrom),
    formatDate(item.dateTo),
    item.type,
    item.days.toString(),
    item.status === 'approved' ? 'Одобрено' : item.status === 'rejected' ? 'Одбиено' : 'Во тек'
  ])
  
  autoTable(doc, {
    head: [['Вработен', 'Од', 'До', 'Тип', 'Денови', 'Статус']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  doc.save(`izvestaj-odmori-${month}-${year}.pdf`)
}

export function generateEmployeeReport(
  data: VacationReportData[],
  employeeName: string
): void {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text(`Извештај за одмори - ${employeeName}`, 14, 20)
  
  // Summary
  const totalDays = data.reduce((sum, item) => sum + item.days, 0)
  const approvedDays = data
    .filter(item => item.status === 'approved')
    .reduce((sum, item) => sum + item.days, 0)
  
  doc.setFontSize(12)
  doc.text(`Вкупно одобрени денови: ${approvedDays}`, 14, 30)
  doc.text(`Вкупно барања: ${data.length}`, 14, 36)
  
  // Table
  const tableData = data.map(item => [
    formatDate(item.dateFrom),
    formatDate(item.dateTo),
    item.type,
    item.days.toString(),
    item.status === 'approved' ? 'Одобрено' : item.status === 'rejected' ? 'Одбиено' : 'Во тек'
  ])
  
  autoTable(doc, {
    head: [['Од', 'До', 'Тип', 'Денови', 'Статус']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  doc.save(`izvestaj-odmori-${employeeName}.pdf`)
}
