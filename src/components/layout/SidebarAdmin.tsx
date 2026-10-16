import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Eye,
  FileText,
  Boxes,
  DollarSign,
  Settings,
  LogOut,
  Glasses,
  ChevronLeft,
  ChevronRight,
  Database,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';

interface SidebarAdminProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const SidebarAdmin: React.FC<SidebarAdminProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout, isFirebaseConnected } = useAuth();
  const { consultorio } = useConsultorio();

  const navItems = [
    { to: '/admin', label: 'Painel Geral', icon: LayoutDashboard, end: true },
    { to: '/admin/agenda', label: 'Agenda & Consultas', icon: CalendarDays },
    { to: '/admin/pacientes', label: 'Pacientes & Prontuários', icon: Users },
    { to: '/admin/exames', label: 'Exames & Refração', icon: Eye },
    { to: '/admin/prescricoes', label: 'Receituário Óptico', icon: FileText },
    { to: '/admin/estoque', label: 'Estoque & Armações', icon: Boxes },
    { to: '/admin/financeiro', label: 'Financeiro & Caixa', icon: DollarSign },
    { to: '/admin/configuracoes', label: 'Dados do Consultório', icon: Settings },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out lg:static ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Topo / Logo e Nome do Consultório */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
              <Glasses className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white tracking-tight truncate">
                  {consultorio.nomeFantasia}
                </span>
                <span className="text-[10px] text-teal-400 font-medium truncate">
                  {consultorio.responsavelTecnico}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Status do Banco de Dados */}
        {!collapsed && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span className="text-slate-400">
                {isFirebaseConnected ? 'Banco Firestore' : 'Dados Locais (Demonstração)'}
              </span>
            </div>
            <Database className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}

        {/* Lista de Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            {!collapsed && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 shrink-0 font-bold text-sm">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.displayName || 'Optometrista'}
                  </p>
                  <span className="inline-block text-[10px] font-medium text-teal-400 uppercase tracking-wider bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/40">
                    {user?.role === 'optometrista' ? 'Optometrista' : user?.role === 'secretaria' ? 'Recepção' : 'Admin'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => logout()}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
