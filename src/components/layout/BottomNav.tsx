import { NavLink } from 'react-router-dom'
import { Calendar, Users, Receipt, Settings } from 'lucide-react'

const navItems = [
  { to: '/calendar', label: '캘린더', icon: Calendar },
  { to: '/students', label: '선수', icon: Users },
  { to: '/settlement', label: '정산', icon: Receipt },
  { to: '/settings', label: '설정', icon: Settings },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] text-xs transition-colors ${
                isActive ? 'text-indigo-500' : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
