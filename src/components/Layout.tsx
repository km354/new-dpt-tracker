import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Clock,
  Calendar,
  BarChart,
  Folder,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Applications', path: '/applications', icon: FileText },
  { name: 'Prerequisites', path: '/prerequisites', icon: BookOpen },
  { name: 'Observations', path: '/observations', icon: Clock },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Comparison', path: '/comparison', icon: BarChart },
  { name: 'Resources', path: '/resources', icon: Folder },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#364F6B] text-white transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#2A3F57]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">DPT Tracker</h1>
                <p className="text-sm text-gray-300 mt-1">Application Manager</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-[#2A3F57]"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#E0F2F7] text-[#364F6B] font-medium'
                      : 'text-white hover:bg-[#2A3F57]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer Stats */}
          <div className="p-4 border-t border-[#2A3F57] space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Applications</span>
              <span className="bg-gray-400 text-[#364F6B] px-2 py-1 rounded font-medium">
                0
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Observation Hours</span>
              <span className="bg-gray-400 text-[#364F6B] px-2 py-1 rounded font-medium">
                0h
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Courses</span>
              <span className="bg-gray-400 text-[#364F6B] px-2 py-1 rounded font-medium">
                0
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">DPT Tracker</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>

      {/* Help Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-12 w-12 bg-gray-700 hover:bg-gray-800 text-white shadow-lg z-30"
        aria-label="Help"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}

