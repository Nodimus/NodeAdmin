import React from 'react';
import { Link } from 'react-router-dom';
import {
  Glasses,
  Eye,
  CalendarCheck,
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  Award,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { NavbarPublic } from '../../components/layout/NavbarPublic';
import { FooterPublic } from '../../components/layout/FooterPublic';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const LandingPage: React.FC = () => {
  const { consultorio } = useConsultorio();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <NavbarPublic />

      <main className="flex-1">
        {/* HERO SECTION INSTITUCIONAL DO CONSULTÓRIO */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-radial-[at_top_right] from-teal-50 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Texto Principal */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Atendimento Optométrico Clínico Especializado</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Cuidando da sua saúde visual com{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                    precisão e conforto
                  </span>
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Bem-vindo ao <strong>{consultorio.nomeFantasia}</strong>. Realizamos exames refrativos completos para prescrição de óculos, acuidade visual, adaptação especializada de lentes de contato e triagem visual infantil.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href={`https://wa.me/55${consultorio.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1,%20gostaria%20de%20agendar%20uma%20consulta%20no%20consult%C3%B3rio.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Agendar Consulta no WhatsApp</span>
                  </a>
                  <a
                    href="#servicos"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold text-base transition-colors"
                  >
                    <span>Conhecer Nossos Exames</span>
                  </a>
                </div>

                {/* Badges de Credibilidade */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-slate-600 font-medium">Habilitado CBO 3223-05</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-slate-600 font-medium">{consultorio.registroProfissional}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-slate-600 font-medium">Atendimento com Hora Marcada</span>
                  </div>
                </div>
              </div>

              {/* Card Institucional do Consultório */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800 text-white space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{consultorio.nomeFantasia}</h3>
                        <p className="text-xs text-teal-400">Responsável Técnico: {consultorio.responsavelTecnico}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Endereço do Gabinete</p>
                      <p className="font-semibold text-white mt-1">
                        {consultorio.endereco.logradouro}, {consultorio.endereco.numero}
                        {consultorio.endereco.complemento ? ` - ${consultorio.endereco.complemento}` : ''}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {consultorio.endereco.bairro} — {consultorio.endereco.cidade}/{consultorio.endereco.uf}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Horários de Atendimento</p>
                      <p className="font-semibold text-white mt-1">{consultorio.horarioFuncionamento}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Telefone & WhatsApp</p>
                        <p className="font-bold text-emerald-400 mt-0.5">{consultorio.whatsapp}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                        Disponível
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <Link
                      to="/login"
                      className="text-xs text-slate-400 hover:text-teal-300 font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Área Restrita / Acesso da Equipe do Consultório</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVIÇOS & EXAMES OFERECIDOS */}
        <section id="servicos" className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">
                Nossos Atendimentos
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Procedimentos realizados no consultório
              </p>
              <p className="mt-3 text-slate-600 text-base">
                Avaliação visual minuciosa com equipamentos computadorizados e prescrição precisa para o seu dia a dia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Exame de Refração Completo
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Determinação precisa de miopia, hipermetropia, astigmatismo e presbiopia (vista cansada) com emissão de receita oftálmica detalhada.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-5">
                  <Glasses className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Adaptação de Lentes de Contato
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Avaliação corneana e ceratometria para seleção da melhor curvatura e material de lentes gelatinosas ou rígidas para seu conforto.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Triagem Visual Infantil
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Acompanhamento precoce de dificuldades visuais escolares, estrabismos sutis e prevenção de ambliopia (olho preguiçoso).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* O CONSULTÓRIO */}
        <section id="sobre" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-5">
                <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                  Atendimento Humanizado
                </h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Sobre o {consultorio.nomeFantasia}
                </h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Nosso consultório foi estruturado para proporcionar uma experiência acolhedora e precisa. Cada consulta é realizada com tempo dedicado para ouvir as queixas visuais, analisar hábitos de trabalho diante de telas e orientar a melhor solução óptica.
                </p>

                <div className="space-y-3 pt-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Responsável Técnico: <strong>{consultorio.responsavelTecnico}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Registro Profissional: <strong>{consultorio.registroResponsavelTecnico}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Ambiente climatizado com equipamentos calibrados e biossegurança</span>
                  </div>
                </div>

                <div className="pt-4">
                  <a
                    href={`https://wa.me/55${consultorio.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1,%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20as%20consultas.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all"
                  >
                    <span>Falar Conosco no WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div id="contato" className="bg-slate-50 rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                  <h4 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
                    Localização & Informações
                  </h4>

                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Endereço</p>
                        <p className="text-slate-600 mt-0.5">
                          {consultorio.endereco.logradouro}, {consultorio.endereco.numero}
                          {consultorio.endereco.complemento ? ` (${consultorio.endereco.complemento})` : ''}
                          <br />
                          {consultorio.endereco.bairro} — {consultorio.endereco.cidade}/{consultorio.endereco.uf}
                          <br />
                          CEP: {consultorio.endereco.cep}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Horário de Funcionamento</p>
                        <p className="text-slate-600 mt-0.5">{consultorio.horarioFuncionamento}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Canais de Contato</p>
                        <p className="text-slate-600 mt-0.5">
                          Telefone: {consultorio.telefone}
                          <br />
                          WhatsApp: {consultorio.whatsapp}
                          <br />
                          E-mail: {consultorio.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterPublic />
    </div>
  );
};
