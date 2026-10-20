import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Search,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle,
  Filter,
  Calendar,
  Globe,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  FileText,
  UserCheck,
  Send,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import { Appointment, AppointmentStatus, AppointmentType, Patient, BloqueioAgenda } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { formatDateBR } from '../../utils/formatters';

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { consultorio } = useConsultorio();

  const podeCriar = hasPermission('agenda.criar');
  const podeEditar = hasPermission('agenda.editar');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [origemFilter, setOrigemFilter] = useState<'todos' | 'site' | 'interno'>('todos');

  // Modo de visualização: 'dia' | 'semana' | 'lista' (no mobile < 1024px padrão 'dia', desktop 'semana')
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'lista'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'dia';
    }
    return 'semana';
  });
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalRemarcarAberto, setModalRemarcarAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalWhatsAppAberto, setModalWhatsAppAberto] = useState(false);

  const [appointmentSelecionado, setAppointmentSelecionado] = useState<Appointment | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form de Novo Agendamento Interno
  const [novoPacienteId, setNovoPacienteId] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoServicoId, setNovoServicoId] = useState('');
  const [novaData, setNovaData] = useState(() => new Date().toISOString().split('T')[0]);
  const [novoHorario, setNovoHorario] = useState('09:00');
  const [novaDuracao, setNovaDuracao] = useState(40);
  const [novasObservacoes, setNovasObservacoes] = useState('');

  // Form de Remarcar
  const [remarcarData, setRemarcarData] = useState('');
  const [remarcarHorario, setRemarcarHorario] = useState('09:00');

  // Form de Cancelar
  const [motivoCancelamentoId, setMotivoCancelamentoId] = useState('');
  const [motivoCancelamentoTexto, setMotivoCancelamentoTexto] = useState('');

  // WhatsApp
  const [whatsappInfo, setWhatsappInfo] = useState<{ texto: string; linkWhatsApp: string } | null>(null);

  // Modal de sugestão de duplicados ao atender
  const [modalDuplicadosAberto, setModalDuplicadosAberto] = useState(false);
  const [duplicadosEncontrados, setDuplicadosEncontrados] = useState<any[]>([]);
  const [agendamentoPendenteAtendimento, setAgendamentoPendenteAtendimento] = useState<Appointment | null>(null);

  // Bloqueios de Agenda
  const bloqueios: BloqueioAgenda[] = useMemo(() => {
    return consultorio.bloqueiosAgenda || [];
  }, [consultorio.bloqueiosAgenda]);

  // Lista de motivos de cancelamento
  const motivosCancelamento = useMemo(() => {
    return (consultorio.motivosCancelamento || []).filter((m) => m.ativo !== false);
  }, [consultorio.motivosCancelamento]);

  // Serviços ativos
  const servicosAtivos = useMemo(() => {
    return (consultorio.servicos || []).filter((s) => s.ativo);
  }, [consultorio.servicos]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, pats] = await Promise.all([
        appointmentsService.getAll(),
        patientsService.getAll(),
      ]);
      setAppointments(appts);
      setPatients(pats);
      if (servicosAtivos.length > 0 && !novoServicoId) {
        setNovoServicoId(servicosAtivos[0].id);
      }
    } catch (e) {
      console.error('Erro ao carregar dados da agenda:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Seleção de paciente existente no formulário
  const handleSelecionarPaciente = (pId: string) => {
    setNovoPacienteId(pId);
    if (!pId) {
      setNovoNome('');
      setNovoTelefone('');
      setNovoEmail('');
      return;
    }
    const pat = patients.find((p) => p.id === pId);
    if (pat) {
      setNovoNome(pat.name);
      setNovoTelefone(pat.phone);
      setNovoEmail(pat.email || '');
    }
  };

  // 1. Criar Agendamento Manual Interno
  const handleCriarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeCriar) {
      setMensagemErro('Você não possui permissão para criar agendamentos (agenda.criar).');
      return;
    }
    if (!novoNome.trim() || !novaData || !novoHorario) {
      setMensagemErro('Nome do paciente, data e horário são campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const servico = servicosAtivos.find((s) => s.id === novoServicoId);
      const criado = await appointmentsService.create({
        patientId: novoPacienteId || `pat-${Date.now()}`,
        patientName: novoNome.trim(),
        patientPhone: novoTelefone.trim(),
        patientEmail: novoEmail.trim(),
        serviceId: novoServicoId,
        serviceName: servico?.nome || 'Exame de Refração Completo',
        servicePriceInCents: servico?.precoCentavos || 16000,
        date: novaData,
        time: novoHorario,
        durationMinutes: novaDuracao,
        type: 'consulta_completa',
        notes: novasObservacoes.trim(),
        optometristName: user?.displayName || consultorio.responsavelTecnico,
        origem: 'interno',
      });

      setMensagemSucesso(`Agendamento de ${criado.patientName} criado com sucesso (Protocolo: ${criado.protocolo || 'Confirmado'}).`);
      setModalNovoAberto(false);
      // Resetar form
      setNovoNome('');
      setNovoTelefone('');
      setNovoEmail('');
      setNovasObservacoes('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar agendamento.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Confirmar Consulta & Gerar WhatsApp com Template Cadastrado
  const handleConfirmarConsulta = async (appt: Appointment) => {
    if (!podeEditar) {
      setMensagemErro('Você não possui permissão para editar agendamentos.');
      return;
    }
    setSubmitting(true);
    setMensagemErro('');
    try {
      const res = await appointmentsService.confirm(appt.id);
      setMensagemSucesso(`Consulta de ${appt.patientName} confirmada!`);
      // Carregar WhatsApp
      const waLink = await appointmentsService.getWhatsAppLink(appt.id);
      setWhatsappInfo(waLink);
      setAppointmentSelecionado(appt);
      setModalWhatsAppAberto(true);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar consulta.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Abrir Modal de Remarcar
  const handleAbrirRemarcar = (appt: Appointment) => {
    setAppointmentSelecionado(appt);
    setRemarcarData(appt.date);
    setRemarcarHorario(appt.time);
    setMensagemErro('');
    setModalRemarcarAberto(true);
  };

  const handleSalvarRemarcacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentSelecionado) return;
    if (!remarcarData || !remarcarHorario) {
      setMensagemErro('Selecione a nova data e o horário.');
      return;
    }

    setSubmitting(true);
    setMensagemErro('');
    try {
      await appointmentsService.reschedule(appointmentSelecionado.id, remarcarData, remarcarHorario);
      setMensagemSucesso(`Consulta de ${appointmentSelecionado.patientName} remarcada para ${formatDateBR(remarcarData)} às ${remarcarHorario}.`);
      setModalRemarcarAberto(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao remarcar consulta.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Abrir Modal de Cancelar
  const handleAbrirCancelar = (appt: Appointment) => {
    setAppointmentSelecionado(appt);
    setMotivoCancelamentoId(motivosCancelamento[0]?.id || '');
    setMotivoCancelamentoTexto('');
    setMensagemErro('');
    setModalCancelarAberto(true);
  };

  const handleSalvarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentSelecionado) return;

    const motivoSelecionadoObj = motivosCancelamento.find((m) => m.id === motivoCancelamentoId);
    const motivoFinal = motivoCancelamentoTexto.trim() || motivoSelecionadoObj?.nome || 'Desistência do paciente';

    setSubmitting(true);
    setMensagemErro('');
    try {
      await appointmentsService.cancel(appointmentSelecionado.id, motivoFinal, motivoCancelamentoId);
      setMensagemSucesso(`Consulta de ${appointmentSelecionado.patientName} cancelada. Motivo: ${motivoFinal}.`);
      setModalCancelarAberto(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cancelar consulta.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Marcar Atendido ou Faltou (Com auto-vínculo de paciente e sugestão de duplicados)
  const handleMarcarStatus = async (
    id: string,
    novoStatus: 'atendido' | 'faltou',
    opcoes?: { pacienteId?: string; criarNovo?: boolean; forcarCriar?: boolean }
  ) => {
    if (!podeEditar) return;
    try {
      if (novoStatus === 'atendido') {
        const res = await appointmentsService.markAttended(id, opcoes);
        if ('requerVinculoPaciente' in res && res.requerVinculoPaciente) {
          setDuplicadosEncontrados(res.duplicados || []);
          setAgendamentoPendenteAtendimento(res.agendamento);
          setModalDuplicadosAberto(true);
          return;
        }
        setMensagemSucesso('Consulta registrada como atendida e vinculada ao prontuário do paciente.');
      } else {
        await appointmentsService.markNoShow(id);
        setMensagemSucesso('Ausência do paciente registrada (faltou).');
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar status.';
      setMensagemErro(msg);
    }
  };

  // Navegação de Datas no Calendário
  const alterarData = (dias: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  // Cálculo dos dias da semana visíveis (Segunda a Sábado)
  const diasDaSemana = useMemo(() => {
    const d = new Date(currentDate + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0 Dom, 1 Seg, ..., 6 Sab
    const diffToSegunda = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const segunda = new Date(d);
    segunda.setDate(d.getDate() + diffToSegunda);

    const dias: { dataStr: string; nomeCurto: string; diaNumero: number; bloqueio?: BloqueioAgenda }[] = [];
    const nomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 6; i++) {
      const cur = new Date(segunda);
      cur.setDate(segunda.getDate() + i);
      const dataStr = cur.toISOString().split('T')[0];

      // Checa bloqueio
      const bloq = bloqueios.find((b) => {
        if (b.data && b.data === dataStr) return true;
        if (b.dataInicio && b.dataFim) {
          return dataStr >= b.dataInicio && dataStr <= b.dataFim;
        }
        return false;
      });

      dias.push({
        dataStr,
        nomeCurto: nomes[i],
        diaNumero: cur.getDate(),
        bloqueio: bloq,
      });
    }

    return dias;
  }, [currentDate, bloqueios]);

  // Checa se a data atual possui bloqueio
  const bloqueioDataAtual = useMemo(() => {
    return bloqueios.find((b) => {
      if (b.data && b.data === currentDate) return true;
      if (b.dataInicio && b.dataFim) {
        return currentDate >= b.dataInicio && currentDate <= b.dataFim;
      }
      return false;
    });
  }, [currentDate, bloqueios]);

  // Filtros aplicados
  const appointmentsFiltrados = useMemo(() => {
    return appointments.filter((a) => {
      // Busca
      const matchSearch =
        !searchTerm.trim() ||
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patientPhone.includes(searchTerm) ||
        (a.protocolo && a.protocolo.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter;

      // Origem
      const matchOrigem = origemFilter === 'todos' || (a.origem || 'interno') === origemFilter;

      return matchSearch && matchStatus && matchOrigem;
    });
  }, [appointments, searchTerm, statusFilter, origemFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Topo / Cabeçalho da Agenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-teal-600" />
              Agenda do Consultório
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              Atendimento Clínico
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestão de consultas, agendamentos do site, confirmações e bloqueios de agenda
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de visualização */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('dia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dia' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'semana' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'lista' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista Completa
            </button>
          </div>

          {podeCriar && (
            <button
              onClick={() => {
                setNovoPacienteId('');
                setNovoNome('');
                setNovoTelefone('');
                setNovoEmail('');
                setNovaData(currentDate);
                setModalNovoAberto(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas e Mensagens de Feedback */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso('')} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{mensagemErro}</span>
          </div>
          <button onClick={() => setMensagemErro('')} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta de Bloqueio de Agenda para a data atual */}
      {bloqueioDataAtual && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold">Aviso de Indisponibilidade na Agenda: </span>
            <span>A data selecionada ({formatDateBR(currentDate)}) possui um bloqueio registrado ({bloqueioDataAtual.motivo}). Novos horários automáticos estão bloqueados.</span>
          </div>
        </div>
      )}

      {/* Barra de Filtros, Busca e Navegação de Data */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navegador de Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alterarData(viewMode === 'semana' ? -7 : -1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {viewMode === 'semana'
                ? `Semana de ${formatDateBR(diasDaSemana[0]?.dataStr || currentDate)} a ${formatDateBR(diasDaSemana[5]?.dataStr || currentDate)}`
                : formatDateBR(currentDate)}
            </span>
          </div>

          <button
            onClick={() => alterarData(viewMode === 'semana' ? 7 : 1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por paciente, telefone ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filtro por Origem (Destaque do Site) */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium mr-1">Origem:</span>
          <button
            onClick={() => setOrigemFilter('todos')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              origemFilter === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setOrigemFilter('site')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
              origemFilter === 'site'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Site ({appointments.filter((a) => a.origem === 'site').length})</span>
          </button>
          <button
            onClick={() => setOrigemFilter('interno')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              origemFilter === 'interno' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Interno
          </button>
        </div>
      </div>

      {/* Visualização 1: VISUALIZAÇÃO EM SEMANA */}
      {viewMode === 'semana' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Cabeçalho da Semana com Bloqueios */}
          <div className="grid grid-cols-6 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
            {diasDaSemana.map((d) => (
              <div
                key={d.dataStr}
                onClick={() => {
                  setCurrentDate(d.dataStr);
                  setViewMode('dia');
                }}
                className={`p-3 text-center cursor-pointer transition-colors ${
                  d.dataStr === currentDate ? 'bg-teal-50/70 border-b-2 border-b-teal-600' : 'hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {d.nomeCurto}
                </span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {d.diaNumero}
                </p>
                {d.bloqueio ? (
                  <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Bloqueado
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    {appointments.filter((a) => a.date === d.dataStr && a.status !== 'cancelado').length} atend.
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Colunas dos 6 Dias com os Cards de Agendamento */}
          <div className="grid grid-cols-6 divide-x divide-slate-200 min-h-[420px] p-2 bg-slate-50/30">
            {diasDaSemana.map((dia) => {
              const consultasDoDia = appointmentsFiltrados
                .filter((a) => a.date === dia.dataStr)
                .sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div key={dia.dataStr} className="p-2 space-y-2">
                  {dia.bloqueio && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Agenda Fechada</span>
                      </div>
                      <p className="text-[10px] text-amber-800 leading-snug">{dia.bloqueio.motivo}</p>
                    </div>
                  )}

                  {consultasDoDia.length === 0 && !dia.bloqueio && (
                    <div className="py-12 text-center text-[11px] text-slate-500 italic">
                      Sem consultas
                    </div>
                  )}

                  {consultasDoDia.map((appt) => (
                    <div
                      key={appt.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all shadow-xs ${
                        appt.status === 'pendente'
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                          : appt.status === 'confirmado'
                          ? 'bg-white border-teal-200 hover:border-teal-400 text-slate-900'
                          : appt.status === 'atendido'
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : appt.status === 'cancelado'
                          ? 'bg-rose-50/60 border-rose-200 text-slate-500 opacity-75'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-teal-800 text-[11px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          {appt.time}
                        </span>
                        {appt.origem === 'site' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            <Globe className="w-2.5 h-2.5" />
                            Site
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate" title={appt.patientName}>
                          {appt.patientName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate" title={appt.serviceName}>
                          {appt.serviceName || 'Exame de Refração'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span
                          className={`font-semibold capitalize ${
                            appt.status === 'pendente'
                              ? 'text-amber-700'
                              : appt.status === 'confirmado'
                              ? 'text-teal-700'
                              : appt.status === 'atendido'
                              ? 'text-emerald-700'
                              : appt.status === 'cancelado'
                              ? 'text-rose-600 line-through'
                              : 'text-slate-600'
                          }`}
                        >
                          {appt.status}
                        </span>

                        <div className="flex items-center gap-1">
                          {podeEditar && appt.status === 'pendente' && (
                            <button
                              onClick={() => handleConfirmarConsulta(appt)}
                              className="p-1 rounded bg-teal-100 hover:bg-teal-200 text-teal-800 transition-colors cursor-pointer"
                              title="Confirmar consulta"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          {podeEditar && appt.status !== 'cancelado' && (
                            <button
                              onClick={() => handleAbrirRemarcar(appt)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Remarcar"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização 2: VISUALIZAÇÃO EM DIA DETALHADO */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Horários de Atendimento ({formatDateBR(currentDate)})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Programação de consultas e exames do dia
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {appointmentsFiltrados.filter((a) => a.date === currentDate).length} agendamentos no dia
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {appointmentsFiltrados.filter((a) => a.date === currentDate).length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Nenhuma consulta cadastrada para esta data.
              </div>
            ) : (
              appointmentsFiltrados
                .filter((a) => a.date === currentDate)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => (
                  <div key={appt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center font-mono text-teal-900 shrink-0">
                        <span className="text-sm font-extrabold">{appt.time}</span>
                        <span className="text-[10px] text-teal-600">{appt.durationMinutes} min</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">
                            {appt.patientName}
                          </h3>
                          {appt.origem === 'site' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              <Globe className="w-2.5 h-2.5" />
                              Novo do Site
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              appt.status === 'pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : appt.status === 'confirmado'
                                ? 'bg-teal-100 text-teal-800'
                                : appt.status === 'atendido'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'cancelado'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          {appt.serviceName || 'Exame de Refração Completo'} •{' '}
                          <span className="text-slate-500">{appt.patientPhone}</span>
                        </p>

                        {appt.notes && (
                          <p className="text-xs text-slate-500 italic">
                            "{appt.notes}"
                          </p>
                        )}

                        {appt.status === 'cancelado' && appt.motivoCancelamento && (
                          <p className="text-xs text-rose-600 font-semibold">
                            Motivo do cancelamento: {appt.motivoCancelamento}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    {podeEditar && (
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        {/* Botão de WhatsApp */}
                        <button
                          onClick={async () => {
                            const link = await appointmentsService.getWhatsAppLink(appt.id);
                            setWhatsappInfo(link);
                            setAppointmentSelecionado(appt);
                            setModalWhatsAppAberto(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {appt.status === 'pendente' && (
                          <button
                            onClick={() => handleConfirmarConsulta(appt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                        )}

                        {appt.status === 'confirmado' && (
                          <>
                            <button
                              onClick={() => navigate(`/admin/exames?agendamentoId=${appt.id}&patientId=${appt.patientId || ''}&action=novo`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                              title="Iniciar Atendimento Clínico e Refração"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Atender no Gabinete</span>
                            </button>
                            <button
                              onClick={() => handleMarcarStatus(appt.id, 'atendido')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Atendido</span>
                            </button>
                            <button
                              onClick={() => handleMarcarStatus(appt.id, 'faltou')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>Faltou</span>
                            </button>
                          </>
                        )}

                        {appt.status !== 'cancelado' && (
                          <>
                            <button
                              onClick={() => handleAbrirRemarcar(appt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Remarcar</span>
                            </button>

                            <button
                              onClick={() => handleAbrirCancelar(appt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Visualização 3: LISTA COMPLETA COM FILTROS */}
      {viewMode === 'lista' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Histórico Completo de Agendamentos ({appointmentsFiltrados.length})
            </h3>
            {/* Filtros de Status */}
            <div className="flex items-center gap-1 text-xs">
              {['todos', 'pendente', 'confirmado', 'atendido', 'remarcado', 'cancelado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                    statusFilter === st ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {appointmentsFiltrados.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Nenhum agendamento encontrado com os filtros selecionados.
              </div>
            ) : (
              appointmentsFiltrados.map((appt) => (
                <div key={appt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center font-mono text-teal-900 shrink-0">
                      <span className="text-xs font-bold">{appt.time}</span>
                      <span className="text-[10px] text-teal-600">{formatDateBR(appt.date)}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{appt.patientName}</span>
                        {appt.origem === 'site' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                            <Globe className="w-2.5 h-2.5" />
                            Site
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {appt.serviceName || 'Exame de Refração'} • Tel: {appt.patientPhone}
                      </p>
                      {appt.motivoCancelamento && (
                        <p className="text-xs text-rose-600">
                          Motivo cancelamento: {appt.motivoCancelamento}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={async () => {
                        const link = await appointmentsService.getWhatsAppLink(appt.id);
                        setWhatsappInfo(link);
                        setAppointmentSelecionado(appt);
                        setModalWhatsAppAberto(true);
                      }}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    {podeEditar && appt.status !== 'cancelado' && (
                      <button
                        onClick={() => handleAbrirRemarcar(appt)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Remarcar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO AGENDAMENTO MANUAL INTERNO                                   */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Novo Agendamento Interno</h3>
                  <span className="text-xs text-slate-500">Origem: Recepção / Equipe Interna</span>
                </div>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarAgendamento} className="space-y-4 text-xs">
              {/* Selecionar Paciente Cadastrado ou Digitar Novo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vincular a Paciente Existente (Opcional)
                </label>
                <select
                  value={novoPacienteId}
                  onChange={(e) => handleSelecionarPaciente(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="">Novo Paciente (preencher abaixo)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do paciente"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Serviço Optométrico *</label>
                <select
                  value={novoServicoId}
                  onChange={(e) => {
                    setNovoServicoId(e.target.value);
                    const s = servicosAtivos.find((x) => x.id === e.target.value);
                    if (s) setNovaDuracao(s.duracaoMin || 40);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  {servicosAtivos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.duracaoMin} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    value={novaDuracao}
                    onChange={(e) => setNovaDuracao(Number(e.target.value))}
                    min={15}
                    step={5}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Clínicas / Queixa</label>
                <textarea
                  rows={2}
                  value={novasObservacoes}
                  onChange={(e) => setNovasObservacoes(e.target.value)}
                  placeholder="Ex: Queixa de cefaleia ao ler, primeira vez no consultório..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? 'Validando Horário...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REMARCAR CONSULTA                                               */}
      {/* ========================================================================= */}
      {modalRemarcarAberto && appointmentSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <span>Remarcar Consulta</span>
              </h3>
              <button onClick={() => setModalRemarcarAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{appointmentSelecionado.patientName}</p>
              <p className="text-slate-500 mt-0.5">
                Atual: {formatDateBR(appointmentSelecionado.date)} às {appointmentSelecionado.time}
              </p>
            </div>

            <form onSubmit={handleSalvarRemarcacao} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nova Data *</label>
                  <input
                    type="date"
                    required
                    value={remarcarData}
                    onChange={(e) => setRemarcarData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Novo Horário *</label>
                  <input
                    type="time"
                    required
                    value={remarcarHorario}
                    onChange={(e) => setRemarcarHorario(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalRemarcarAberto(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 font-bold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? 'Verificando...' : 'Salvar Nova Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CANCELAR CONSULTA (COM MOTIVO DA LISTA AUXILIAR)                 */}
      {/* ========================================================================= */}
      {modalCancelarAberto && appointmentSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Cancelar Consulta</span>
              </h3>
              <button onClick={() => setModalCancelarAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
              <p className="font-bold text-slate-900">{appointmentSelecionado.patientName}</p>
              <p className="text-slate-500">
                Consulta prevista para {formatDateBR(appointmentSelecionado.date)} às {appointmentSelecionado.time}
              </p>
            </div>

            <form onSubmit={handleSalvarCancelamento} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo do Cancelamento (Cadastros Auxiliares) *
                </label>
                <select
                  required
                  value={motivoCancelamentoId}
                  onChange={(e) => setMotivoCancelamentoId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {motivosCancelamento.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                  <option value="outro">Outro motivo justificado...</option>
                </select>
              </div>

              {motivoCancelamentoId === 'outro' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descreva o Motivo *</label>
                  <input
                    type="text"
                    required
                    value={motivoCancelamentoTexto}
                    onChange={(e) => setMotivoCancelamentoTexto(e.target.value)}
                    placeholder="Informe a justificativa..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCancelarAberto(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 font-bold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRMAÇÃO & ENVIO DE MENSAGEM WHATSAPP COM TEMPLATE            */}
      {/* ========================================================================= */}
      {modalWhatsAppAberto && appointmentSelecionado && whatsappInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Mensagem Padrão de WhatsApp</h3>
                  <span className="text-xs text-slate-500">Template preenchido automaticamente</span>
                </div>
              </div>
              <button onClick={() => setModalWhatsAppAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Destinatário:</span>
                <p className="text-slate-900 font-medium">
                  {appointmentSelecionado.patientName} — {appointmentSelecionado.patientPhone || 'Telefone não informado'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto da Mensagem:</label>
                <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-slate-800 leading-relaxed font-sans text-xs">
                  {whatsappInfo.texto}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalWhatsAppAberto(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs"
              >
                Fechar
              </button>
              <a
                href={whatsappInfo.linkWhatsApp}
                target="_blank"
                rel="noreferrer"
                onClick={() => setModalWhatsAppAberto(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp Web / App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SUGESTÃO DE DUPLICADOS AO ATENDER (PROMPT 08)                    */}
      {/* ========================================================================= */}
      {modalDuplicadosAberto && agendamentoPendenteAtendimento && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Vínculo de Paciente no Atendimento</h3>
                  <span className="text-xs text-slate-500">Sugestão de cadastros existentes</span>
                </div>
              </div>
              <button onClick={() => setModalDuplicadosAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Ao atender a consulta de <strong className="text-slate-900">{agendamentoPendenteAtendimento.patientName}</strong>, identificamos paciente(s) com dados coincidentes (mesmo telefone ou CPF). Deseja vincular este agendamento ao prontuário existente ou criar uma nova ficha?
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {duplicadosEncontrados.map((dup) => (
                  <div key={dup.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">{dup.name}</h4>
                      <p className="text-slate-500 text-[11px]">
                        Tel: {dup.phone} {dup.cpf && `• CPF: ${dup.cpf}`}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                        {dup.motivo}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setModalDuplicadosAberto(false);
                        handleMarcarStatus(agendamentoPendenteAtendimento.id, 'atendido', { pacienteId: dup.id });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Vincular a Este
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalDuplicadosAberto(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalDuplicadosAberto(false);
                  handleMarcarStatus(agendamentoPendenteAtendimento.id, 'atendido', { forcarCriar: true });
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Criar Nova Ficha de Paciente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
