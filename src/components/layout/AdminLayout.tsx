import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarAdmin } from './SidebarAdmin';
import { TopbarAdmin } from './TopbarAdmin';
import { BottomNavAdmin } from './BottomNavAdmin';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar Desktop (em telas >= 1024px inalterada) */}
      <SidebarAdmin
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopbarAdmin onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile (< 1024px) */}
      <BottomNavAdmin />
    </div>
  );
};

