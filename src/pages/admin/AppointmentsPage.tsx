import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import { Appointment, AppointmentStatus, AppointmentType, Patient } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { formatDateBR } from '../../utils/formatters';

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { consultorio } = useConsultorio();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulário de Nova Consulta
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(45);
  const [type, setType] = useState<AppointmentType>('consulta_completa');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [appts, pats] = await Promise.all([
        appointmentsService.getAll(),
        patientsService.getAll(),
      ]);
      setAppointments(appts);
      setPatients(pats);
      if (pats.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pats[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const updated = await appointmentsService.updateStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    setSubmitting(true);
    try {
      const newAppt = await appointmentsService.create({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        date,
        time,
        durationMinutes: duration,
        type,
        status: 'agendado',
        optometristName: user?.displayName || consultorio.responsavelTecnico,
        notes,
      });

      setAppointments((prev) => [newAppt, ...prev]);
      setModalOpen(false);
      setNotes('');
    } catch (err) {
      console.error('Erro ao agendar consulta:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchStatus = selectedStatus === 'todos' || a.status === selectedStatus;
    const matchSearch =
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patientPhone.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-teal-600" />
            <span>Agenda & Atendimentos</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Gerencie os horários de consulta e a fila de espera do consultório
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nova Consulta</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filtrar por nome do paciente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-700 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'agendado', label: 'Agendados' },
            { id: 'confirmado', label: 'Confirmados' },
            { id: 'em_espera', label: 'Em Espera' },
            { id: 'em_atendimento', label: 'Em Atendimento' },
            { id: 'concluido', label: 'Concluídos' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Consultas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-700 text-sm">
            Nenhuma consulta encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((appt) => (
              <div
                key={appt.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Horário & Paciente */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center shrink-0 font-mono text-teal-800">
                    <span className="text-sm font-bold">{appt.time}</span>
                    <span className="text-[10px] text-teal-600 font-normal">{formatDateBR(appt.date)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {appt.patientName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600 border border-slate-200">
                        {appt.durationMinutes} min
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {appt.type === 'consulta_completa'
                        ? 'Consulta Optométrica Completa'
                        : appt.type === 'retorno'
                        ? 'Retorno Clínico'
                        : appt.type === 'adaptacao_lentes'
                        ? 'Adaptação de Lentes de Contato'
                        : appt.type === 'acuidade_infantil'
                        ? 'Triagem Visual Infantil'
                        : 'Atendimento de Urgência'}
                    </p>

                    {appt.notes && (
                      <p className="text-xs text-slate-700 italic">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Contato & Ações de Status */}
                <div className="flex flex-wrap items-center gap-3 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Link WhatsApp */}
                  <a
                    href={`https://wa.me/55${appt.patientPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(
                      appt.patientName
                    )},%20confirmamos%20sua%20consulta%20optom%C3%A9trica%20no%20dia%20${appt.date}%20%C3%A0s%20${appt.time}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
                    title="Enviar lembrete via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lembrete WhatsApp</span>
                  </a>

                  {/* Seletor Rápido de Status */}
                  <select
                    value={appt.status}
                    onChange={(e) => handleStatusChange(appt.id, e.target.value as AppointmentStatus)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${
                      appt.status === 'em_espera'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : appt.status === 'em_atendimento'
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                        : appt.status === 'concluido'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_espera">Em Espera na Recepção</option>
                    <option value="em_atendimento">Em Atendimento (Gabinete)</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Agendar Consulta Optométrica
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Paciente
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Procedimento
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AppointmentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="consulta_completa">Consulta Completa</option>
                    <option value="retorno">Retorno / Revisão</option>
                    <option value="adaptacao_lentes">Adaptação de Lentes</option>
                    <option value="acuidade_infantil">Acuidade Infantil</option>
                    <option value="urgencia">Urgência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duração Prevista
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações ou Queixa Inicial
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Queixa de cefaleia ao fim do dia, usuário de óculos há 3 anos..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
