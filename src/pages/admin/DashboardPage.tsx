import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  CalendarCheck,
  TrendingUp,
  Glasses,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { appointmentsService } from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import { examsService } from '../../services/exams.service';
import { financialService } from '../../services/financial.service';
import { Appointment, Patient, Exam } from '../../types';
import { formatCurrencyFromCents, formatDateBR } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user, isFirebaseConnected } = useAuth();
  const { consultorio } = useConsultorio();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncomeInCents: 0,
    totalExpenseInCents: 0,
    balanceInCents: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [apptsData, patsData, examsData, finData] = await Promise.all([
          appointmentsService.getAll(),
          patientsService.getAll(),
          examsService.getAll(),
          financialService.getSummary(),
        ]);
        setAppointments(apptsData);
        setPatients(patsData);
        setExams(examsData);
        setFinancialSummary(finData);
      } catch (e) {
        console.error('Erro ao carregar dados do painel:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const todayAppointments = appointments.filter((a) => a.date >= '2026-10-15');

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      const updated = await appointmentsService.updateStatus(id, status);
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    } catch (e) {
      console.error(e);
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
              {isFirebaseConnected ? 'Firebase Conectado' : 'Modo Demonstração (Dados Locais)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user?.displayName || 'Doutor(a)'}!
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Painel de gestão de <strong>{consultorio.nomeFantasia}</strong>.
            Você possui <strong>{todayAppointments.length} consultas</strong> na agenda prioritária e <strong>{patients.length} pacientes</strong> cadastrados.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/exames?action=novo')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Novo Exame Refrativo</span>
            </button>
            <button
              onClick={() => navigate('/admin/agenda')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              <span>Ver Agenda do Consultório</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Consultas Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {todayAppointments.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-700">
            <span className="font-medium text-emerald-600">
              {todayAppointments.filter((a) => a.status === 'concluido').length} atendidos
            </span>
            <span>•</span>
            <span>{todayAppointments.filter((a) => a.status === 'em_espera').length} em espera</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pacientes Cadastrados
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {patients.length}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            Prontuários registrados no consultório
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Exames Realizados
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {exams.length}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            Refrações ópticas arquivadas
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Faturamento no Caixa
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrencyFromCents(financialSummary.totalIncomeInCents)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>Saldo: {formatCurrencyFromCents(financialSummary.balanceInCents)}</span>
          </div>
        </div>
      </div>

      {/* Fila do Dia & Refrações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Fila de Consultas do Dia
              </h2>
              <p className="text-xs text-slate-700">
                Controle de recepção e gabinete em tempo real
              </p>
            </div>
            <Link
              to="/admin/agenda"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>Ver agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {todayAppointments.length === 0 ? (
              <div className="py-10 text-center text-slate-700 text-sm">
                Nenhuma consulta agendada para hoje.
              </div>
            ) : (
              todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-mono font-bold text-slate-700 shrink-0">
                      <span className="text-xs">{appt.time}</span>
                      <span className="text-[9px] text-slate-700 font-normal">{appt.durationMinutes}m</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {appt.patientName}
                      </h4>
                      <p className="text-xs text-slate-700">
                        {appt.type === 'consulta_completa'
                          ? 'Consulta Optométrica Completa'
                          : appt.type === 'retorno'
                          ? 'Retorno Clínico'
                          : appt.type === 'adaptacao_lentes'
                          ? 'Adaptação de Lentes de Contato'
                          : appt.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        appt.status === 'em_espera'
                          ? 'bg-amber-100 text-amber-800'
                          : appt.status === 'em_atendimento'
                          ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                          : appt.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {appt.status === 'em_espera'
                        ? 'Em Espera'
                        : appt.status === 'em_atendimento'
                        ? 'Em Atendimento'
                        : appt.status === 'concluido'
                        ? 'Concluído'
                        : 'Confirmado'}
                    </span>

                    {appt.status !== 'concluido' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            appt.id,
                            appt.status === 'em_atendimento' ? 'concluido' : 'em_atendimento'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors cursor-pointer"
                      >
                        {appt.status === 'em_atendimento' ? 'Finalizar' : 'Atender'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Últimas Refrações Registradas</span>
              </h3>
              <Link to="/admin/exames" className="text-xs text-teal-600 font-semibold hover:underline">
                Ver todas
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {exams.slice(0, 3).map((exam) => (
                <div key={exam.id} className="py-3 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="font-bold text-slate-800">{exam.patientName}</span>
                    <span className="text-slate-700">{formatDateBR(exam.date)}</span>
                  </div>
                  <div className="mt-1.5 p-2 rounded-lg bg-slate-50 font-mono text-[11px] grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-teal-700 font-bold">OD: </span>
                      {exam.subjectiveRefraction.od.spherical >= 0 ? '+' : ''}
                      {exam.subjectiveRefraction.od.spherical.toFixed(2)} ESF /{' '}
                      {exam.subjectiveRefraction.od.cylindrical.toFixed(2)} CIL x{' '}
                      {exam.subjectiveRefraction.od.axis}°
                    </div>
                    <div>
                      <span className="text-teal-700 font-bold">OE: </span>
                      {exam.subjectiveRefraction.oe.spherical >= 0 ? '+' : ''}
                      {exam.subjectiveRefraction.oe.spherical.toFixed(2)} ESF /{' '}
                      {exam.subjectiveRefraction.oe.cylindrical.toFixed(2)} CIL x{' '}
                      {exam.subjectiveRefraction.oe.axis}°
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900">
            <div className="flex items-center gap-2 font-bold mb-1 text-teal-950">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Prontuário Único do Consultório</span>
            </div>
            <p className="leading-relaxed text-teal-800">
              Sistema de uso privativo do <strong>{consultorio.nomeFantasia}</strong>. Todos os dados clínicos, acuidade e receitas permanecem sob sigilo profissional do responsável técnico {consultorio.responsavelTecnico}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
