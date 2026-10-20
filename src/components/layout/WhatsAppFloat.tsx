import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const WhatsAppFloat: React.FC = () => {
  const { consultorio } = useConsultorio();
  const [showTooltip, setShowTooltip] = useState(true);

  const rawNumber = consultorio.whatsappConfig?.numero || consultorio.whatsapp || '(79) 99109-2420';
  const cleanNumber = rawNumber.replace(/\D/g, '');
  const mensagemInicial =
    consultorio.whatsappConfig?.mensagemInicial ||
    'Olá! Gostaria de agendar meu exame de vista na Optoclin.';

  if (!cleanNumber) return null;

  const whatsappUrl = `https://wa.me/55${cleanNumber}?text=${encodeURIComponent(mensagemInicial)}`;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end print:hidden">
      {/* Balão de Notificação / Chamada Comercial */}
      {showTooltip && (
        <div className="mb-2 hidden sm:flex items-center gap-3 bg-white text-slate-800 text-xs py-2.5 px-4 rounded-2xl shadow-2xl border border-emerald-900/15 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xs">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#76C900] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#76C900]"></span>
          </span>
          <div>
            <p className="font-extrabold text-[#004D38] leading-tight text-xs">Agende seu Exame</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Tire dúvidas e marque pelo WhatsApp</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            aria-label="Fechar aviso do WhatsApp"
            className="text-slate-400 hover:text-slate-700 ml-1 p-1 rounded-md min-h-[24px] min-w-[24px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botão Flutuante Principal */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Conversar no WhatsApp com ${consultorio.nomeFantasia || 'Optoclin'}`}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#76C900] hover:bg-[#86E400] text-[#003828] shadow-lg shadow-[#76C900]/30 hover:shadow-xl hover:shadow-[#76C900]/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#76C900]/50"
      >
        <span className="absolute -inset-1 rounded-full bg-[#76C900]/25 animate-pulse pointer-events-none"></span>
        <MessageCircle className="w-7 h-7 relative z-10 fill-current" />
      </a>
    </div>
  );
};
