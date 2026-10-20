import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Lock, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { OptoclinLogo } from '../common/OptoclinLogo';

interface FooterPublicProps {
  onOpenPrivacyPolicy?: () => void;
}

export const FooterPublic: React.FC<FooterPublicProps> = ({ onOpenPrivacyPolicy }) => {
  const { consultorio } = useConsultorio();

  const rawWhatsapp = consultorio.whatsappConfig?.numero || consultorio.whatsapp || '(79) 99109-2420';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');
  const instagram = consultorio.redesSociais?.instagram || '@souoptoclin';
  const instagramClean = instagram.replace('@', '');

  return (
    <footer className="bg-[#00241A] text-slate-300 pt-16 pb-12 border-t border-emerald-900/40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Coluna 1: Identidade da Marca & Missão */}
          <div className="space-y-4">
            <OptoclinLogo variant="dark" size="md" />
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Atendimento primário e especializado em saúde visual e avaliações optométricas com foco em precisão, conforto e cuidado individualizado.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#76C900] bg-[#003828] border border-[#76C900]/25 px-3 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#76C900]" />
              <span>Habilitado CBO 3223-05 • Registro CBOO</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida Comercial */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#beneficios" className="hover:text-[#76C900] transition-colors">
                  Benefícios do Exame
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-[#76C900] transition-colors">
                  Exames & Avaliações
                </a>
              </li>
              <li>
                <a href="#diferenciais" className="hover:text-[#76C900] transition-colors">
                  Por que Escolher a Optoclin
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-[#76C900] transition-colors">
                  Como Funciona o Atendimento
                </a>
              </li>
              <li>
                <a href="#agendamento" className="text-[#76C900] font-bold hover:underline">
                  Agendar Exame de Vista
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#76C900] transition-colors">
                  Dúvidas Frequentes (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Localização & Horários */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              Onde Estamos
            </h4>
            <div className="flex items-start gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-[#76C900] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Galeria Norcon Shopping</strong>
                <br />
                {consultorio.endereco?.logradouro || 'Rua João Pessoa'}, {consultorio.endereco?.numero || 'sala 8'}
                <br />
                {consultorio.endereco?.bairro || 'Centro'} — {consultorio.endereco?.cidade || 'Aracaju'}/{consultorio.endereco?.uf || 'SE'}
                <br />
                CEP: {consultorio.endereco?.cep || '49010-130'}
              </p>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300 pt-1">
              <Clock className="w-4 h-4 text-[#76C900] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {consultorio.horarioFuncionamento || 'Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:30 às 13:00'}
              </p>
            </div>
          </div>

          {/* Coluna 4: Contato & Redes Sociais */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              Atendimento Direto
            </h4>
            <div className="space-y-2">
              <a
                href={`https://wa.me/55${cleanWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-[#76C900] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#76C900]" />
                <span>WhatsApp: <strong>{rawWhatsapp}</strong></span>
              </a>
              <a
                href={`https://instagram.com/${instagramClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-[#76C900] transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#76C900]" />
                <span>Instagram: <strong>{instagram}</strong></span>
              </a>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-[#76C900]" />
                <span>{consultorio.email || 'contato@souoptoclin.com.br'}</span>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003828] hover:bg-[#004D38] border border-emerald-800/40 text-emerald-200 rounded-lg text-[11px] font-semibold transition-colors"
                title="Área restrita da equipe"
              >
                <Lock className="w-3 h-3 text-[#76C900]" />
                <span>Acesso da Equipe</span>
              </Link>
              {onOpenPrivacyPolicy && (
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-[11px] text-slate-400 hover:text-[#76C900] underline underline-offset-2 transition-colors"
                >
                  Política de Privacidade
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé inferior / Copyright */}
        <div className="pt-8 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-100/50 gap-3 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} {consultorio.nomeFantasia || 'Optoclin'}. Todos os direitos reservados. CNPJ: {consultorio.cnpj}.
          </p>
          <p>
            Atenção Primária da Saúde Visual e Refrativa • Optometria Clínica e Independente.
          </p>
        </div>
      </div>
    </footer>
  );
};
