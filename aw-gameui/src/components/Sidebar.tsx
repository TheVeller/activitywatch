import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const navItems = [
  { path: '/', label: 'Profile', icon: '👤' },
  { path: '/library', label: 'Library', icon: '📚' },
  { path: '/trophies', label: 'Trophy Room', icon: '🏆' },
  { path: '/feed', label: 'Activity Feed', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-black/30 backdrop-blur-sm border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold neon-purple">ActivityWatch</h1>
        <p className="text-sm text-gray-400 mt-1">Game Stats</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'glass-panel border border-white/20 neon-purple'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
