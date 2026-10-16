import React from 'react';
import { Glasses, MapPin, Phone, Mail, Clock, Shield, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const FooterPublic: React.FC = () => {
  const { consultorio } = useConsultorio();

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Coluna 1: Nome & Dados Legais */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <Glasses className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">
                {consultorio.nomeFantasia}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {consultorio.razaoSocial}
              <br />
              CNPJ: {consultorio.cnpj} • Registro: {consultorio.registroProfissional}
              <br />
              Responsável Técnico: {consultorio.responsavelTecnico} ({consultorio.registroResponsavelTecnico})
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-400 bg-teal-950/60 border border-teal-800/60 px-3 py-1.5 rounded-lg w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>Atendimento em conformidade com CBO 3223-05 e CBOO</span>
            </div>
          </div>

          {/* Coluna 2: Localização e Horários */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              Endereço & Atendimento
            </h4>
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <span>
                {consultorio.endereco.logradouro}, {consultorio.endereco.numero}
                {consultorio.endereco.complemento ? ` - ${consultorio.endereco.complemento}` : ''}
                <br />
                {consultorio.endereco.bairro} — {consultorio.endereco.cidade}/{consultorio.endereco.uf} — CEP {consultorio.endereco.cep}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500 shrink-0" />
              <span>{consultorio.horarioFuncionamento}</span>
            </p>
          </div>

          {/* Coluna 3: Contatos e Acesso Restrito */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              Contato & Agendamento
            </h4>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-500 shrink-0" />
              <span>Telefone: {consultorio.telefone}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>WhatsApp: {consultorio.whatsapp}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-500 shrink-0" />
              <span>{consultorio.email}</span>
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>Acesso do Profissional / Equipe</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            © {new Date().getFullYear()} {consultorio.nomeFantasia}. Todos os direitos reservados.
          </p>
          <p>
            Sistema de Gestão Interna de Consultório Optométrico Particular
          </p>
        </div>
      </div>
    </footer>
  );
};
