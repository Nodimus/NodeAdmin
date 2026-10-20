import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  MessageCircle,
  Share2,
  CalendarPlus,
  Building,
  Info,
} from 'lucide-react';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { AgendamentoSite } from '../../types';
import { agendamentoPublicoService } from '../../services/agendamento-publico.service';
import { NavbarPublic } from '../../components/layout/NavbarPublic';
import { FooterPublic } from '../../components/layout/FooterPublic';

export const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { consultorio } = useConsultorio();

  // Dados recebidos do estado de navegação
  const stateAgendamento = location.state?.agendamento as AgendamentoSite | undefined;
  const stateEmailEnviado = location.state?.emailEnviado as boolean | undefined;

  const [agendamento, setAgendamento] = useState<Partial<AgendamentoSite> | null>(
    stateAgendamento || null
  );
  const [carregando, setCarregando] = useState<boolean>(!stateAgendamento);
  const [erro, setErro] = useState<string | null>(null);

  // Se não veio pelo state, tenta recuperar pelo search param ?protocolo=...
  useEffect(() => {
    const protocoloParam = searchParams.get('protocolo');
    if (!stateAgendamento && protocoloParam) {
      setCarregando(true);
      agendamentoPublicoService
        .consultarPorProtocolo(protocoloParam)
        .then((dados) => {
          setAgendamento(dados);
        })
        .catch((err) => {
          setErro(err.message || 'Agendamento não localizado.');
        })
        .finally(() => {
          setCarregando(false);
        });
    } else if (!stateAgendamento && !protocoloParam) {
      setCarregando(false);
    }
  }, [searchParams, stateAgendamento]);

  const formatarDataBr = (dataYmd?: string) => {
    if (!dataYmd) return '';
    const [ano, mes, dia] = dataYmd.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const gerarGoogleCalendarUrl = () => {
    if (!agendamento || !agendamento.data || !agendamento.horario) return '#';
    const titulo = encodeURIComponent(`Consulta Optométrica: ${agendamento.servicoNome || 'Exame de Vista'}`);
    const local = encodeURIComponent(
      `${consultorio.nomeFantasia}, ${consultorio.endereco.logradouro}, ${consultorio.endereco.numero} - ${consultorio.endereco.cidade}/${consultorio.endereco.uf}`
    );
    const detalhes = encodeURIComponent(
      `Agendamento no consultório particular de optometria.\nProtocolo: ${agendamento.protocolo}\nPaciente: ${agendamento.nomeContato}\nDuração: ${agendamento.duracaoMin} min.`
    );

    // Formato YYYYMMDDTHHmmSSZ
    const [ano, mes, dia] = agendamento.data.split('-');
    const [hora, min] = agendamento.horario.split(':');
    const startStr = `${ano}${mes}${dia}T${hora}${min}00`;
    
    // Fim estimado
    const dur = agendamento.duracaoMin || 40;
    const endMinutesTotal = Number(hora) * 60 + Number(min) + dur;
    const endH = String(Math.floor(endMinutesTotal / 60)).padStart(2, '0');
    const endM = String(endMinutesTotal % 60).padStart(2, '0');
    const endStr = `${ano}${mes}${dia}T${endH}${endM}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${startStr}/${endStr}&details=${detalhes}&location=${local}`;
  };

  const abrirWhatsAppComProtocolo = () => {
    const foneLimpo = (consultorio.whatsappConfig?.numero || consultorio.whatsapp).replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá! Gostaria de falar sobre o meu agendamento realizado no site. Meu protocolo é ${agendamento?.protocolo || ''}.`
    );
    window.open(`https://wa.me/55${foneLimpo}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <NavbarPublic />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {carregando ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Localizando detalhes do agendamento...</p>
          </div>
        ) : erro || !agendamento ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agendamento não localizado</h2>
            <p className="text-sm text-slate-600 mb-6">
              Não encontramos nenhuma solicitação ativa para os parâmetros informados ou a sessão expirou.
            </p>
            <Link
              to="/#agendamento"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar e Agendar</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner de Sucesso */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-800 p-8 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    Solicitação Recebida com Sucesso
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold">
                    Agendamento Registrado!
                  </h1>
                  <p className="mt-1 text-teal-100 text-sm max-w-xl">
                    Seu horário foi reservado em nosso sistema. Um e-mail com os detalhes foi enviado e nossa recepção fará a confirmação.
                  </p>
                </div>

                <div className="mt-6 sm:mt-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0">
                  <div className="text-xs uppercase tracking-wider text-teal-200 font-semibold">
                    Protocolo
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider mt-0.5">
                    {agendamento.protocolo}
                  </div>
                </div>
              </div>

              {/* Detalhes do Agendamento */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm font-semibold">
                      Status do Agendamento: <strong className="text-amber-800 uppercase">Pendente de Confirmação</strong>
                    </span>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                    Origem: Site Institucional
                  </span>
                </div>

                {/* Grid de Informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bloco 1: Data, Horário e Procedimento */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      Dados do Atendimento
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-600">Serviço Solicitado</div>
                        <div className="text-base font-bold text-slate-900">
                          {agendamento.servicoNome}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-600">Data</div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            {formatarDataBr(agendamento.data)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-600">Horário</div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-4 h-4 text-teal-600" />
                            {agendamento.horario} ({agendamento.duracaoMin} min)
                          </div>
                        </div>
                      </div>

                      {agendamento.servicoPrecoCentavos !== undefined && agendamento.servicoPrecoCentavos > 0 && (
                        <div>
                          <div className="text-xs text-slate-600">Valor Estimado</div>
                          <div className="text-sm font-bold text-teal-800">
                            R$ {(agendamento.servicoPrecoCentavos / 100).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloco 2: Local e Instruções */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Local de Comparecimento
                    </h3>

                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="font-bold text-slate-900">
                        {consultorio.nomeFantasia}
                      </div>
                      <p className="text-xs text-slate-600">
                        {consultorio.endereco.logradouro}, nº {consultorio.endereco.numero}
                        {consultorio.endereco.complemento ? ` - ${consultorio.endereco.complemento}` : ''}
                      </p>
                      <p className="text-xs text-slate-600">
                        {consultorio.endereco.bairro} — {consultorio.endereco.cidade}/{consultorio.endereco.uf}
                      </p>
                      <p className="text-xs text-slate-600">CEP: {consultorio.endereco.cep}</p>

                      <div className="pt-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        <strong>Dica:</strong> Recomendamos chegar com 10 minutos de antecedência. Caso use óculos atuais ou lentes de contato, traga-os consigo no dia do exame.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notificação de E-mail de Recebimento */}
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-teal-900">
                    <p className="font-semibold">
                      Comprovante de solicitação enviado por e-mail!
                    </p>
                    <p className="text-xs text-teal-700 mt-0.5">
                      Enviamos um e-mail com todos os detalhes desta solicitação para o endereço cadastrado. Nossa equipe entrará em contato para confirmar a disponibilidade final.
                    </p>
                  </div>
                </div>

                {/* Ações e Atalhos */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                  <a
                    href={gerarGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CalendarPlus className="w-4 h-4 text-teal-600" />
                    <span>Adicionar ao Google Agenda</span>
                  </a>

                  <button
                    type="button"
                    onClick={abrirWhatsAppComProtocolo}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp com o Protocolo</span>
                  </button>

                  <Link
                    to="/"
                    className="w-full sm:w-auto py-3 px-5 rounded-xl text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Início</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <FooterPublic />
    </div>
  );
};
