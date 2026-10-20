import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, needRefresh, install, updateApp } = usePWAInstall();
  const { consultorio } = useConsultorio();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Verifica se já dispensou o banner nesta sessão
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const appTitle = consultorio?.nomeFantasia || 'Vinnes Optometria';

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. AVISO DE NOVA VERSÃO DISPONÍVEL (Prompt 14)                         */}
      {/* Exibido quando o Service Worker baixa uma versão atualizada            */}
      {/* ===================================================================== */}
      {needRefresh && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white">Nova versão disponível!</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Atualize o aplicativo para aplicar as últimas melhorias do consultório.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={updateApp}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. BANNER "INSTALAR APP" (Prompt 14)                                    */}
      {/* OBRIGATÓRIO: Visível APENAS no mobile (< 1024px, lg:hidden)           */}
      {/* Desktop (>= 1024px) inalterado conforme Prompt 12                     */}
      {/* ===================================================================== */}
      {!isInstalled && !dismissed && (isInstallable || isIOS) && (
        <div className="lg:hidden fixed bottom-16 inset-x-3 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-teal-500/30 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600/30 border border-teal-400/40 text-teal-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-white truncate">
                Instalar App {appTitle}
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                Acesse rápido na tela inicial e use offline
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isInstallable && (
                <button
                  onClick={install}
                  className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar</span>
                </button>
              )}

              {isIOS && !isInstallable && (
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar</span>
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[44px]"
                title="Fechar banner"
                aria-label="Fechar banner de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MODAL DE ORIENTAÇÃO PARA IPHONE (iOS Safari)                        */}
      {/* ===================================================================== */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-600" />
                <span>Instalar no iPhone / iPad</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para instalar o app de gestão do consultório no seu dispositivo iOS:
            </p>

            <ol className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Toque no botão <strong>Compartilhar</strong> (<Share className="w-3.5 h-3.5 inline text-teal-600" />) na barra inferior do Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-teal-600" />).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toque em <strong>Adicionar</strong> no canto superior direito para concluir.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors min-h-[44px]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
