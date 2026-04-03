export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatDate(dateStr: string): string {
  const [_year, month, day] = dateStr.split('-')
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

/** 시작/종료 시간으로 타임 수 계산
 * 50분 미만: 분/50 (소수점 둘째자리 반올림, 예: 20분 = 0.4타임)
 * 50분 이상: 0.5 단위 반올림 (50~60분 = 1타임, 80~90분 = 1.5타임)
 */
export function calcTimes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const minutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  if (minutes < 50) {
    return Math.round(minutes / 50 * 100) / 100
  }
  return Math.round(minutes / 30) / 2
}
