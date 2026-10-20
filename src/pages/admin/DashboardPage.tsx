import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  CalendarCheck,
  TrendingUp,
  Glasses,
  Calendar,
  AlertCircle,
  Globe,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ShieldCheck,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { appointmentsService, DashboardResponse } from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import { examsService } from '../../services/exams.service';
import { Appointment, Patient, Exam } from '../../types';
import { formatCurrencyFromCents, formatDateBR } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user, hasPermission, isFirebaseConnected } = useAuth();
  const { consultorio } = useConsultorio();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const podeVerFinanceiro = hasPermission('financeiro.ler');
  const podeEditarAgenda = hasPermission('agenda.editar');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [dash, apptsData, patsData, examsData] = await Promise.all([
        appointmentsService.getDashboard(),
        appointmentsService.getAll(),
        patientsService.getAll(),
        examsService.getAll(),
      ]);
      setDashboardData(dash);
      setAppointments(apptsData);
      setPatients(patsData);
      setExams(examsData);
    } catch (e) {
      console.error('Erro ao carregar dados do painel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const hojeStr = dashboardData?.dataAtual || new Date().toISOString().split('T')[0];
  const consultasHoje = appointments.filter((a) => a.date === hojeStr);
  const consultasPendentes = appointments.filter((a) => a.status === 'pendente');
  const novosDoSite = appointments.filter((a) => a.origem === 'site');

  const handleConfirmar = async (appt: Appointment) => {
    setUpdatingId(appt.id);
    try {
      const res = await appointmentsService.confirm(appt.id);
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: `Consulta de ${appt.patientName} confirmada com sucesso!`,
      });
      if (res.linkWhatsApp) {
        window.open(res.linkWhatsApp, '_blank');
      }
      await carregarDados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar consulta.';
      setFeedbackMsg({ tipo: 'erro', texto: msg });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleMarcarAtendido = async (id: string) => {
    setUpdatingId(id);
    try {
      await appointmentsService.markAttended(id);
      setFeedbackMsg({ tipo: 'sucesso', texto: 'Consulta marcada como atendida!' });
      await carregarDados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar status.';
      setFeedbackMsg({ tipo: 'erro', texto: msg });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner com dados do Consultório */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Glasses className="w-80 h-80 text-teal-400" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
            <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <span>
              {isFirebaseConnected ? 'Firebase Conectado' : 'Sistema Local do Consultório'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user?.displayName || 'Doutor(a)'}!
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Painel Clínico de <strong>{consultorio.nomeFantasia}</strong>.
            Você possui <strong>{consultasHoje.length} consultas</strong> agendadas para hoje e{' '}
            <strong>{consultasPendentes.length} pendentes</strong> de confirmação.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {hasPermission('atendimento.criar') && (
              <button
                onClick={() => navigate('/admin/exames?action=novo')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Novo Exame Refrativo</span>
              </button>
            )}
            <button
              onClick={() => navigate('/admin/agenda')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              <span>Ver Agenda Completa</span>
            </button>
            <button
              onClick={() => carregarDados()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.texto}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-700">
            ×
          </button>
        </div>
      )}

      {/* 4 Cards de Métricas Principais (com segregação deontológica para financeiro.ler) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Consultas de Hoje */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Consultas de Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {consultasHoje.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-emerald-600">
              {consultasHoje.filter((a) => a.status === 'atendido' || a.status === 'concluido').length} atendidos
            </span>
            <span>•</span>
            <span className="font-semibold text-cyan-600">
              {consultasHoje.filter((a) => a.status === 'confirmado').length} confirmados
            </span>
          </div>
        </div>

        {/* Card 2: Pendentes de Confirmação */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendentes de Confirmação
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">
            {consultasPendentes.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span>Aguardando retorno via WhatsApp</span>
          </div>
        </div>

        {/* Card 3: Agendamentos Novos do Site */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Novos do Site
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-cyan-700 mt-2">
            {novosDoSite.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-cyan-700">Origem: Landing Page</span>
          </div>
        </div>

        {/* Card 4: Receita do Mês (ESTRITAMENTE CONDICIONADO A financeiro.ler) */}
        {podeVerFinanceiro ? (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Receita do Mês
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {formatCurrencyFromCents(dashboardData?.financeiroMes?.receitaCentavos || 48000)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span>Saldo Líquido: {formatCurrencyFromCents(dashboardData?.financeiroMes?.saldoCentavos || 16000)}</span>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pacientes Ativos
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {patients.length}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Prontuários registrados na clínica</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Consultas de Hoje & Destaques de Agendamento do Site */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna 1: Consultas de Hoje */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Consultas de Hoje ({formatDateBR(hojeStr)})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atendimentos previstos para o dia no consultório
              </p>
            </div>
            <Link
              to="/admin/agenda"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>Abrir Agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {consultasHoje.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Nenhuma consulta agendada para hoje.
              </div>
            ) : (
              consultasHoje.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-mono font-bold text-slate-700 shrink-0">
                      <span className="text-xs">{appt.time}</span>
                      <span className="text-[9px] text-slate-500 font-normal">{appt.durationMinutes}m</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {appt.patientName}
                        </h4>
                        {appt.origem === 'site' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            <Globe className="w-2.5 h-2.5" />
                            Novo do Site
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {appt.serviceName ||
                          (appt.type === 'consulta_completa'
                            ? 'Exame de Refração Completo'
                            : appt.type === 'adaptacao_lentes'
                            ? 'Adaptação de Lentes de Contato'
                            : 'Atendimento Clínico')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        appt.status === 'pendente'
                          ? 'bg-amber-100 text-amber-800'
                          : appt.status === 'confirmado'
                          ? 'bg-teal-100 text-teal-800'
                          : appt.status === 'atendido' || appt.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'cancelado'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {appt.status === 'pendente'
                        ? 'Pendente'
                        : appt.status === 'confirmado'
                        ? 'Confirmado'
                        : appt.status === 'atendido'
                        ? 'Atendido'
                        : appt.status === 'cancelado'
                        ? 'Cancelado'
                        : appt.status}
                    </span>

                    {podeEditarAgenda && appt.status === 'pendente' && (
                      <button
                        onClick={() => handleConfirmar(appt)}
                        disabled={updatingId === appt.id}
                        className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors cursor-pointer"
                        title="Confirmar consulta e abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {podeEditarAgenda && appt.status === 'confirmado' && (
                      <button
                        onClick={() => handleMarcarAtendido(appt.id)}
                        disabled={updatingId === appt.id}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                        title="Marcar como Atendido"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna 2: Pendentes de Confirmação & Agendamentos do Site */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Pendentes de Confirmação</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Requerem contato prévio ou confirmação da recepção
              </p>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              {consultasPendentes.length}
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {consultasPendentes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Todos os agendamentos estão confirmados!
              </div>
            ) : (
              consultasPendentes.slice(0, 5).map((appt) => (
                <div key={appt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {appt.patientName}
                      </h4>
                      {appt.origem === 'site' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                          <Globe className="w-2.5 h-2.5" />
                          Site
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatDateBR(appt.date)} às {appt.time}</span>
                      <span>•</span>
                      <span className="truncate">{appt.patientPhone}</span>
                    </div>
                  </div>

                  {podeEditarAgenda && (
                    <button
                      onClick={() => handleConfirmar(appt)}
                      disabled={updatingId === appt.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Agendamentos do site entram com status pendente.
            </span>
            <Link
              to="/admin/agenda"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
