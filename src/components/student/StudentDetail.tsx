import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Edit2, Trash2, X } from 'lucide-react'
import type { Student, Choreography } from '../../types'
import { db } from '../../db/schema'
import { useChoreographies } from '../../hooks/useChoreographies'
import { formatDate, formatCurrency } from '../../utils/format'
import { Modal } from '../ui/Modal'
import { StudentForm } from './StudentForm'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface StudentDetailProps {
  student: Student
  onBack: () => void
  onUpdate: (id: string, data: Partial<Pick<Student, 'name' | 'teamId' | 'phone' | 'memo'>>) => void
  onDelete: (id: string) => void
}

export function StudentDetail({ student, onBack, onUpdate, onDelete }: StudentDetailProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteChoreoTarget, setDeleteChoreoTarget] = useState<Choreography | null>(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterChoreoId, setFilterChoreoId] = useState('')
  const [editChoreoId, setEditChoreoId] = useState<string | null>(null)
  const [editTotalHours, setEditTotalHours] = useState('')
  const { deleteChoreography, updateTotalHours } = useChoreographies()

  const timeLessons = useLiveQuery(
    () => db.timeLessons.toArray().then((all) =>
      all.filter((l) => l.studentIds.includes(student.id)).sort((a, b) => b.date.localeCompare(a.date))
    ),
    [student.id]
  )

  const choreoLessons = useLiveQuery(
    () => db.choreoLessons.where('studentId').equals(student.id).sortBy('date').then((arr) => arr.reverse()),
    [student.id]
  )

  const levels = useLiveQuery(() => db.choreoLevels.toArray(), [])
  const choreographies = useLiveQuery(
    () => db.choreographies.where('studentId').equals(student.id).toArray(),
    [student.id]
  )

  const allLessons = [
    ...(timeLessons ?? []).map((l) => {
      const override = l.studentLevelOverrides?.[student.id]
      const amount = override ? override.price : l.pricePerStudent
      return {
        date: l.date,
        time: `${l.startTime}-${l.endTime}`,
        type: '타임' as const,
        amount,
        choreoId: undefined as string | undefined,
        levelOverride: override?.levelName,
      }
    }),
    ...(choreoLessons ?? []).map((l) => ({
      date: l.date,
      time: `${l.startTime}-${l.endTime}`,
      type: '안무' as const,
      amount: l.price,
      choreoId: l.choreoId,
      levelOverride: undefined as string | undefined,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time))

  // 고유 월 목록 (최신순)
  const months = [...new Set(allLessons.map((l) => l.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a))

  const filteredLessons = allLessons.filter((l) => {
    if (filterMonth && !l.date.startsWith(filterMonth)) return false
    if (filterChoreoId === '_time' && l.type !== '타임') return false
    if (filterChoreoId && filterChoreoId !== '_time' && l.choreoId !== filterChoreoId) return false
    return true
  })

  return (
    <div>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold">{student.name}</h2>
          {student.phone && <p className="text-xs text-gray-400">{student.phone}</p>}
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {student.memo && (
        <p className="px-4 py-2 text-sm text-gray-500 bg-gray-50">{student.memo}</p>
      )}

      {(choreographies?.length ?? 0) > 0 && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">진행 중인 안무</h3>
          {choreographies?.filter((c) => c.status === 'in_progress').map((c) => {
            const level = levels?.find((l) => l.id === c.levelId)
            const sessions = choreoLessons?.filter((l) => l.choreoId === c.id) ?? []
            const completedHours = sessions.reduce((sum, s) => sum + s.durationHours, 0)
            return (
              <div key={c.id} className="flex items-center justify-between py-1">
                <span className="text-sm">{c.title} ({level?.name})</span>
                <div className="flex items-center gap-2">
                  {editChoreoId === c.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-purple-500">{completedHours}/</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={editTotalHours}
                        onChange={(e) => setEditTotalHours(e.target.value)}
                        onBlur={() => {
                          const val = Number(editTotalHours)
                          if (val > 0) updateTotalHours(c.id, val)
                          setEditChoreoId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          if (e.key === 'Escape') setEditChoreoId(null)
                        }}
                        className="w-12 px-1 py-0.5 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                        autoFocus
                        min={1}
                        step={0.5}
                      />
                      <span className="text-xs text-purple-500">타임</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditChoreoId(c.id); setEditTotalHours(String(c.totalHours)) }}
                      className="text-xs text-purple-500 hover:text-purple-700"
                    >
                      {completedHours}/{c.totalHours}타임
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteChoreoTarget(c)}
                    className="p-1 text-gray-300 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">
            수업 히스토리 ({filteredLessons.length}건)
          </h3>
        </div>
        {allLessons.length > 0 && (
          <div className="flex gap-2 mb-3">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">전체 월</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.replace('-', '년 ')}월</option>
              ))}
            </select>
            <select
              value={filterChoreoId}
              onChange={(e) => setFilterChoreoId(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">전체 유형</option>
              <option value="_time">타임 레슨</option>
              {choreographies?.map((c) => (
                <option key={c.id} value={c.id}>안무: {c.title}</option>
              ))}
            </select>
          </div>
        )}
        {filteredLessons.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {allLessons.length === 0 ? '수업 기록이 없습니다' : '해당하는 수업이 없습니다'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredLessons.map((lesson, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    lesson.type === '타임' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                  }`}>
                    {lesson.type}
                  </span>
                  <span className="text-gray-600">{formatDate(lesson.date)}</span>
                  <span className="text-gray-400 text-xs">{lesson.time}</span>
                  {lesson.levelOverride && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">{lesson.levelOverride}</span>
                  )}
                </div>
                <span className="font-medium">{formatCurrency(lesson.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <Modal title="선수 수정" onClose={() => setShowEdit(false)}>
          <StudentForm
            student={student}
            onSubmit={(name, teamId, phone, memo) => {
              onUpdate(student.id, { name, teamId, phone, memo })
              setShowEdit(false)
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          message={`${student.name} 선수를 삭제하시겠습니까? 관련된 모든 레슨과 정산 기록이 함께 삭제됩니다.`}
          onConfirm={() => {
            onDelete(student.id)
            setShowDeleteConfirm(false)
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deleteChoreoTarget && (
        <ConfirmDialog
          message={`"${deleteChoreoTarget.title}" 안무를 삭제하시겠습니까? 연결된 안무 레슨도 함께 삭제됩니다.`}
          onConfirm={() => {
            deleteChoreography(deleteChoreoTarget.id)
            setDeleteChoreoTarget(null)
          }}
          onCancel={() => setDeleteChoreoTarget(null)}
        />
      )}
    </div>
  )
}
