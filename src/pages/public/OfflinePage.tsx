import React from 'react';
import { WifiOff, RotateCcw, Home, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfflinePage: React.FC = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <WifiOff className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            Sem Conexão
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Você está desconectado
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Não foi possível carregar esta página porque o dispositivo está sem acesso à internet no momento.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 text-left space-y-2.5">
          <p className="font-bold text-slate-900">O que você pode fazer:</p>
          <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
            <li>Verificar a sua conexão Wi-Fi ou dados móveis</li>
            <li>Consultar dados já carregados no dispositivo</li>
            <li>Reconectar para sincronizar alterações com o servidor</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>

          <Link
            to="/admin"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Voltar ao Início do App</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
