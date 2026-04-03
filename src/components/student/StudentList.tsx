import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, ChevronRight, Settings2 } from 'lucide-react'
import type { Student } from '../../types'
import { db } from '../../db/schema'
import { Modal } from '../ui/Modal'
import { StudentForm } from './StudentForm'
import { TeamEditor } from '../settings/TeamEditor'

interface StudentListProps {
  students: Student[]
  onAdd: (name: string, teamId: string, phone?: string, memo?: string) => void
  onSelect: (student: Student) => void
}

export function StudentList({ students, onAdd, onSelect }: StudentListProps) {
  const [showForm, setShowForm] = useState(false)
  const [showTeamEditor, setShowTeamEditor] = useState(false)
  const [search, setSearch] = useState('')

  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray())
  const teamMap = new Map(teams?.map((t) => [t.id, t.name]) ?? [])

  const filtered = search
    ? students.filter((s) => s.name.includes(search))
    : students

  // Group by team
  const grouped = new Map<string, Student[]>()
  for (const s of filtered) {
    const teamName = teamMap.get(s.teamId) ?? '미지정'
    const list = grouped.get(teamName) ?? []
    list.push(s)
    grouped.set(teamName, list)
  }

  return (
    <div>
      <div className="px-4 py-3 flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="선수 검색"
          />
        </div>
        <button
          onClick={() => setShowTeamEditor(true)}
          className="px-3 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="팀 관리"
        >
          <Settings2 size={18} />
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          {students.length === 0 ? '등록된 선수가 없습니다' : '검색 결과가 없습니다'}
        </p>
      ) : (
        <div>
          {Array.from(grouped.entries()).map(([teamName, members]) => (
            <div key={teamName}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">{teamName} ({members.length})</span>
              </div>
              <ul>
                {members.map((student) => (
                  <li key={student.id}>
                    <button
                      onClick={() => onSelect(student)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left min-h-[44px]"
                    >
                      <div>
                        <div className="text-sm font-medium">{student.name}</div>
                        {student.phone && (
                          <div className="text-xs text-gray-400">{student.phone}</div>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="선수 추가" onClose={() => setShowForm(false)}>
          <StudentForm
            onSubmit={(name, teamId, phone, memo) => {
              onAdd(name, teamId, phone, memo)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {showTeamEditor && (
        <Modal title="팀 관리" onClose={() => setShowTeamEditor(false)}>
          <TeamEditor />
        </Modal>
      )}
    </div>
  )
}
