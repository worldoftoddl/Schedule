import { Header } from '../components/layout/Header'
import { TeamEditor } from '../components/settings/TeamEditor'
import { TimeLessonLevelEditor } from '../components/settings/TimeLessonLevelEditor'
import { ChoreoLevelEditor } from '../components/settings/ChoreoLevelEditor'
import { DataManagement } from '../components/settings/DataManagement'

export function SettingsPage() {
  return (
    <>
      <Header title="설정" />
      <div className="p-4 flex flex-col gap-6">
        <TeamEditor />
        <TimeLessonLevelEditor />
        <ChoreoLevelEditor />
        <DataManagement />
      </div>
    </>
  )
}
