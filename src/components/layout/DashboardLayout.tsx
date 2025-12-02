import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Settings,
  LogOut,
  ChevronDown,
  Sliders,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Prospectos', href: '/prospectos', icon: Users },
  { name: 'Flujos', href: '/flujos', icon: GitBranch },
  { name: 'Plantillas', href: '/plantillas', icon: Mail },
  // { name: 'Ofertas Infocom', href: '/ofertas', icon: Tag },
  // { name: 'Monitor de Envíos', href: '/monitor', icon: Send },
  { name: 'Configuración', href: '/configuracion', icon: Sliders },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // SIEMPRE redirigir aunque haya error, para limpiar el estado del usuario
    } finally {
      // Limpiar y redirigir SIEMPRE
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Segal Corporate Colors */}
      <div className="flex w-64 flex-col border-r border-segal-blue/10 bg-linear-to-b from-segal-blue/5 to-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-segal-blue/10 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-segal-blue to-segal-turquoise">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <h1 className="text-lg font-bold text-segal-dark">Nurturing</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-segal-blue/10 text-segal-blue shadow-sm'
                    : 'text-segal-dark/70 hover:bg-segal-blue/5 hover:text-segal-blue'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-segal-blue/10" />

        {/* User section - Dropdown Menu */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full rounded-lg border border-segal-blue/10 bg-segal-blue/5 px-3 py-2 transition-all duration-200 hover:bg-segal-blue/10 hover:shadow-sm active:bg-segal-blue/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-segal-blue to-segal-turquoise text-sm font-medium text-white shrink-0">
                    AD
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-segal-dark">{user?.name}</p>
                    <p className="text-xs text-segal-dark/60">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-segal-dark/40 shrink-0" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-segal-blue/10">
              <DropdownMenuLabel className="text-segal-dark">Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-segal-blue/10" />
              <DropdownMenuItem className="cursor-pointer text-segal-dark hover:bg-segal-blue/5 focus:bg-segal-blue/5">
                <Settings className="mr-2 h-4 w-4 text-segal-blue" />
                <span>Configuración de Cuenta</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-segal-dark hover:bg-segal-blue/5 focus:bg-segal-blue/5"
                onClick={() => navigate('/profile')}
              >
                <Users className="mr-2 h-4 w-4 text-segal-turquoise" />
                <span>Ver Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-segal-blue/10" />
              <DropdownMenuItem
                className="cursor-pointer text-segal-red hover:bg-segal-red/5 focus:bg-segal-red/5"
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Segal Corporate Colors */}
        <header className="flex h-16 items-center border-b border-segal-blue/10 bg-white px-6 shadow-sm">
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold text-segal-dark">
              Sistema de Nurturing - Segal
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/configuracion')}
                className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 hover:text-segal-blue"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}