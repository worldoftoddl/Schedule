import { useState } from 'react'
import { ChevronLeft, ChevronRight, Banknote, AlertCircle, Check } from 'lucide-react'
import { useSettlement } from '../../hooks/useSettlement'
import { usePayments } from '../../hooks/usePayments'
import { formatCurrency, formatDate, getMonthKey } from '../../utils/format'

export function SettlementView() {
  const [date, setDate] = useState(new Date())
  const month = getMonthKey(date)
  const settlement = useSettlement(month)
  const { toggleLessonPayment } = usePayments()

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
            <div className="px-4 flex flex-col gap-3">
              {settlement.studentSummaries.map((s) => (
                <div key={s.studentId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.studentName}</span>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(s.paidAmount)} / {formatCurrency(s.totalAmount)}
                      </div>
                    </div>
                    {s.outstandingAmount > 0 && (
                      <p className="text-xs text-red-500 mt-1">미수금 {formatCurrency(s.outstandingAmount)}</p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {s.lessons.map((lesson) => (
                      <div
                        key={lesson.lessonId}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${lesson.lessonType === 'time' ? 'bg-indigo-400' : 'bg-purple-400'}`} />
                            <span className="text-sm text-gray-700 truncate">{formatDate(lesson.date)} {lesson.description}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-3.5">{formatCurrency(lesson.amount)}</span>
                        </div>
                        <button
                          onClick={() => toggleLessonPayment({
                            studentId: s.studentId,
                            month,
                            lessonId: lesson.lessonId,
                            lessonType: lesson.lessonType,
                            amount: lesson.amount,
                          })}
                          className={`ml-2 flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            lesson.paid
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
