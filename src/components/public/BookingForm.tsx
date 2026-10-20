import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { agendamentoPublicoService } from '../../services/agendamento-publico.service';

interface BookingFormProps {
  onOpenPrivacyPolicy: () => void;
  servicoPreSelecionadoId?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onOpenPrivacyPolicy,
  servicoPreSelecionadoId,
}) => {
  const navigate = useNavigate();
  const { consultorio } = useConsultorio();

  // Serviços ativos disponíveis para agendamento
  const servicosAtivos = (consultorio.servicos || []).filter((s) => s.ativo);

  // Estados do formulário
  const [servicoId, setServicoId] = useState<string>(
    servicoPreSelecionadoId || servicosAtivos[0]?.id || ''
  );

  // Data mínima (hoje no fuso local)
  const hojeStr = new Date().toISOString().split('T')[0];
  const [data, setData] = useState<string>(hojeStr);

  // Horários disponíveis calculados no servidor
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');
  const [carregandoHorarios, setCarregandoHorarios] = useState<boolean>(false);
  const [erroHorarios, setErroHorarios] = useState<string | null>(null);

  // Campos de contato (estritamente Nome, Telefone, E-mail)
  const [nome, setNome] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Consentimento LGPD
  const [consentimentoLgpd, setConsentimentoLgpd] = useState<boolean>(false);

  // Campo Honeypot para proteção contra robôs de spam
  const [websiteHp, setWebsiteHp] = useState<string>('');

  // Estados de submissão
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Se houver pré-seleção externa
  useEffect(() => {
    if (servicoPreSelecionadoId) {
      setServicoId(servicoPreSelecionadoId);
    } else if (!servicoId && servicosAtivos.length > 0) {
      setServicoId(servicosAtivos[0].id);
    }
  }, [servicoPreSelecionadoId, servicosAtivos]);

  // Consulta de horários livres calculados pelo servidor
  const buscarHorarios = async (dataAlvo: string, servId: string) => {
    if (!dataAlvo || !servId) {
      setHorariosDisponiveis([]);
      return;
    }

    setCarregandoHorarios(true);
    setErroHorarios(null);
    setHorarioSelecionado('');

    try {
      const res = await agendamentoPublicoService.obterHorariosDisponiveis(dataAlvo, servId);
      setHorariosDisponiveis(res.horarios || []);
      if ((res.horarios || []).length === 0) {
        setErroHorarios('Nenhum horário livre para esta data. Por favor, escolha outro dia útil.');
      }
    } catch (err: any) {
      setErroHorarios(err.message || 'Não foi possível carregar os horários livres.');
      setHorariosDisponiveis([]);
    } finally {
      setCarregandoHorarios(false);
    }
  };

  useEffect(() => {
    if (data && servicoId) {
      buscarHorarios(data, servicoId);
    }
  }, [data, servicoId]);

  // Formatação de máscara do telefone brasileiro
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 11) {
      formatted = raw.slice(0, 11);
    }

    if (formatted.length > 6) {
      formatted = `(${formatted.slice(0, 2)}) ${formatted.slice(2, 7)}-${formatted.slice(7)}`;
    } else if (formatted.length > 2) {
      formatted = `(${formatted.slice(0, 2)}) ${formatted.slice(2)}`;
    } else if (formatted.length > 0) {
      formatted = `(${formatted}`;
    }

    setTelefone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    // Validações no cliente antes do envio
    if (!servicoId) {
      setMensagemErro('Por favor, selecione o exame ou avaliação desejada.');
      return;
    }

    if (!data) {
      setMensagemErro('Por favor, selecione uma data para o atendimento.');
      return;
    }

    if (!horarioSelecionado) {
      setMensagemErro('Por favor, selecione um dos horários livres disponíveis.');
      return;
    }

    if (!nome.trim() || nome.trim().length < 3) {
      setMensagemErro('Por favor, informe seu nome completo.');
      return;
    }

    const cleanTel = telefone.replace(/\D/g, '');
    if (cleanTel.length < 10) {
      setMensagemErro('Por favor, informe um número de telefone com DDD válido.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setMensagemErro('Por favor, informe um e-mail válido para receber o comprovante.');
      return;
    }

    if (!consentimentoLgpd) {
      setMensagemErro('É necessário concordar com a Política de Privacidade (LGPD) para prosseguir.');
      return;
    }

    setEnviando(true);

    try {
      const payload = {
        nome: nome.trim(),
        telefone: cleanTel,
        email: email.trim().toLowerCase(),
        servicoId,
        data,
        horario: horarioSelecionado,
        consentimentoLgpd: true,
        versaoPolitica: consultorio.versaoPolitica || '1.0',
        website_hp: websiteHp, // honeypot
      };

      const resultado = await agendamentoPublicoService.solicitarAgendamento(payload);

      if (resultado.sucesso && resultado.agendamento) {
        navigate('/agendar/confirmacao', {
          state: {
            agendamento: resultado.agendamento,
            emailEnviado: resultado.emailEnviado,
          },
        });
      } else {
        setMensagemErro(resultado.mensagem || 'Falha ao concluir agendamento.');
      }
    } catch (err: any) {
      if (err.isConflict || err.status === 409) {
        setMensagemErro(
          'Atenção: Este horário acabou de ser reservado por outro paciente. Por favor, selecione outro horário livre na lista abaixo.'
        );
        buscarHorarios(data, servicoId);
      } else {
        setMensagemErro(err.message || 'Ocorreu um erro ao processar seu agendamento no servidor.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-900/10 shadow-2xl overflow-hidden">
      {/* Cabeçalho do Formulário em Verde-Escuro Institucional Optoclin */}
      <div className="bg-gradient-to-r from-[#004D38] via-[#003828] to-[#00241A] px-6 sm:px-8 py-6 text-white relative">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-[#003828] border border-[#76C900]/40 flex items-center justify-center text-[#76C900] shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-[#76C900]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Agendamento de Exame de Vista
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5">
              Escolha seu exame e selecione o horário conveniente. Vagas calculadas em tempo real.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(118,201,0,0.18),transparent_70%)] pointer-events-none" />
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Campo Honeypot Oculto (Proteção anti-spam) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="website_hp">Não preencha este campo:</label>
          <input
            type="text"
            id="website_hp"
            name="website_hp"
            value={websiteHp}
            onChange={(e) => setWebsiteHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Mensagem de Erro / Alerta */}
        {mensagemErro && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-semibold">{mensagemErro}</div>
          </div>
        )}

        {/* 1. Escolha do Exame / Serviço */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs font-black uppercase tracking-wider text-[#004D38]">
              1. Selecione o Exame Optométrico
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Atendimento com hora marcada
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {servicosAtivos.map((srv) => {
              const selecionado = srv.id === servicoId;
              return (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => setServicoId(srv.id)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selecionado
                      ? 'border-[#004D38] bg-emerald-50/70 ring-2 ring-[#76C900]/50 shadow-sm'
                      : 'border-slate-200 hover:border-[#004D38]/40 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900 leading-snug">
                      {srv.nome}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                      {srv.duracaoMin} min
                    </span>
                  </div>
                  {srv.descricao && (
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {srv.descricao}
                    </p>
                  )}
                  {srv.precoCentavos > 0 && (
                    <div className="mt-2.5 text-xs font-black text-[#004D38]">
                      {(srv.precoCentavos / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Escolha da Data e Horário */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 border-t border-slate-100">
          {/* Seletor de Data */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-black uppercase tracking-wider text-[#004D38] mb-2">
              2. Data do Atendimento
            </label>
            <div className="relative">
              <input
                type="date"
                min={hojeStr}
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-[#76C900] focus:border-[#004D38] outline-none transition-all shadow-xs"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Atendimento de segunda a sábado na Galeria Norcon Shopping.
            </p>
          </div>

          {/* Slots de Horários Livres */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-[#004D38]">
                3. Horários Disponíveis
              </label>
              <button
                type="button"
                onClick={() => buscarHorarios(data, servicoId)}
                disabled={carregandoHorarios}
                className="text-xs text-[#004D38] hover:text-[#00241A] flex items-center gap-1 font-bold cursor-pointer"
                title="Atualizar horários em tempo real"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${carregandoHorarios ? 'animate-spin text-[#76C900]' : ''}`} />
                Atualizar
              </button>
            </div>

            {carregandoHorarios ? (
              <div className="h-32 flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 text-slate-600 text-xs gap-2">
                <Loader2 className="w-5 h-5 text-[#004D38] animate-spin" />
                <span className="font-semibold text-slate-700">Verificando agenda no consultório...</span>
              </div>
            ) : erroHorarios ? (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                <p className="font-bold">{erroHorarios}</p>
                <p className="mt-1 text-amber-700">
                  Tente selecionar o próximo dia útil ou fale diretamente pelo WhatsApp.
                </p>
              </div>
            ) : horariosDisponiveis.length === 0 ? (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
                Selecione uma data para conferir os horários disponíveis.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {horariosDisponiveis.map((hora) => {
                  const isSelected = horarioSelecionado === hora;
                  return (
                    <button
                      type="button"
                      key={hora}
                      onClick={() => setHorarioSelecionado(hora)}
                      className={`py-2 px-3 text-sm font-extrabold rounded-xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#004D38] text-white border-[#004D38] shadow-md ring-2 ring-[#76C900]/60'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-[#004D38] hover:bg-emerald-50/60'
                      }`}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Dados do Paciente */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-black uppercase tracking-wider text-[#004D38] mb-3">
            4. Seus Dados para Confirmação
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria dos Santos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#76C900] focus:border-[#004D38] outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Celular *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="(79) 99109-2420"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#76C900] focus:border-[#004D38] outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail para Receber Comprovante *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#76C900] focus:border-[#004D38] outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Consentimento LGPD */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consentimentoLgpd}
              onChange={(e) => setConsentimentoLgpd(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-[#004D38] focus:ring-[#76C900] mt-0.5 cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Concordo com o tratamento dos meus dados de contato exclusivamente para agendamento e confirmação de atendimento na Optoclin, conforme a{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPrivacyPolicy();
                }}
                className="font-bold text-[#004D38] hover:underline inline-block"
              >
                Política de Privacidade (LGPD)
              </button>
              .
            </span>
          </label>
        </div>

        {/* Botão de Submissão em Verde Vibrante #76C900 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={enviando || !horarioSelecionado}
            className="w-full py-4 px-6 rounded-2xl bg-[#76C900] hover:bg-[#86E400] text-[#003828] font-black text-base shadow-xl shadow-[#76C900]/30 hover:shadow-[#76C900]/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {enviando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#003828]" />
                <span>Confirmando vaga no servidor...</span>
              </>
            ) : (
              <>
                <span>Agendar meu Exame de Vista Agora</span>
                <ArrowRight className="w-5 h-5 text-[#003828]" />
              </>
            )}
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
            <CheckCircle2 className="w-4 h-4 text-[#76C900]" />
            <span>Confirmação imediata e lembretes enviados por e-mail e WhatsApp.</span>
          </div>
        </div>
      </form>
    </div>
  );
};
