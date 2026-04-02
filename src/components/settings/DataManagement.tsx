import { useState } from 'react'
import { Download, Upload, Trash2 } from 'lucide-react'
import { db } from '../../db/schema'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function DataManagement() {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const exportData = async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students: await db.students.toArray(),
      timeLessons: await db.timeLessons.toArray(),
      choreoLessons: await db.choreoLessons.toArray(),
      choreographies: await db.choreographies.toArray(),
      choreoLevels: await db.choreoLevels.toArray(),
      payments: await db.payments.toArray(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.students) {
        setImportStatus('유효하지 않은 파일입니다')
        return
      }

      await db.transaction('rw', [db.students, db.timeLessons, db.choreoLessons, db.choreographies, db.choreoLevels, db.payments], async () => {
        await db.students.clear()
        await db.timeLessons.clear()
        await db.choreoLessons.clear()
        await db.choreographies.clear()
        await db.choreoLevels.clear()
        await db.payments.clear()

        if (data.students?.length) await db.students.bulkAdd(data.students)
        if (data.timeLessons?.length) await db.timeLessons.bulkAdd(data.timeLessons)
        if (data.choreoLessons?.length) await db.choreoLessons.bulkAdd(data.choreoLessons)
        if (data.choreographies?.length) await db.choreographies.bulkAdd(data.choreographies)
        if (data.choreoLevels?.length) await db.choreoLevels.bulkAdd(data.choreoLevels)
        if (data.payments?.length) await db.payments.bulkAdd(data.payments)
      })

      setImportStatus('데이터를 복원했습니다')
    } catch {
      setImportStatus('파일을 읽을 수 없습니다')
    }

    e.target.value = ''
  }

  const clearAll = async () => {
    await db.transaction('rw', [db.students, db.timeLessons, db.choreoLessons, db.choreographies, db.choreoLevels, db.payments], async () => {
      await db.students.clear()
      await db.timeLessons.clear()
      await db.choreoLessons.clear()
      await db.choreographies.clear()
      await db.choreoLevels.clear()
      await db.payments.clear()
    })
    setShowClearConfirm(false)
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">데이터 관리</h3>

      <div className="flex flex-col gap-2">
        <button
          onClick={exportData}
          className="flex items-center gap-2 w-full px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 text-sm hover:bg-gray-50 min-h-[44px]"
        >
          <Download size={18} className="text-green-500" />
          데이터 내보내기 (JSON)
        </button>

        <label className="flex items-center gap-2 w-full px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 text-sm hover:bg-gray-50 cursor-pointer min-h-[44px]">
          <Upload size={18} className="text-blue-500" />
          데이터 가져오기 (JSON)
          <input type="file" accept=".json" onChange={importData} className="hidden" />
        </label>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 w-full px-4 py-3 bg-white rounded-lg shadow-sm border border-red-100 text-sm text-red-500 hover:bg-red-50 min-h-[44px]"
        >
          <Trash2 size={18} />
          모든 데이터 삭제
        </button>
      </div>

      {importStatus && (
        <p className="text-sm text-center mt-3 text-gray-600">{importStatus}</p>
      )}

      {showClearConfirm && (
        <ConfirmDialog
          message="모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?"
          confirmLabel="전체 삭제"
          onConfirm={clearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}
