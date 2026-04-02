import { useState } from 'react'
import { ChevronLeft, ChevronRight, Banknote, AlertCircle } from 'lucide-react'
import { useSettlement } from '../../hooks/useSettlement'
import { usePayments } from '../../hooks/usePayments'
import { formatCurrency, getMonthKey } from '../../utils/format'
import { PaymentModal } from './PaymentModal'
import type { StudentSettlement } from '../../types'

export function SettlementView() {
  const [date, setDate] = useState(new Date())
  const month = getMonthKey(date)
  const settlement = useSettlement(month)
  const { addPayment } = usePayments()
  const [paymentTarget, setPaymentTarget] = useState<StudentSettlement | null>(null)

  const navigateMonth = (dir: 'prev' | 'next') => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1))
      return d
    })
  }

  const year = date.getFullYear()
  const monthNum = date.getMonth() + 1

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigateMonth('prev')} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">{year}년 {monthNum}월</h2>
        <button onClick={() => navigateMonth('next')} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronRight size={20} />
        </button>
      </div>

      {settlement && (
        <>
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Banknote size={16} className="text-green-500" />
                <span className="text-xs text-gray-500">총 수입</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(settlement.totalIncome)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-xs text-gray-500">미수금</span>
              </div>
              <p className={`text-lg font-bold ${settlement.totalOutstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(settlement.totalOutstanding)}
              </p>
            </div>
          </div>

          {settlement.studentSummaries.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">이번 달 수업 기록이 없습니다</p>
          ) : (
            <div className="px-4 flex flex-col gap-2">
              {settlement.studentSummaries.map((s) => (
                <div key={s.studentId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{s.studentName}</span>
                    <button
                      onClick={() => setPaymentTarget(s)}
                      className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 min-h-[32px]"
                    >
                      결제 등록
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {s.timeLessonCount > 0 && (
                      <>
                        <span className="text-gray-500">타임 {s.timeLessonCount}회</span>
                        <span className="text-right">{formatCurrency(s.timeLessonTotal)}</span>
                      </>
                    )}
                    {s.choreoLessonCount > 0 && (
                      <>
                        <span className="text-gray-500">안무 {s.choreoLessonCount}회</span>
                        <span className="text-right">{formatCurrency(s.choreoLessonTotal)}</span>
                      </>
                    )}
                    <span className="text-gray-700 font-medium pt-1 border-t border-gray-100">합계</span>
                    <span className="text-right font-medium pt-1 border-t border-gray-100">{formatCurrency(s.totalAmount)}</span>
                    <span className="text-gray-500">결제</span>
                    <span className="text-right text-green-600">{formatCurrency(s.paidAmount)}</span>
                    {s.outstandingAmount > 0 && (
                      <>
                        <span className="text-red-500 font-medium">미수금</span>
                        <span className="text-right text-red-500 font-medium">{formatCurrency(s.outstandingAmount)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {paymentTarget && (
        <PaymentModal
          studentId={paymentTarget.studentId}
          studentName={paymentTarget.studentName}
          month={month}
          outstandingAmount={paymentTarget.outstandingAmount}
          onSubmit={(data) => {
            addPayment(data)
            setPaymentTarget(null)
          }}
          onClose={() => setPaymentTarget(null)}
        />
      )}
    </div>
  )
}
