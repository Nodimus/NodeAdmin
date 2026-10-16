import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Glasses, Menu, X, ShieldCheck, ArrowRight, Phone, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const NavbarPublic: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { consultorio } = useConsultorio();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Nome do Consultório (Vindo do Registro Único) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                {consultorio.nomeFantasia}
              </span>
              <p className="text-xs font-medium text-slate-600 tracking-wide">
                {consultorio.responsavelTecnico} • {consultorio.registroResponsavelTecnico}
              </p>
            </div>
          </Link>

          {/* Navegação Institucional Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#servicos" className="hover:text-teal-600 transition-colors">
              Exames & Serviços
            </a>
            <a href="#sobre" className="hover:text-teal-600 transition-colors">
              O Consultório
            </a>
            <a href="#contato" className="hover:text-teal-600 transition-colors">
              Localização & Horários
            </a>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Optometria Clínica Particular</span>
            </div>
          </nav>

          {/* Ações Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={`https://wa.me/55${consultorio.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1,%20gostaria%20de%20agendar%20uma%20consulta%20optom%C3%A9trica.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{consultorio.whatsapp}</span>
            </a>

            {user ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <span>Painel do Consultório</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                title="Acesso restrito para a equipe do consultório"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Área da Equipe</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <a
            href="#servicos"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Exames & Serviços
          </a>
          <a
            href="#sobre"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            O Consultório
          </a>
          <a
            href="#contato"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Localização & Horários
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://wa.me/55${consultorio.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm shadow"
            >
              Agendar via WhatsApp ({consultorio.whatsapp})
            </a>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-800 text-sm hover:bg-slate-50"
            >
              Área Restrita da Equipe
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
