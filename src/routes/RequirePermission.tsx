import React from 'react';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';

interface RequirePermissionProps {
  perm: string;
  children?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ perm, children }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Validando permissões de acesso...</p>
      </div>
    );
  }

  // Se não autenticado, redireciona ao login salvando a rota tentada
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se o usuário tem a permissão necessária
  const allowed = hasPermission(user.permissoes, perm);

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider mb-2">
            Erro 403 - Acesso Negado
          </span>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Permissão Insuficiente
          </h2>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Seu perfil atual de <strong className="text-slate-800">{user.papelNome || user.role}</strong> não possui autorização para acessar este recurso.
          </p>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-xs mb-6 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Permissão requerida:</span>
              <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800 font-semibold">
                {perm}
              </code>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Usuário autenticado:</span>
              <span className="font-medium text-slate-700 truncate max-w-[180px]">{user.email}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => navigate('/admin')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Trocar de Conta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
