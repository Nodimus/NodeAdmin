import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  Eye,
  DollarSign,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  UserCheck,
  Shield,
  History,
  Building2,
  LayoutTemplate,
  Printer,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNavAdmin: React.FC = () => {
  const { user, hasPermission, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  // Itens da barra inferior primária (apenas itens autorizados)
  const primaryCandidates = [
    { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays, perm: 'agenda.ler' },
    { to: '/admin/pacientes', label: 'Pacientes', icon: Users, perm: 'pacientes.ler' },
    { to: '/admin/exames', label: 'Atendimento', icon: Eye, perm: 'atendimento.ler' },
    { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign, perm: 'financeiro.ler' },
  ];

  const primaryItems = primaryCandidates.filter(
    (item) => !item.perm || hasPermission(item.perm)
  );

  // Itens extras no menu "Mais"
  const secondaryCandidates = [
    { to: '/admin', label: 'Painel Geral', icon: LayoutDashboard, end: true },
    { to: '/admin/prescricoes', label: 'Receituário Óptico', icon: FileText, perm: 'receitas.ler' },
    { to: '/admin/relatorios', label: 'Relatórios Impressos', icon: Printer, perm: 'relatorios.ler' },
    { to: '/admin/usuarios', label: 'Equipe & Usuários', icon: UserCheck, perm: 'usuarios.ler' },
    { to: '/admin/papeis', label: 'Papéis & Permissões', icon: Shield, perm: 'papeis.ler' },
    { to: '/admin/auditoria', label: 'Trilha de Auditoria', icon: History, perm: 'auditoria.ler' },
    { to: '/admin/empresa', label: 'Dados da Empresa', icon: Building2, perm: 'empresa.ler' },
    { to: '/admin/home', label: 'Conteúdo da Home', icon: LayoutTemplate, perm: 'empresa.editar' },
  ];

  const secondaryItems = secondaryCandidates.filter(
    (item) => !item.perm || hasPermission(item.perm)
  );

  // Verifica se a rota ativa está nos itens secundários
  const isSecondaryActive = secondaryItems.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <>
      {/* Drawer / Sheet de "Mais Opções" */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMoreOpen(false)}
          />

          {/* Painel do Sheet */}
          <div className="relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mais Funcionalidades
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const active = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                      active
                        ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-600' : 'text-slate-500'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Logout Mobile */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior Fixa (Apenas < 1024px) */}
      <nav
        aria-label="Navegação inferior mobile"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg lg:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors min-h-[44px] min-w-[44px] ${
                    isActive
                      ? 'text-teal-700'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1 rounded-xl transition-colors ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="leading-tight mt-0.5">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Botão Mais */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors min-h-[44px] min-w-[44px] cursor-pointer ${
              moreOpen || isSecondaryActive
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            aria-label="Mais opções de menu"
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                moreOpen || isSecondaryActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500'
              }`}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="leading-tight mt-0.5">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};
