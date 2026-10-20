import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  CalendarPlus,
  UserPlus,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PushNotificationManager } from '../pwa/PushNotificationManager';

interface TopbarAdminProps {
  onOpenMobileMenu: () => void;
}

export const TopbarAdmin: React.FC<TopbarAdminProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Toggle Mobile */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Barra de Busca Rápida */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 w-64 md:w-80 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar paciente, CPF ou prontuário..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/admin/pacientes');
              }
            }}
          />
        </div>
      </div>

      {/* Ações à Direita */}
      <div className="flex items-center gap-3">
        {/* Registro do Profissional */}
        {user?.registerNumber && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
            <span>{user.registerNumber}</span>
          </div>
        )}

        {/* Dropdown Ação Rápida */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs shadow-teal-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Ação</span>
          </button>

          {quickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setQuickMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-40 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    navigate('/admin/pacientes?action=novo');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Cadastrar Paciente</span>
                </button>
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    navigate('/admin/agenda?action=novo');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <CalendarPlus className="w-4 h-4 text-cyan-600" />
                  <span>Agendar Consulta</span>
                </button>
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    navigate('/admin/exames?action=novo');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Novo Exame Refrativo</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Gerenciador de Push Notifications (Prompt 15) */}
        <PushNotificationManager />

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 relative transition-colors"
            title="Notificações da clínica"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white p-3 shadow-xl border border-slate-200 z-40 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-900">Notificações Clínicas</span>
                  <span className="text-[10px] text-teal-600 font-medium">3 novas</span>
                </div>
                <div className="divide-y divide-slate-100 py-1">
                  <div className="py-2">
                    <p className="font-medium text-slate-800">Próxima Consulta em 15 min</p>
                    <p className="text-slate-500 text-[11px]">Marcos Vinicius Ribeiro (Consulta Completa)</p>
                  </div>
                  <div className="py-2">
                    <p className="font-medium text-slate-800">Alerta de Estoque Baixo</p>
                    <p className="text-slate-500 text-[11px]">Lentes Tórica Mensal (4 caixas restantes)</p>
                  </div>
                  <div className="py-2">
                    <p className="font-medium text-slate-800 flex items-center gap-1 text-teal-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Sincronização Ativa</span>
                    </p>
                    <p className="text-slate-500 text-[11px]">Banco de dados atualizado em tempo real</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
