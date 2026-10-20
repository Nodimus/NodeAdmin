import React, { useState, useEffect } from 'react';
import {
  Eye,
  CalendarCheck,
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  Award,
  ArrowRight,
  Star,
  Quote,
  CheckCircle2,
  Calendar,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  Activity,
  Layers,
  Compass,
  Instagram,
  Monitor,
  Zap,
} from 'lucide-react';
import { NavbarPublic } from '../../components/layout/NavbarPublic';
import { FooterPublic } from '../../components/layout/FooterPublic';
import { WhatsAppFloat } from '../../components/layout/WhatsAppFloat';
import { PrivacyPolicyModal } from '../../components/public/PrivacyPolicyModal';
import { BookingForm } from '../../components/public/BookingForm';
import { consultorioService } from '../../services/consultorio.service';
import { ConsultorioPublicData, Consultorio } from '../../types';
import { INITIAL_CONSULTORIO } from '../../services/storage-local';

export const LandingPage: React.FC = () => {
  const [dados, setDados] = useState<ConsultorioPublicData>(INITIAL_CONSULTORIO);
  const [loading, setLoading] = useState<boolean>(true);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [servicoSelecionadoParaAgendamento, setServicoSelecionadoParaAgendamento] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=true');

  // Carrega os dados públicos institucionais da Optoclin
  useEffect(() => {
    let isMounted = true;

    if (isPreview) {
      try {
        const draftStr = sessionStorage.getItem('consultorio_home_preview');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setDados(draft);
          setLoading(false);
          return;
        }
      } catch {
        // fallback
      }
    }

    consultorioService.getDadosPublicos().then((res) => {
      if (isMounted) {
        setDados(res);
        setLoading(false);
      }
    });

    const unsubscribe = consultorioService.subscribe((fullData) => {
      if (isMounted && !isPreview) {
        const { updatedAt, ...publicFields } = fullData;
        setDados(publicFields);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isPreview]);

  // SEO: Sincroniza título da página, meta description e Schema.org MedicalBusiness
  useEffect(() => {
    if (!dados) return;

    const titulo = dados.seo?.titulo || 'Optoclin | Exames de Vista e Avaliação Optométrica em Aracaju';
    document.title = titulo;

    const desc =
      dados.seo?.descricao ||
      'Exame de vista completo, avaliação da acuidade visual e saúde dos seus olhos na Optoclin. Atendimento humanizado e sem pressa na Galeria Norcon Shopping, Centro de Aracaju.';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    let scriptTag = document.getElementById('jsonld-localbusiness') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'jsonld-localbusiness';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: dados.nomeFantasia || 'Optoclin',
      legalName: dados.razaoSocial || 'Optoclin Cuidados Visuais & Optometria Ltda',
      description: desc,
      telephone: dados.telefone || '(79) 99109-2420',
      email: dados.email || 'contato@souoptoclin.com.br',
      address: {
        '@type': 'PostalAddress',
        streetAddress: `${dados.endereco?.logradouro || 'Rua João Pessoa'}, ${dados.endereco?.numero || 'sala 8'}`,
        addressLocality: dados.endereco?.cidade || 'Aracaju',
        addressRegion: dados.endereco?.uf || 'SE',
        postalCode: dados.endereco?.cep || '49010-130',
        addressCountry: 'BR',
      },
      openingHours: dados.horarioFuncionamento || 'Mo-Fr 08:00-18:00, Sa 08:30-13:00',
      priceRange: '$$',
    };

    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      const el = document.getElementById('jsonld-localbusiness');
      if (el) el.remove();
    };
  }, [dados]);

  // Contatos comerciais
  const rawWhatsapp = dados.whatsappConfig?.numero || dados.whatsapp || '(79) 99109-2420';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');
  const mensagemInicial =
    dados.whatsappConfig?.mensagemInicial ||
    'Olá! Gostaria de agendar meu exame de vista na Optoclin.';
  const whatsappUrl = `https://wa.me/55${cleanWhatsapp}?text=${encodeURIComponent(mensagemInicial)}`;
  const instagram = dados.redesSociais?.instagram || '@souoptoclin';
  const instagramClean = instagram.replace('@', '');

  // Serviços e Depoimentos ativos
  const servicosAtivos = (dados.servicos || []).filter((s) => s.ativo);
  const depoimentosValidos = (dados.depoimentos || []).filter(
    (d) => d.ativo && d.autorizacaoPaciente
  );

  // Lista padrão de benefícios comerciais com foco em conversão
  const beneficios = [
    {
      icon: Activity,
      titulo: 'Conforto e Fim da Fadiga Visual',
      descricao:
        'Dores de cabeça no fim da tarde, vista embaçada e queimação nos olhos são sinais clássicos de sobrecarga refrativa. Identificamos e corrigimos a raiz do problema com precisão.',
      destaque: 'Alívio real no dia a dia',
    },
    {
      icon: ShieldCheck,
      titulo: 'Prevenção Ativa da Visão',
      descricao:
        'Acompanhamento optométrico contínuo para detectar alterações na graduação e disfunções acomodativas antes que interfiram no seu trabalho, estudos e condução.',
      destaque: 'Cuidado contínuo',
    },
    {
      icon: Compass,
      titulo: 'Precisão Refrativa Milimétrica',
      descricao:
        'Protocolo clínico cuidadoso com equipamentos computadorizados calibrados para medir com exatidão sua necessidade óptica para longe, meia distância e leitura.',
      destaque: 'Foco nítido e estável',
    },
    {
      icon: HeartHandshake,
      titulo: 'Atendimento Humanizado Sem Pressa',
      descricao:
        'Aqui cada consulta dura o tempo necessário para você tirar todas as dúvidas, testar o conforto das lentes de teste e entender sua saúde visual em detalhes.',
      destaque: 'Tempo dedicado a você',
    },
  ];

  // Perguntas Frequentes (FAQ) focado em Optometria e Exames de Vista
  const faqItems = [
    {
      pergunta: 'Quem deve fazer o exame optométrico de vista e com que frequência?',
      resposta:
        'Recomenda-se realizar uma avaliação optométrica completa ao menos uma vez ao ano, ou sempre que notar sinais como dores de cabeça após leitura, visão turva, ardência nos olhos ou dificuldade para focar em telas digitais. O exame é indicado para crianças em fase escolar, adultos e idosos.',
    },
    {
      pergunta: 'O que é avaliado durante o exame de vista na Optoclin?',
      resposta:
        'Realizamos uma avaliação refrativa minuciosa da acuidade visual (longe e perto), análise computadorizada da refração ocular (miopia, hipermetropia, astigmatismo e presbiopia), avaliação da visão binocular, coordenação motora dos olhos, teste de estresse visual e conforto em lentes de prova.',
    },
    {
      pergunta: 'A Optoclin vende óculos ou armações no local?',
      resposta:
        'Não! Mantemos absoluta independência clínica e ética: nosso compromisso é 100% voltado à avaliação da sua saúde visual e à prescrição precisa do seu grau. Você recebe sua receita completa e tem total liberdade para confeccionar seus óculos onde desejar.',
    },
    {
      pergunta: 'O exame pode me ajudar com cansaço ao trabalhar no computador e celular?',
      resposta:
        'Sim, com certeza. A fadiga visual digital é uma das queixas mais comuns atualmente. Realizamos testes específicos de acomodação e visão de perto/meia distância para prescrever lentes com suporte acomodativo, filtros específicos e orientações ergonômicas para sua rotina.',
    },
    {
      pergunta: 'Preciso de encaminhamento prévio para agendar meu exame?',
      resposta:
        'Não é necessário encaminhamento prévio. Você pode agendar sua avaliação diretamente pelo nosso formulário online ou via WhatsApp, escolhendo o dia e horário mais convenientes.',
    },
    {
      pergunta: 'Qual o endereço e como chego ao consultório da Optoclin?',
      resposta:
        'Estamos localizados no coração de Aracaju: Rua João Pessoa, sala 8, Centro — na tradicional Galeria Norcon Shopping. O local conta com fácil acesso, segurança e estrutura climatizada e acessível.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#76C900] selection:text-[#00241A]">
      {/* Banner de Modo Pré-visualização se aplicável */}
      {isPreview && (
        <div className="sticky top-0 z-50 bg-amber-400 text-amber-950 px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-md">
          <span>⚠️ Você está visualizando o rascunho da página (Modo Pré-visualização). As alterações ainda não foram publicadas.</span>
          <a href="/admin/home" className="underline hover:text-black">
            Voltar ao Painel
          </a>
        </div>
      )}

      {/* Navbar com Identidade Optoclin */}
      <NavbarPublic />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. HERO PRINCIPAL: IMAGEM PROFISSIONAL & ALTO IMPACTO     */}
        {/* ========================================================= */}
        {dados.secoesVisiveis?.hero !== false && (
          <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-[#004D38] via-[#003828] to-[#00241A] text-white pt-10 pb-20 md:pt-16 md:pb-28">
            {/* Elementos Decorativos de Fundo / Brilhos e Curvas Fluidas */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#76C900]/15 blur-3xl" />
              <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-[#76C900]/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(118,201,0,0.12),transparent_50%)]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                {/* Coluna de Texto e Conversão */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  {/* Badge de Credibilidade */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#003828] border border-[#76C900]/40 text-[#76C900] text-xs font-black tracking-wide shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#76C900]" />
                    <span>CENTRO DE SAÚDE VISUAL & AVALIAÇÃO OPTOMÉTRICA</span>
                  </div>

                  {/* Título Impactante da Marca */}
                  <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.12] text-white">
                    {dados.hero?.titulo || 'Sua visão merece precisão, conforto e cuidado especializado.'}
                  </h1>

                  {/* Subtítulo Persuasivo */}
                  <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                    {dados.hero?.subtitulo ||
                      'Na Optoclin, realizamos exames de vista e avaliações optométricas completas com tecnologia moderna, atendimento humanizado e foco total no seu bem-estar visual.'}
                  </p>

                  {/* Chamadas para Ação em Destaque */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                    <a
                      href="#agendamento"
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-base shadow-xl shadow-[#76C900]/25 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[52px]"
                    >
                      <CalendarCheck className="w-5 h-5 text-[#003828]" />
                      <span>{dados.hero?.textoBotao || 'Agendar meu exame de vista'}</span>
                    </a>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-sm backdrop-blur-md transition-all min-h-[52px]"
                    >
                      <Phone className="w-4 h-4 text-[#76C900]" />
                      <span>Falar no WhatsApp ({rawWhatsapp})</span>
                    </a>
                  </div>

                  {/* Selos de Credibilidade e Registro */}
                  <div className="pt-6 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#76C900]/20 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-[#76C900]" />
                      </div>
                      <span className="text-emerald-100/90 font-semibold leading-tight">Atendimento Pontual Sem Filas</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#76C900]/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-[#76C900]" />
                      </div>
                      <span className="text-emerald-100/90 font-semibold leading-tight">Tecnologia Computadorizada</span>
                    </div>

                    <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                      <div className="w-7 h-7 rounded-lg bg-[#76C900]/20 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-[#76C900]" />
                      </div>
                      <span className="text-emerald-100/90 font-semibold leading-tight">Galeria Norcon • Centro Aracaju</span>
                    </div>
                  </div>
                </div>

                {/* Coluna Visual: Fotografia de Alta Qualidade do Exame Optométrico */}
                <div className="lg:col-span-5 relative">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    {/* Borda Glow Decorativa */}
                    <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-[#76C900]/60 to-emerald-500/20 blur-md opacity-75" />

                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 bg-[#003828]">
                      <div className="relative h-72 sm:h-88 lg:h-96 w-full overflow-hidden">
                        <img
                          src={
                            dados.hero?.imagemUrl ||
                            'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'
                          }
                          alt="Avaliação optométrica e exame de vista na Optoclin"
                          className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#00241A] via-transparent to-transparent opacity-90" />
                        
                        {/* Selo no Card */}
                        <div className="absolute top-4 right-4 bg-[#004D38]/90 backdrop-blur-md border border-[#76C900]/40 text-[#76C900] text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg">
                          CONSULTÓRIO CLÍNICO
                        </div>

                        <div className="absolute bottom-4 left-5 right-5 text-white">
                          <p className="text-xs uppercase font-extrabold tracking-wider text-[#76C900]">
                            Optometria Clínica Especializada
                          </p>
                          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                            {dados.nomeFantasia || 'Optoclin'} • Aracaju/SE
                          </h2>
                          <p className="text-xs text-emerald-100/80 mt-0.5">
                            Galeria Norcon Shopping • Rua João Pessoa, sala 8
                          </p>
                        </div>
                      </div>

                      {/* Informações Rápidas no Rodapé da Imagem */}
                      <div className="p-5 bg-[#003828] border-t border-emerald-900/40 grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#76C900] shrink-0" />
                          <span className="text-emerald-100 font-medium">Seg a Sex 08h-18h | Sáb 08h30-13h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#76C900] shrink-0" />
                          <span className="text-emerald-100 font-bold">{rawWhatsapp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curva Fluida Inferior Dividindo Hero da Próxima Seção */}
            <div className="absolute bottom-0 inset-x-0 overflow-hidden leading-none z-10 pointer-events-none">
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="relative block w-full h-8 sm:h-12 text-white fill-current"
              >
                <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" />
              </svg>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 2. SEÇÃO DE BENEFÍCIOS: CONFORTO, PREVENÇÃO E BEM-ESTAR   */}
        {/* ========================================================= */}
        <section id="beneficios" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#004D38] text-xs font-black uppercase tracking-wider mb-3">
                Por que Cuidar da Sua Visão?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Mais conforto, clareza e bem-estar para o seu dia a dia
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                A visão responde por mais de 80% dos estímulos que recebemos. Pequenas alterações refrativas não corrigidas causam cansaço precoce, perda de rendimento e desconforto evitável.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {beneficios.map((b, index) => {
                const IconComponent = b.icon;
                return (
                  <div
                    key={index}
                    className="relative p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#76C900] transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Ícone com Destaque em Verde Optoclin */}
                      <div className="w-14 h-14 rounded-2xl bg-[#004D38] text-[#76C900] flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-7 h-7" />
                      </div>

                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#004D38] mb-1">
                        {b.destaque}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-2.5 leading-snug">
                        {b.titulo}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {b.descricao}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#004D38] group-hover:text-[#00241A]">
                      <CheckCircle2 className="w-4 h-4 text-[#76C900]" />
                      <span>Avaliação minuciosa</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chamada sutil para ação pós-benefícios */}
            <div className="mt-14 text-center">
              <a
                href="#agendamento"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#004D38] hover:bg-[#003828] text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.01]"
              >
                <span>Sentindo cansaço nos olhos? Agende sua avaliação</span>
                <ArrowRight className="w-4 h-4 text-[#76C900]" />
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. SERVIÇOS & AVALIAÇÕES OPTOMÉTRICAS ESPECIALIZADAS      */}
        {/* ========================================================= */}
        {dados.secoesVisiveis?.servicos !== false && servicosAtivos.length > 0 && (
          <section id="servicos" className="py-20 bg-emerald-50/40 border-y border-emerald-900/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#004D38] text-[#76C900] text-xs font-black uppercase tracking-wider mb-3">
                  Procedimentos Clínicos
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Serviços e Exames Realizados na Optoclin
                </h2>
                <p className="mt-3 text-slate-600 text-base leading-relaxed">
                  Avaliações optométricas com equipamentos calibrados, conforto absoluto e rigor técnico para uma prescrição exata.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicosAtivos.map((servico) => (
                  <div
                    key={servico.id}
                    className="relative flex flex-col justify-between p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#004D38] transition-all duration-300 group"
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[#004D38] flex items-center justify-center group-hover:bg-[#004D38] group-hover:text-[#76C900] transition-colors duration-200">
                          <Eye className="w-6 h-6" />
                        </div>
                        {servico.destaque && (
                          <span className="px-3 py-1 rounded-full bg-[#76C900]/20 border border-[#76C900]/60 text-[#004D38] text-[11px] font-black uppercase tracking-wide">
                            Mais Procurado
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-2.5 leading-snug group-hover:text-[#004D38] transition-colors">
                        {servico.nome}
                      </h3>

                      {servico.descricao && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                          {servico.descricao}
                        </p>
                      )}
                    </div>

                    <div>
                      {/* Metadados: Duração e Preço (Zero-Pill Discipline) */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mb-4">
                        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#004D38]" />
                          <span>Duração: aprox. {servico.duracaoMin} min</span>
                        </span>

                        {servico.precoCentavos > 0 && (
                          <span className="font-black text-slate-900 text-sm">
                            {(servico.precoCentavos / 100).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Botão de Agendamento Específico */}
                      <a
                        href="#agendamento"
                        onClick={() => setServicoSelecionadoParaAgendamento(servico.id)}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-[#76C900] text-[#004D38] hover:text-[#00241A] font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Agendar este Exame</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão de Conversão para Agendar Todos */}
              <div className="mt-14 text-center">
                <a
                  href="#agendamento"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-sm shadow-xl shadow-[#76C900]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CalendarCheck className="w-5 h-5 text-[#003828]" />
                  <span>Escolha o melhor dia e agende seu horário</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 4. POR QUE ESCOLHER A OPTOCLIN: AUTONOMIA & DIFERENCIAIS   */}
        {/* ========================================================= */}
        <section id="diferenciais" className="py-20 bg-gradient-to-br from-[#004D38] via-[#003828] to-[#00241A] text-white relative overflow-hidden">
          {/* Luz de Fundo e Detalhes Decorativos */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#76C900]/10 blur-3xl" />
            <div className="absolute bottom-0 left-10 w-96 h-96 rounded-full bg-[#76C900]/10 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Coluna de Texto e Diferenciais */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00241A] border border-[#76C900]/40 text-[#76C900] text-xs font-black uppercase tracking-wider">
                  Diferenciais Exclusivos
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Por que escolher a Optoclin para o seu exame de vista?
                </h2>

                <p className="text-emerald-100/90 text-base leading-relaxed">
                  Oferecemos um modelo de atendimento clínico acolhedor, onde sua saúde visual é a única prioridade. Diferente de óticas comerciais, aqui você é ouvido com atenção e sem qualquer pressão de compra.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-5 rounded-2xl bg-[#003828] border border-[#76C900]/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#76C900] text-[#003828] flex items-center justify-center shrink-0 font-black">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Atendimento 100% Humanizado e Individual</h3>
                      <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                        Consultas tranquilas, com tempo suficiente para investigar histórico visual, queixas de dores de cabeça e hábitos de trabalho no computador.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#003828] border border-[#76C900]/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#76C900] text-[#003828] flex items-center justify-center shrink-0 font-black">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Equipamentos Computadorizados Modernos</h3>
                      <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                        Refração objetiva e subjetiva com instrumentos de alta tecnologia para medição exata do grau, astigmatismo e alinhamento binocular.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#003828] border border-[#76C900]/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#76C900] text-[#003828] flex items-center justify-center shrink-0 font-black">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Independência Clínica Absoluta</h3>
                      <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                        Não vendemos óculos nem armações. Nosso diagnóstico refrativo é imparcial e você é livre para confeccionar seus óculos em qualquer ótica de sua confiança.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="#agendamento"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-sm shadow-lg shadow-[#76C900]/30 transition-all hover:scale-[1.02]"
                  >
                    <span>Quero agendar meu atendimento</span>
                    <ArrowRight className="w-4 h-4 text-[#003828]" />
                  </a>
                </div>
              </div>

              {/* Coluna Visual: Gabinete Clínico / Equipamentos de Ponta */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-[#76C900]/40 bg-[#00241A]">
                  <div className="relative h-80 sm:h-96 w-full overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
                      alt="Consultório optométrico de alta precisão"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00241A] via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute bottom-6 left-6 right-6 text-white bg-[#003828]/90 backdrop-blur-md p-5 rounded-2xl border border-emerald-800">
                      <div className="flex items-center gap-2 text-[#76C900] text-xs font-black uppercase mb-1">
                        <Award className="w-4 h-4" />
                        <span>Espaço Climatizado e Seguro</span>
                      </div>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        Ambiente silencioso, moderno e higienizado para a execução dos testes refrativos com o máximo de tranquilidade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. COMO FUNCIONA O ATENDIMENTO: JORNADA EM 3 ETAPAS       */}
        {/* ========================================================= */}
        <section id="como-funciona" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#004D38] text-xs font-black uppercase tracking-wider mb-3">
                Processo Simples e Rápido
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Como Funciona o seu Atendimento na Optoclin
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                Do agendamento prático à entrega da sua prescrição clara, veja como é fácil cuidar da sua saúde visual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Linha conectora em desktops */}
              <div className="hidden md:block absolute top-1/3 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#76C900] via-[#004D38] to-[#76C900] -z-0 opacity-40" />

              {/* Passo 1 */}
              <div className="relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-center z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#004D38] text-[#76C900] flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#004D38]/20">
                  1
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Agendamento Simplificado</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Escolha o melhor dia e horário pelo formulário online nesta página ou fale diretamente com a nossa recepção via WhatsApp em poucos toques.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 w-full text-[11px] font-bold text-[#004D38]">
                  Hora marcada sem filas
                </div>
              </div>

              {/* Passo 2 */}
              <div className="relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-center z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#76C900] text-[#003828] flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#76C900]/30">
                  2
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Avaliação Optométrica Completa</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  No dia marcado, realizamos os testes computadorizados e subjetivos em gabinete acolhedor, avaliando acuidade, refração e visão binocular.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 w-full text-[11px] font-bold text-[#004D38]">
                  Testes precisos e indolores
                </div>
              </div>

              {/* Passo 3 */}
              <div className="relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-center z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#004D38] text-[#76C900] flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#004D38]/20">
                  3
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Orientações e Prescrição Clara</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Você recebe sua receita óptica explicada detalhadamente, dicas de ergonomia para o seu trabalho e orientações de prevenção contínua.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 w-full text-[11px] font-bold text-[#004D38]">
                  Prescrição em mãos
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO SOBRE O OPTOMETRISTA (MANTIDA EDITÁVEL PELO PAINEL)  */}
        {/* ========================================================= */}
        {dados.secoesVisiveis?.sobre !== false && dados.sobreOptometrista && (
          <section id="sobre" className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Foto e Card do Profissional */}
                <div className="lg:col-span-5">
                  <div className="relative mx-auto max-w-md">
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-100">
                      <img
                        src={
                          dados.sobreOptometrista.fotoUrl ||
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={`Optometrista Responsável: ${dados.sobreOptometrista.nome}`}
                        className="w-full h-96 sm:h-[420px] object-cover object-top"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#00241A] via-[#003828]/90 to-transparent text-white">
                        <p className="text-lg font-black">{dados.sobreOptometrista.nome}</p>
                        <p className="text-xs text-[#76C900] font-bold">
                          {dados.sobreOptometrista.registroProfissional}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes, Formação e Diferenciais */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/70 text-[#004D38] text-xs font-black uppercase tracking-wider mb-2">
                      Responsável Técnico
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      Cuidado Profissional com a Sua Saúde Visual
                    </h2>
                    <p className="text-sm font-bold text-[#004D38] mt-1">
                      {dados.sobreOptometrista.nome} • {dados.sobreOptometrista.registroProfissional}
                    </p>
                  </div>

                  <p className="text-slate-600 text-base leading-relaxed">
                    {dados.sobreOptometrista.biografia ||
                      'A Optoclin é um centro optométrico de referência em Aracaju, dedicado exclusivamente à atenção primária da saúde visual. Oferecemos atendimento acolhedor, minucioso e com total independência clínica, focado na precisão refrativa e no conforto dos seus olhos.'}
                  </p>

                  {/* Formações */}
                  {dados.sobreOptometrista.formacao && dados.sobreOptometrista.formacao.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Habilitações & Competências
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                        {dados.sobreOptometrista.formacao.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-[#004D38] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#004D38] hover:bg-[#003828] text-white font-extrabold text-xs transition-colors shadow-xs"
                    >
                      <CalendarCheck className="w-4 h-4 text-[#76C900]" />
                      <span>Agendar Consulta na Optoclin</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO DE DEPOIMENTOS (MANTIDA EDITÁVEL PELO PAINEL)       */}
        {/* ========================================================= */}
        {dados.secoesVisiveis?.depoimentos !== false && depoimentosValidos.length > 0 && (
          <section id="depoimentos" className="py-20 bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#004D38] text-xs font-black uppercase tracking-wider mb-3">
                  Experiência Real
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  O que nossos pacientes dizem
                </h2>
                <p className="mt-3 text-slate-600 text-base">
                  Avaliações de quem cuidou da visão com dedicação e conforto em nosso consultório.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {depoimentosValidos.map((dep) => (
                  <div
                    key={dep.id}
                    className="relative flex flex-col justify-between p-6 rounded-3xl bg-slate-50/70 border border-slate-200 shadow-xs hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1 mb-3 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (dep.nota || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>

                      <Quote className="w-6 h-6 text-[#76C900]/40 mb-2" />

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                        "{dep.texto}"
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-xs text-slate-900">{dep.nome}</p>
                        {dep.data && <p className="text-[10px] text-slate-500">{dep.data}</p>}
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-[#004D38] px-2 py-0.5 rounded-full font-bold">
                        Verificado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 6. CHAMADA PARA AGENDAMENTO (CTA DE ALTO IMPACTO & FORM)  */}
        {/* ========================================================= */}
        <section id="agendamento" className="py-20 bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#004D38] text-[#76C900] text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
                <CalendarCheck className="w-4 h-4 text-[#76C900]" />
                Reserva Online Rápida
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Agende seu Exame de Vista na Optoclin
              </h2>
              <p className="mt-3 text-slate-600 text-base max-w-xl mx-auto leading-relaxed">
                Garanta seu atendimento pontual na Galeria Norcon Shopping. Escolha o serviço, veja os horários disponíveis e receba a confirmação imediata.
              </p>
            </div>

            {/* Formulário Interativo com Verificação em Tempo Real no Servidor */}
            <BookingForm
              onOpenPrivacyPolicy={() => setPrivacyModalOpen(true)}
              servicoPreSelecionadoId={servicoSelecionadoParaAgendamento}
            />

            {/* Banner Auxiliar para Dúvidas ou WhatsApp Direto */}
            <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-[#004D38] via-[#003828] to-[#00241A] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#76C900] text-[#003828] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base text-white">Prefere agendar pelo WhatsApp?</h4>
                  <p className="text-xs text-emerald-100/80">
                    Nossa equipe da recepção atende você rapidamente pelo número <strong className="text-[#76C900]">{rawWhatsapp}</strong>
                  </p>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-xs shadow-md transition-all shrink-0 active:scale-95"
              >
                Conversar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. PERGUNTAS FREQUENTES (FAQ ACCORDION)                   */}
        {/* ========================================================= */}
        <section id="faq" className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#004D38] text-xs font-black uppercase tracking-wider mb-3">
                Dúvidas Comuns
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Perguntas Frequentes sobre o Exame de Vista
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Tire suas dúvidas sobre o atendimento optométrico, indicações e orientações práticas.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-[#004D38] bg-emerald-50/30 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {item.pergunta}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#004D38] shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-[#76C900]' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in duration-200 border-t border-emerald-900/10">
                        {item.resposta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. LOCALIZAÇÃO E CONTATO (NORCON SHOPPING - ARACAJU)       */}
        {/* ========================================================= */}
        {dados.secoesVisiveis?.contato !== false && (
          <section id="contato" className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-[#004D38] text-xs font-black uppercase tracking-wider mb-3">
                  Localização Privilegiada
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Como Chegar à Optoclin
                </h2>
                <p className="mt-3 text-slate-600 text-base">
                  Fácil acesso no Centro de Aracaju, com toda comodidade, segurança e ambiente climatizado.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Detalhes de Endereço e Contato */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card do Endereço */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#004D38] flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900">Endereço do Consultório</h3>
                        <p className="text-xs text-slate-500">Galeria Norcon Shopping</p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-13">
                      {dados.endereco?.logradouro || 'Rua João Pessoa'}, {dados.endereco?.numero || 'sala 8'}
                      <br />
                      {dados.endereco?.complemento || 'Galeria Norcon Shopping'}
                      <br />
                      {dados.endereco?.bairro || 'Centro'} — {dados.endereco?.cidade || 'Aracaju'}/{dados.endereco?.uf || 'SE'}
                      <br />
                      CEP: {dados.endereco?.cep || '49010-130'}
                    </p>

                    <div className="pt-2 pl-13">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          'Rua João Pessoa, sala 8, Galeria Norcon Shopping, Centro, Aracaju - SE'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#004D38] font-bold hover:underline"
                      >
                        <span>Abrir no Google Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Card de Contatos & Horários */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#004D38] flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <h4 className="font-black text-slate-900">WhatsApp & Telefone</h4>
                        <p className="text-slate-600 mt-0.5">
                          WhatsApp: <strong className="text-[#004D38]">{rawWhatsapp}</strong>
                        </p>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#004D38] font-extrabold hover:underline mt-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Iniciar conversa agora</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#004D38] flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <h4 className="font-black text-slate-900">Instagram Oficial</h4>
                        <a
                          href={`https://instagram.com/${instagramClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#004D38] font-bold hover:underline"
                        >
                          {instagram}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#004D38] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <h4 className="font-black text-slate-900">Horário de Funcionamento</h4>
                        <p className="text-slate-600 mt-0.5">
                          {dados.horarioFuncionamento || 'Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:30 às 13:00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapa Interativo / Guia de Acesso */}
                <div className="lg:col-span-7">
                  <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white flex flex-col h-full min-h-[420px]">
                    {dados.mapaEmbedUrl ? (
                      <iframe
                        src={dados.mapaEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0, minHeight: '380px' }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Mapa de localização da Optoclin"
                        className="w-full flex-1"
                      />
                    ) : (
                      <div className="p-8 sm:p-10 bg-gradient-to-br from-[#004D38] via-[#003828] to-[#00241A] text-white flex-1 flex flex-col justify-between rounded-3xl">
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00241A] border border-[#76C900]/40 text-[#76C900] text-xs font-black uppercase">
                            Localização Central
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Galeria Norcon Shopping — Centro de Aracaju
                          </h3>
                          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-lg">
                            Um dos pontos mais tradicionais e acessíveis da capital sergipana. Ambiente climatizado, com elevadores, segurança patrimonial e fácil estacionamento nas imediações.
                          </p>

                          <div className="space-y-2 pt-2 text-xs sm:text-sm text-emerald-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#76C900]" />
                              <span>Fácil acesso por transporte público e aplicativos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#76C900]" />
                              <span>Sala 8 — Consultório reservado e sem ruídos externos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#76C900]" />
                              <span>Acessibilidade para cadeirantes e pessoas com mobilidade reduzida</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8">
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                              'Rua João Pessoa, sala 8, Galeria Norcon Shopping, Centro, Aracaju - SE'
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-xs shadow-md transition-all hover:scale-[1.02]"
                          >
                            <MapPin className="w-4 h-4 text-[#003828]" />
                            <span>Abrir Rota no Google Maps</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Barra Fixa Mobile de Agendamento (< 1024px) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-900/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden shadow-2xl print:hidden">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-[#004D38] hover:bg-[#003828] text-white font-bold text-xs shadow-xs min-h-[44px]"
            title="Agendar por WhatsApp"
          >
            <Phone className="w-4 h-4 text-[#76C900]" />
            <span>WhatsApp</span>
          </a>
          <a
            href="#agendamento"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-xs shadow-md shadow-[#76C900]/25 min-h-[44px]"
          >
            <CalendarCheck className="w-4 h-4 text-[#003828]" />
            <span>Agendar Exame</span>
          </a>
        </div>
      </div>

      {/* Botão Flutuante de WhatsApp da Optoclin */}
      <WhatsAppFloat />

      {/* Rodapé Comercial e Institucional */}
      <FooterPublic onOpenPrivacyPolicy={() => setPrivacyModalOpen(true)} />

      {/* Modal da Política de Privacidade (LGPD) */}
      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        consultorio={dados as Consultorio}
      />
    </div>
  );
};
