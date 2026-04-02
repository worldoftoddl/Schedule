import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Save } from 'lucide-react'
import { db } from '../../db/schema'
import { generateId } from '../../utils/id'
import type { Team } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function TeamEditor() {
  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)

  const startEdit = (team: Team) => {
    setEditingId(team.id)
    setEditName(team.name)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await db.teams.update(editingId, { name: editName.trim(), updatedAt: new Date() })
    setEditingId(null)
  }

  const addTeam = async () => {
    const maxOrder = teams?.reduce((max, t) => Math.max(max, t.sortOrder), 0) ?? 0
    const now = new Date()
    await db.teams.add({
      id: generateId(),
      name: '새 팀',
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })
  }

  const deleteTeam = async (id: string) => {
    await db.teams.delete(id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">팀 관리</h3>
        <button
          onClick={addTeam}
          className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50 rounded-lg min-h-[36px]"
        >
          <Plus size={14} />
          추가
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {teams?.map((team) => (
          <div key={team.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            {editingId === team.id ? (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">팀 이름</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoFocus
                  />
                </div>
                <button
                  onClick={saveEdit}
                  className="p-2 text-green-500 hover:bg-green-50 rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => startEdit(team)}
                  className="flex-1 text-left"
                >
                  <span className="text-sm font-medium">{team.name}</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(team)}
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
          message={`"${deleteTarget.name}" 팀을 삭제하시겠습니까?`}
          onConfirm={() => deleteTeam(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
