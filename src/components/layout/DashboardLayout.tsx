import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Settings,
  LogOut,
  ChevronDown,
  Sliders,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/hooks/useSidebar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { SidebarToggle } from '@/components/sidebar/SidebarToggle'

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Prospectos', href: '/prospectos', icon: Users },
  { name: 'Flujos', href: '/flujos', icon: GitBranch },
  { name: 'Plantillas', href: '/plantillas', icon: Mail },
  { name: 'Configuración', href: '/configuracion', icon: Sliders },
]

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className={cn(
        'flex w-64 flex-col border-r border-segal-blue/10 bg-white dark:border-slate-700 dark:bg-slate-900 transition-all duration-300',
        !isSidebarOpen && 'hidden'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center border-segal-blue/10 px-6 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-segal-blue to-segal-turquoise">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <h1 className="text-lg font-bold text-segal-dark dark:text-white">Nurturing</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-segal-blue/10 text-segal-blue dark:bg-slate-800 dark:text-white shadow-sm'
                    : 'text-segal-dark/70 hover:bg-segal-blue/5 hover:text-segal-blue dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-segal-blue/10 dark:bg-slate-700" />

        {/* User section */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full rounded-lg border border-segal-blue/10 bg-segal-blue/5 px-3 py-2 transition-all duration-200 hover:bg-segal-blue/10 hover:shadow-sm active:bg-segal-blue/15 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-segal-blue to-segal-turquoise text-sm font-medium text-white shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-segal-dark dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-segal-dark/60 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-segal-dark/40 dark:text-slate-400 shrink-0" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-segal-blue/10 dark:border-slate-700">
              <DropdownMenuLabel className="text-segal-dark dark:text-white">
                Mi Cuenta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-segal-blue/10 dark:bg-slate-700" />
              <DropdownMenuItem className="cursor-pointer text-segal-dark dark:text-white hover:bg-segal-blue/5 dark:hover:bg-slate-800 focus:bg-segal-blue/5 dark:focus:bg-slate-800">
                <Settings className="mr-2 h-4 w-4 text-segal-blue" />
                <span>Configuración de Cuenta</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-segal-dark dark:text-white hover:bg-segal-blue/5 dark:hover:bg-slate-800 focus:bg-segal-blue/5 dark:focus:bg-slate-800"
                onClick={() => navigate('/profile')}
              >
                <Users className="mr-2 h-4 w-4 text-segal-turquoise" />
                <span>Ver Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-segal-blue/10 dark:bg-slate-700" />
              <DropdownMenuItem
                className="cursor-pointer text-segal-red hover:bg-segal-red/5 dark:hover:bg-slate-800 focus:bg-segal-red/5 dark:focus:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Header */}
        <header className="flex h-16 items-center border-b border-segal-blue/10 bg-white px-6 shadow-sm dark:bg-slate-900 dark:border-slate-700 transition-colors duration-300">
          <div className="flex flex-1 items-center justify-between w-full">
            {/* Left: Sidebar toggle */}
            <div className="flex items-center gap-3">
              <SidebarToggle variant="ghost" size="sm" />
              <h2 className="text-lg font-semibold text-segal-dark dark:text-white">
                Sistema de Nurturing - Segal
              </h2>
            </div>

            {/* Right: Theme toggle y Settings */}
            <div className="flex items-center gap-2">
              <ThemeToggle variant="ghost" size="sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/configuracion')}
                className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 hover:text-segal-blue dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-950 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
