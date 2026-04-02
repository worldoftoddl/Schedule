import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { StudentList } from '../components/student/StudentList'
import { StudentDetail } from '../components/student/StudentDetail'
import { useStudents } from '../hooks/useStudents'
import type { Student } from '../types'

export function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudents()
  const [selected, setSelected] = useState<Student | null>(null)

  if (selected) {
    const current = students.find((s) => s.id === selected.id)
    if (!current) {
      setSelected(null)
      return null
    }
    return (
      <StudentDetail
        student={current}
        onBack={() => setSelected(null)}
        onUpdate={updateStudent}
        onDelete={(id) => {
          deleteStudent(id)
          setSelected(null)
        }}
      />
    )
  }

  return (
    <>
      <Header title="선수 관리" />
      <StudentList
        students={students}
        onAdd={addStudent}
        onSelect={setSelected}
      />
    </>
  )
}
