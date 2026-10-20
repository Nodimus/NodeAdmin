import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Share, PlusSquare, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { pushNotificationService, PushStatus } from '../../services/push-notification.service';
import { useAuth } from '../../contexts/AuthContext';

export const PushNotificationManager: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const podeReceberPush = hasPermission('agenda.ler');

  // Atualiza status do Web Push
  const checkStatus = async () => {
    try {
      const s = await pushNotificationService.getStatus();
      setStatus(s);
    } catch {
      // Ignora falhas de ambiente
    }
  };

  useEffect(() => {
    if (!user || !podeReceberPush) return;

    checkStatus();

    // Solicita permissão apenas após o login no admin (Prompt 15)
    // Se ainda não foi solicitado e nunca foi dispensado nesta sessão:
    const jaPerguntou = sessionStorage.getItem('push_prompt_dismissed');
    if (!jaPerguntou && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPromptModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, podeReceberPush]);

  const handleSubscribe = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('consultorio_session_token') || '';
      await pushNotificationService.subscribe(token);
      await checkStatus();
      setShowPromptModal(false);
      setFeedback({ tipo: 'sucesso', texto: 'Notificações ativadas! Você receberá alertas de novas consultas.' });
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro ao ativar notificações.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('consultorio_session_token') || '';
      await pushNotificationService.unsubscribe(token);
      await checkStatus();
      setFeedback({ tipo: 'sucesso', texto: 'Notificações desativadas para este dispositivo.' });
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro ao desativar notificações.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('consultorio_session_token') || '';
      const res = await pushNotificationService.sendTestPush(token);
      setFeedback({ tipo: 'sucesso', texto: res.mensagem || 'Notificação de teste enviada com sucesso!' });
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro ao enviar notificação de teste.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowPromptModal(false);
    sessionStorage.setItem('push_prompt_dismissed', 'true');
  };

  if (!user || !podeReceberPush || !status?.supported) {
    return null;
  }

  return (
    <>
      {/* Botão de Notificação no Header */}
      <div className="relative inline-block">
        <button
          onClick={() => {
            if (status.subscribed) {
              handleUnsubscribe();
            } else {
              setShowPromptModal(true);
            }
          }}
          disabled={loading}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px] ${
            status.subscribed
              ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title={status.subscribed ? 'Notificações Push Ativas (Clique para Desativar)' : 'Ativar Notificações da Agenda'}
        >
          {status.subscribed ? (
            <>
              <Bell className="w-4 h-4 text-teal-600 fill-teal-600" />
              <span className="hidden md:inline">Alertas Ativos</span>
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Ativar Alertas</span>
            </>
          )}
        </button>
      </div>

      {/* Toast de Feedback */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl bg-slate-900 text-white p-3.5 shadow-2xl border border-slate-700 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p>{feedback.texto}</p>
            {feedback.tipo === 'sucesso' && status?.subscribed && (
              <button
                onClick={handleTestPush}
                disabled={loading}
                className="mt-2 text-[11px] underline text-teal-400 hover:text-teal-300 font-semibold"
              >
                Enviar notificação de teste agora
              </button>
            )}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal de Ativação / Solicitação Pós-Login (Prompt 15) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Alertas da Agenda Clínica</h3>
                  <p className="text-[11px] text-slate-500">Notificações em tempo real no seu dispositivo</p>
                </div>
              </div>
              <button onClick={handleDismissPrompt} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Receba avisos instantâneos sempre que um paciente agendar uma consulta pelo site ou quando houver lembrete de atendimento.
            </p>

            {/* Explicação Específica para iPhone / iOS (Requisito Estrito do Prompt 15) */}
            {status?.requiresPWAInstallOnIOS && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Smartphone className="w-4 h-4" />
                  <span>Requisito do iPhone (iOS):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  No iPhone, as notificações push só funcionam quando o aplicativo está <strong>instalado na tela inicial</strong>.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1">
                  <p>1. No Safari, toque no botão Compartilhar (<Share className="w-3 h-3 inline text-teal-600" />).</p>
                  <p>2. Selecione "Adicionar à Tela de Início" (<PlusSquare className="w-3 h-3 inline text-teal-600" />).</p>
                  <p>3. Abra o app pelo ícone na tela inicial para ativar o Push.</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                onClick={handleDismissPrompt}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors min-h-[44px]"
              >
                Agora Não
              </button>

              <button
                onClick={handleSubscribe}
                disabled={loading || status?.requiresPWAInstallOnIOS}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                <span>Ativar Notificações</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
