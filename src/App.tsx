import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { CalendarPage } from './pages/CalendarPage'
import { StudentsPage } from './pages/StudentsPage'
import { SettlementPage } from './pages/SettlementPage'
import { SettingsPage } from './pages/SettingsPage'
import { seedDefaultLevels } from './db/seed'

function App() {
  useEffect(() => {
    seedDefaultLevels()
  }, [])

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentsPage />} />
        <Route path="/settlement" element={<SettlementPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
