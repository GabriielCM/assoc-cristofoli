import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, CreditCard, Calendar, Star } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: <Home className="w-5 h-5" />, label: 'Início' },
  { path: '/spaces', icon: <Building2 className="w-5 h-5" />, label: 'Espaços' },
  { path: '/membership', icon: <CreditCard className="w-5 h-5" />, label: 'Carteirinha' },
  { path: '/events', icon: <Calendar className="w-5 h-5" />, label: 'Eventos' },
  { path: '/points', icon: <Star className="w-5 h-5" />, label: 'Pontos' }
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white bottom-nav z-40 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
