import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { offlineStorageService, OfflineQueueItem } from '../../services/offline-storage.service';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingItems, setPendingItems] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Monitora itens pendentes de sincronização
  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await offlineStorageService.obterItensFilaSync();
      setPendingItems(items);
    } catch {
      setPendingItems([]);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Sincronização da fila com o servidor
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    const items = await offlineStorageService.obterItensFilaSync();
    if (items.length === 0) return;

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('consultorio_session_token');
      if (!token) {
        setIsSyncing(false);
        return;
      }

      const res = await fetch('/api/admin/sync/process-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itens: items }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.resultados && Array.isArray(data.resultados)) {
          for (const resItem of data.resultados) {
            if (resItem.sucesso) {
              await offlineStorageService.removerItemFila(resItem.id);
            } else if (resItem.conflito) {
              await offlineStorageService.marcarConflitoItem(resItem.id, resItem.motivo || 'Conflito detectado');
              // Exibe aviso formal para o usuário (conforme exigido pelo Prompt 15)
              setConflictWarning(resItem.motivo || 'Houve um conflito de concorrência com o servidor.');
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao processar sincronização offline:', err);
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [isOnline, isSyncing, refreshPendingCount]);

  // Efeito ao reconectar
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      // Tenta sincronizar automaticamente ao reconectar
      processSyncQueue();
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, processSyncQueue]);

  const pendentesCount = pendingItems.filter((i) => i.status !== 'conflito').length;
  const conflitosCount = pendingItems.filter((i) => i.status === 'conflito').length;

  return (
    <>
      {/* 1. Modal de Aviso de Conflito de Sincronização (Regra Prompt 15) */}
      {conflictWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900">Aviso de Conflito de Sincronização</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{conflictWarning}</p>
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  Os dados do servidor foram preservados para evitar sobrescrita acidental. Por favor, revise o agendamento no painel.
                </p>
              </div>
            </div>

            <button
              onClick={() => setConflictWarning(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors min-h-[44px]"
            >
              Compreendi
            </button>
          </div>
        </div>
      )}

      {/* 2. Barra / Toast Flutuante de Status Online/Offline e Fila de Sincronização */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2 print:hidden pointer-events-auto">
        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2.5 text-xs font-semibold shadow-lg border border-amber-400/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span>Modo Offline — Sem conexão à internet</span>
              {pendentesCount > 0 && (
                <span className="text-[10px] text-amber-200 font-normal">
                  {pendentesCount} {pendentesCount === 1 ? 'mutação pendente' : 'mutações pendentes'} na fila
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reconectado Toast */}
        {isOnline && showReconnected && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Conexão restabelecida! Sincronizando com o consultório...</span>
          </div>
        )}

        {/* Itens Pendentes de Sincronização (quando online ou com conflitos) */}
        {isOnline && (pendentesCount > 0 || conflitosCount > 0) && (
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 text-xs font-medium shadow-xl border border-teal-500/30">
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {pendentesCount > 0
                ? `${pendentesCount} ${pendentesCount === 1 ? 'item pendente' : 'itens pendentes'} de sincronização`
                : `${conflitosCount} ${conflitosCount === 1 ? 'conflito pendente' : 'conflitos pendentes'}`}
            </span>
            <button
              onClick={processSyncQueue}
              disabled={isSyncing}
              className="ml-1 px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] transition-colors disabled:opacity-50 min-h-[32px] cursor-pointer"
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
