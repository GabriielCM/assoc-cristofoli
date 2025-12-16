import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showBottomNav = true
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar - hidden on mobile by default */}
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Header
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className={`flex-1 p-4 ${showBottomNav ? 'pb-20 lg:pb-4' : ''}`}>
            {children}
          </main>

          {/* Bottom navigation - only on mobile */}
          {showBottomNav && <BottomNav />}
        </div>
      </div>
    </div>
  );
};
