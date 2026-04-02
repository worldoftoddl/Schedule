export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

export function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  return `${year}년 ${Number(month)}월`
}

export function formatTime(timeStr: string): string {
  return timeStr
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function splitPrice(totalPrice: number, count: number): number {
  if (count <= 0) return 0
  return Math.floor(totalPrice / count)
}
