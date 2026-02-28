import { Link, Outlet, useLocation } from 'react-router-dom'
import { Brain, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppShell() {
  const location = useLocation()
  const isFullWidth = location.pathname.startsWith('/learn') ||
                      location.pathname === '/template' ||
                      location.pathname === '/kb' ||
                      location.pathname === '/pulse' ||
                      location.pathname === '/'

  const navItems = [
    { to: '/pulse', icon: Zap, label: 'Pulse', match: (p: string) => p === '/pulse' || p === '/' },
    { to: '/kb', icon: Brain, label: 'Knowledge', match: (p: string) => p === '/kb' },
    { to: '/template', icon: Settings, label: 'Settings', match: (p: string) => p === '/template' },
  ]

  return (
    <div className="h-dvh flex flex-col bg-[var(--bg-base)]">
      <nav className="bg-white border-b border-[var(--color-border)] shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            to="/pulse"
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)]"
          >
            <Zap size={16} className="text-[var(--color-accent)]" />
            Cortex
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label, match }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  match(location.pathname)
                    ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className={isFullWidth ? 'flex-1 min-h-0' : 'max-w-5xl w-full mx-auto px-4 py-8 flex-1'}>
        <Outlet />
      </main>
    </div>
  )
}
