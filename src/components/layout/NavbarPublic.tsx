import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, Phone, CalendarCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { OptoclinLogo } from '../common/OptoclinLogo';

export const NavbarPublic: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { consultorio } = useConsultorio();

  const rawWhatsapp = consultorio.whatsappConfig?.numero || consultorio.whatsapp || '(79) 99109-2420';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');
  const mensagemInicial =
    consultorio.whatsappConfig?.mensagemInicial ||
    'Olá! Gostaria de agendar meu exame de vista na Optoclin.';
  const whatsappUrl = `https://wa.me/55${cleanWhatsapp}?text=${encodeURIComponent(mensagemInicial)}`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo da Optoclin */}
          <Link to="/" className="flex items-center group py-2" title="Optoclin — Exames de Vista e Cuidados Visuais">
            <OptoclinLogo size="md" />
          </Link>

          {/* Navegação Comercial Desktop */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-slate-700">
            <a href="#beneficios" className="hover:text-[#004D38] transition-colors">
              Benefícios
            </a>
            {consultorio.secoesVisiveis?.servicos !== false && (
              <a href="#servicos" className="hover:text-[#004D38] transition-colors">
                Exames & Serviços
              </a>
            )}
            <a href="#diferenciais" className="hover:text-[#004D38] transition-colors">
              Por que a Optoclin
            </a>
            <a href="#como-funciona" className="hover:text-[#004D38] transition-colors">
              Como Funciona
            </a>
            <a href="#faq" className="hover:text-[#004D38] transition-colors">
              Perguntas Frequentes
            </a>
            {consultorio.secoesVisiveis?.contato !== false && (
              <a href="#contato" className="hover:text-[#004D38] transition-colors">
                Localização
              </a>
            )}
          </nav>

          {/* Ações de Conversão Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#004D38] border border-emerald-200/80 font-bold text-xs transition-colors"
              title="Fale diretamente pelo WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-[#004D38]" />
              <span>{rawWhatsapp}</span>
            </a>

            <a
              href="#agendamento"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#76C900] hover:bg-[#86E400] active:scale-95 text-[#003828] font-extrabold text-xs shadow-md shadow-[#76C900]/25 transition-all"
            >
              <CalendarCheck className="w-4 h-4 text-[#003828]" />
              <span>Agendar Exame</span>
            </a>

            {user ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#004D38] hover:bg-[#003828] text-white font-semibold text-xs shadow-xs transition-all ml-1"
                title="Painel Administrativo"
              >
                <span>Painel</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#76C900]" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-slate-500 hover:text-[#004D38] text-xs font-medium transition-colors"
                title="Acesso da equipe interna"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Equipe</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href="#agendamento"
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#76C900] text-[#003828] font-extrabold text-xs shadow-xs"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-[#004D38] hover:bg-emerald-50 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#004D38]" /> : <Menu className="w-6 h-6 text-[#004D38]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-emerald-900/10 bg-white px-5 pt-3 pb-6 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            <a
              href="#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
            >
              Benefícios da Avaliação
            </a>
            {consultorio.secoesVisiveis?.servicos !== false && (
              <a
                href="#servicos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
              >
                Exames & Serviços
              </a>
            )}
            <a
              href="#diferenciais"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
            >
              Por que a Optoclin
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
            >
              Como Funciona o Atendimento
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
            >
              Perguntas Frequentes (FAQ)
            </a>
            {consultorio.secoesVisiveis?.contato !== false && (
              <a
                href="#contato"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#004D38] min-h-[44px] flex items-center"
              >
                Localização & Contato
              </a>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <a
              href="#agendamento"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-[#76C900] text-[#003828] font-black text-sm shadow-md shadow-[#76C900]/25 min-h-[44px] flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-4 h-4 text-[#003828]" />
              <span>Agendar meu Exame de Vista</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center py-3 rounded-xl bg-[#004D38] text-white font-bold text-sm shadow-xs min-h-[44px] flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#76C900]" />
              <span>Falar no WhatsApp ({rawWhatsapp})</span>
            </a>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 text-xs hover:bg-slate-50 min-h-[40px] flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Acesso da Equipe Interna</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
