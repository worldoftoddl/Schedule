import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Save } from 'lucide-react'
import { db } from '../../db/schema'
import { generateId } from '../../utils/id'
import { formatCurrency } from '../../utils/format'
import type { TimeLessonLevel } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function TimeLessonLevelEditor() {
  const levels = useLiveQuery(() => db.timeLessonLevels.orderBy('sortOrder').toArray())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TimeLessonLevel | null>(null)

  const startEdit = (level: TimeLessonLevel) => {
    setEditingId(level.id)
    setEditName(level.name)
    setEditDuration(String(level.baseDuration))
    setEditPrice(String(level.pricePerHour))
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim() || Number(editPrice) <= 0 || Number(editDuration) <= 0) return
    await db.timeLessonLevels.update(editingId, {
      name: editName.trim(),
      baseDuration: Number(editDuration),
      pricePerHour: Number(editPrice),
    })
    setEditingId(null)
  }

  const addLevel = async () => {
    const maxOrder = levels?.reduce((max, l) => Math.max(max, l.sortOrder), 0) ?? 0
    await db.timeLessonLevels.add({
      id: generateId(),
      name: '새 항목',
      baseDuration: 50,
      pricePerHour: 0,
      sortOrder: maxOrder + 1,
    })
  }

  const deleteLevel = async (id: string) => {
    await db.timeLessonLevels.delete(id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">타임 레슨 항목 관리</h3>
        <button
          onClick={addLevel}
          className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50 rounded-lg min-h-[36px]"
        >
          <Plus size={14} />
          추가
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {levels?.map((level) => (
          <div key={level.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            {editingId === level.id ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">이름</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">기준 시간 (분)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      min={5}
                      step={5}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">가격 (원)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <button
                    onClick={saveEdit}
                    className="p-2 text-green-500 hover:bg-green-50 rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => startEdit(level)}
                  className="flex-1 text-left"
                >
                  <span className="text-sm font-medium">{level.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{level.baseDuration}분 {formatCurrency(level.pricePerHour)}</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(level)}
                  className="p-2 text-gray-300 hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`"${deleteTarget.name}" 항목을 삭제하시겠습니까?`}
          onConfirm={() => deleteLevel(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
