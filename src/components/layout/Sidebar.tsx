import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, CreditCard, Calendar, Star, Users, Settings, LayoutDashboard, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const userNavItems: NavItem[] = [
  { path: '/', icon: <Home className="w-5 h-5" />, label: 'Início' },
  { path: '/spaces', icon: <Building2 className="w-5 h-5" />, label: 'Espaços' },
  { path: '/membership', icon: <CreditCard className="w-5 h-5" />, label: 'Carteirinha' },
  { path: '/events', icon: <Calendar className="w-5 h-5" />, label: 'Eventos' },
  { path: '/points', icon: <Star className="w-5 h-5" />, label: 'Meus Pontos' }
];

const adminNavItems: NavItem[] = [
  { path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Usuários' },
  { path: '/admin/spaces', icon: <Building2 className="w-5 h-5" />, label: 'Espaços' },
  { path: '/admin/events', icon: <Calendar className="w-5 h-5" />, label: 'Eventos' },
  { path: '/admin/bookings', icon: <Settings className="w-5 h-5" />, label: 'Locações' }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const navItems = isAdminRoute && isAdmin ? adminNavItems : userNavItems;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 w-64 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-100`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-bold text-primary-500">A-Hub</h1>
                <p className="text-xs text-gray-500">Associação Cristofoli</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {isAdminRoute && isAdmin ? 'Administração' : 'Menu'}
              </span>
            </div>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-500 border-r-4 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            {/* Admin toggle */}
            {isAdmin && (
              <>
                <div className="my-4 border-t border-gray-100" />
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {isAdminRoute ? 'Portal do Associado' : 'Administração'}
                  </span>
                </div>
                <button
                  onClick={() => handleNavigation(isAdminRoute ? '/' : '/admin')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {isAdminRoute ? (
                    <>
                      <Home className="w-5 h-5" />
                      <span className="font-medium">Ir para Portal</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-medium">Painel Admin</span>
                    </>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={user?.photo}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'admin' ? 'Administrador' : 'Associado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
