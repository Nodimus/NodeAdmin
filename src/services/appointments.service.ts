import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Appointment, AppointmentStatus, Consultorio } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_APPOINTMENTS,
} from './storage-local';
import { offlineStorageService } from './offline-storage.service';

export interface DashboardResponse {
  sucesso: boolean;
  dataAtual: string;
  totalConsultasHoje: number;
  consultasHoje: Appointment[];
  totalPendentes: number;
  pendentesConfirmacao: Appointment[];
  totalNovosSite: number;
  temPermissaoFinanceiro: boolean;
  financeiroMes: {
    receitaCentavos: number;
    despesaCentavos: number;
    saldoCentavos: number;
    totalTransacoes: number;
  } | null;
}

export interface AgendaResponse {
  sucesso: boolean;
  total: number;
  agendamentos: Appointment[];
  bloqueios: Array<{ id?: string; data?: string; dataInicio?: string; dataFim?: string; motivo: string }>;
  motivosCancelamento: Array<{ id: string; nome: string; ativo: boolean }>;
}

class AppointmentsService {
  private collectionName = 'appointments';

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('consultorio_session_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Obtém os indicadores agregados do Dashboard com controle estrito de permissão para métricas financeiras
   */
  public async getDashboard(): Promise<DashboardResponse> {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao carregar /api/admin/dashboard:', e);
    }

    // Fallback local
    const hojeStr = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    const hoje = all.filter((a) => a.date === hojeStr);
    const pendentes = all.filter((a) => a.status === 'pendente');
    const novosSite = all.filter((a) => a.origem === 'site');

    return {
      sucesso: true,
      dataAtual: hojeStr,
      totalConsultasHoje: hoje.length,
      consultasHoje: hoje,
      totalPendentes: pendentes.length,
      pendentesConfirmacao: pendentes,
      totalNovosSite: novosSite.length,
      temPermissaoFinanceiro: false,
      financeiroMes: null,
    };
  }

  /**
   * Obtém todos os agendamentos cadastrados no consultório
   */
  public async getAll(filters?: { data?: string; status?: string; origem?: string }): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.data) params.append('data', filters.data);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.origem) params.append('origem', filters.origem);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/agenda${qs}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agendamentos) {
          // Normaliza campos do backend
          const normalizados: Appointment[] = data.agendamentos.map((item: any) => ({
            id: item.id,
            protocolo: item.protocolo,
            patientId: item.pacienteId || item.patientId || `pat-${item.id}`,
            patientName: item.nomeContato || item.patientName,
            patientPhone: item.telefone || item.patientPhone,
            patientEmail: item.email || item.patientEmail,
            serviceId: item.servicoId || item.serviceId,
            serviceName: item.servicoNome || item.serviceName,
            servicePriceInCents: item.servicoPrecoCentavos || item.servicePriceInCents || 16000,
            date: item.data || item.date,
            time: item.horario || item.time,
            durationMinutes: item.duracaoMin || item.durationMinutes || 40,
            type: item.type || 'consulta_completa',
            status: item.status,
            origem: item.origem || 'interno',
            optometristName: item.optometristaNome || item.optometristName,
            notes: item.observacoes || item.notes,
            motivoCancelamentoId: item.motivoCancelamentoId,
            motivoCancelamento: item.motivoCancelamento,
            createdAt: item.criadoEm || item.createdAt || new Date().toISOString(),
            updatedAt: item.atualizadoEm || item.updatedAt,
          }));
          setStoredData(STORAGE_KEYS.APPOINTMENTS, normalizados);
          offlineStorageService.salvarAgendaCache(normalizados).catch(() => {});
          return normalizados;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar /api/admin/agenda, tentando cache offline:', e);
      try {
        const cached = await offlineStorageService.obterAgendaCache();
        if (cached && cached.length > 0) {
          let filtrados = cached;
          if (filters?.data) filtrados = filtrados.filter((a: any) => a.date === filters.data);
          if (filters?.status && filters.status !== 'todos') filtrados = filtrados.filter((a: any) => a.status === filters.status);
          if (filters?.origem && filters.origem !== 'todos') filtrados = filtrados.filter((a: any) => a.origem === filters.origem);
          return filtrados;
        }
      } catch {}
    }

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Appointment[];
      } catch (e) {
        console.warn('Erro ao consultar agendamentos no Firestore:', e);
      }
    }

    return getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  public async getByDate(dateStr: string): Promise<Appointment[]> {
    const all = await this.getAll({ data: dateStr });
    return all.filter((a) => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  }

  public async getByPatientId(patientId: string): Promise<Appointment[]> {
    const all = await this.getAll();
    return all.filter((a) => a.patientId === patientId);
  }

  /**
   * Cria agendamento manual interno (origem: interno)
   */
  public async create(data: Partial<Appointment> & { patientName: string; date: string; time: string }): Promise<Appointment> {
    try {
      const payload = {
        pacienteId: data.patientId,
        nomeContato: data.patientName,
        telefone: data.patientPhone || '',
        email: data.patientEmail || '',
        servicoId: data.serviceId || 'srv-001',
        data: data.date,
        horario: data.time,
        duracaoMin: data.durationMinutes || 40,
        observacoes: data.notes,
        optometristaNome: data.optometristName,
      };

      const res = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ao agendar consulta (${res.status})`);
      }

      const resJson = await res.json();
      const raw = resJson.agendamento;
      const novo: Appointment = {
        id: raw.id,
        protocolo: raw.protocolo,
        patientId: raw.pacienteId || data.patientId || `pat-${raw.id}`,
        patientName: raw.nomeContato || data.patientName,
        patientPhone: raw.telefone || data.patientPhone || '',
        patientEmail: raw.email || data.patientEmail,
        serviceId: raw.servicoId || data.serviceId,
        serviceName: raw.servicoNome || data.serviceName || 'Consulta Optométrica Completa',
        servicePriceInCents: raw.servicoPrecoCentavos || 16000,
        date: raw.data || data.date,
        time: raw.horario || data.time,
        durationMinutes: raw.duracaoMin || data.durationMinutes || 40,
        type: data.type || 'consulta_completa',
        status: raw.status || 'confirmado',
        origem: 'interno',
        optometristName: raw.optometristaNome || data.optometristName,
        notes: raw.observacoes || data.notes,
        createdAt: raw.criadoEm || new Date().toISOString(),
      };

      const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
      setStoredData(STORAGE_KEYS.APPOINTMENTS, [novo, ...current]);
      return novo;
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) {
        throw err;
      }
      console.warn('Erro ao criar via REST, salvando local:', err);
    }

    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      id: `apt-${Date.now().toString(36)}`,
      protocolo: `OPTO-INT-${Date.now().toString(36).toUpperCase()}`,
      patientId: data.patientId || `pat-${Date.now()}`,
      patientName: data.patientName,
      patientPhone: data.patientPhone || '',
      patientEmail: data.patientEmail,
      serviceId: data.serviceId || 'srv-001',
      serviceName: data.serviceName || 'Consulta Optométrica Completa',
      servicePriceInCents: data.servicePriceInCents || 16000,
      date: data.date,
      time: data.time,
      durationMinutes: data.durationMinutes || 40,
      type: data.type || 'consulta_completa',
      status: 'confirmado',
      origem: 'interno',
      optometristName: data.optometristName,
      notes: data.notes,
      createdAt: now,
    };

    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    setStoredData(STORAGE_KEYS.APPOINTMENTS, [newAppointment, ...current]);
    return newAppointment;
  }

  /**
   * Remarcar consulta com validação de duplicidade e bloqueios
   */
  public async reschedule(id: string, novaData: string, novoHorario: string): Promise<Appointment> {
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ acao: 'remarcar', novaData, novoHorario }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ao remarcar consulta (${res.status})`);
      }

      const resJson = await res.json();
      return this.mapBackendAppointment(resJson.agendamento);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) {
        throw err;
      }
    }

    return this.updateLocal(id, { date: novaData, time: novoHorario, status: 'remarcado' });
  }

  /**
   * Confirmar consulta
   */
  public async confirm(id: string): Promise<{ agendamento: Appointment; mensagemWhatsapp?: string; linkWhatsApp?: string }> {
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ acao: 'confirmar', status: 'confirmado' }),
      });

      if (res.ok) {
        const resJson = await res.json();
        const appt = this.mapBackendAppointment(resJson.agendamento);
        return {
          agendamento: appt,
          mensagemWhatsapp: resJson.mensagemWhatsapp,
          linkWhatsApp: resJson.linkWhatsApp,
        };
      }
    } catch (err) {
      console.warn('Erro ao confirmar via REST:', err);
    }

    const appt = await this.updateLocal(id, { status: 'confirmado' });
    return { agendamento: appt };
  }

  /**
   * Cancelar consulta com motivo obrigatório
   */
  public async cancel(id: string, motivoCancelamento: string, motivoCancelamentoId?: string): Promise<Appointment> {
    if (!motivoCancelamento && !motivoCancelamentoId) {
      throw new Error('É obrigatório informar o motivo do cancelamento.');
    }

    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          acao: 'cancelar',
          status: 'cancelado',
          motivoCancelamento,
          motivoCancelamentoId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ao cancelar consulta (${res.status})`);
      }

      const resJson = await res.json();
      return this.mapBackendAppointment(resJson.agendamento);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) {
        throw err;
      }
    }

    return this.updateLocal(id, {
      status: 'cancelado',
      motivoCancelamento,
      motivoCancelamentoId,
    });
  }

  /**
   * Marcar consulta como atendida
   */
  /**
   * Marcar consulta como atendida (com vínculo automático ou sugestão de duplicados)
   */
  public async markAttended(
    id: string,
    vinculoParams?: { pacienteId?: string; criarNovo?: boolean; forcarCriar?: boolean }
  ): Promise<Appointment | { requerVinculoPaciente: true; duplicados: any[]; agendamento: Appointment }> {
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ acao: 'atendido', status: 'atendido', ...(vinculoParams || {}) }),
      });
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.requerVinculoPaciente) {
          return {
            requerVinculoPaciente: true,
            duplicados: resJson.duplicados,
            agendamento: this.mapBackendAppointment(resJson.agendamento),
          };
        }
        return this.mapBackendAppointment(resJson.agendamento);
      }
    } catch (err) {
      console.warn('Erro ao marcar atendido via REST:', err);
    }

    return this.updateLocal(id, { status: 'atendido' });
  }

  /**
   * Marcar paciente como faltoso
   */
  public async markNoShow(id: string): Promise<Appointment> {
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ acao: 'faltou', status: 'faltou' }),
      });
      if (res.ok) {
        const resJson = await res.json();
        return this.mapBackendAppointment(resJson.agendamento);
      }
    } catch (err) {
      console.warn('Erro ao marcar faltoso via REST:', err);
    }

    return this.updateLocal(id, { status: 'faltou' });
  }

  /**
   * Atualização genérica de status
   */
  public async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    if (status === 'confirmado') {
      const res = await this.confirm(id);
      return res.agendamento;
    }
    if (status === 'atendido') {
      const res = await this.markAttended(id);
      if ('agendamento' in res) {
        return res.agendamento;
      }
      return res;
    }
    if (status === 'faltou') {
      return this.markNoShow(id);
    }

    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const resJson = await res.json();
        return this.mapBackendAppointment(resJson.agendamento);
      }
    } catch (err) {
      console.warn('Offline: gravando mutação de status na fila local:', err);
      offlineStorageService
        .enfileirarMutacaoOffline('agenda', 'atualizar_status', {
          id,
          novoStatus: status,
          timestamp: Date.now(),
        })
        .catch(() => {});
    }

    return this.updateLocal(id, { status });
  }

  /**
   * Obtém os dados e link pré-preenchido do WhatsApp para envio ao paciente
   */
  public async getWhatsAppLink(id: string): Promise<{ texto: string; linkWhatsApp: string }> {
    try {
      const res = await fetch(`/api/admin/agenda/${id}/whatsapp`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao buscar WhatsApp via REST:', e);
    }

    // Fallback local
    const appts = await this.getAll();
    const appt = appts.find((a) => a.id === id);
    const tel = (appt?.patientPhone || '').replace(/\D/g, '');
    const ddi = tel.startsWith('55') ? tel : `55${tel}`;
    const texto = `Olá ${appt?.patientName || 'Paciente'}! Confirmamos sua consulta de ${appt?.serviceName || 'Optometria'} para ${appt?.date} às ${appt?.time}.`;
    return {
      texto,
      linkWhatsApp: `https://api.whatsapp.com/send?phone=${ddi}&text=${encodeURIComponent(texto)}`,
    };
  }

  public async delete(id: string): Promise<void> {
    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = current.filter((a) => a.id !== id);
    setStoredData(STORAGE_KEYS.APPOINTMENTS, updated);
  }

  private mapBackendAppointment(raw: any): Appointment {
    return {
      id: raw.id,
      protocolo: raw.protocolo,
      patientId: raw.pacienteId || raw.patientId,
      patientName: raw.nomeContato || raw.patientName,
      patientPhone: raw.telefone || raw.patientPhone,
      patientEmail: raw.email || raw.patientEmail,
      serviceId: raw.servicoId || raw.serviceId,
      serviceName: raw.servicoNome || raw.serviceName,
      servicePriceInCents: raw.servicoPrecoCentavos || raw.servicePriceInCents || 16000,
      date: raw.data || raw.date,
      time: raw.horario || raw.time,
      durationMinutes: raw.duracaoMin || raw.durationMinutes || 40,
      type: raw.type || 'consulta_completa',
      status: raw.status,
      origem: raw.origem || 'interno',
      optometristName: raw.optometristaNome || raw.optometristName,
      notes: raw.observacoes || raw.notes,
      motivoCancelamentoId: raw.motivoCancelamentoId,
      motivoCancelamento: raw.motivoCancelamento,
      createdAt: raw.criadoEm || raw.createdAt,
      updatedAt: raw.atualizadoEm || raw.updatedAt,
    };
  }

  private async updateLocal(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Agendamento não encontrado.');
    }
    current[index] = { ...current[index], ...updates, updatedAt: new Date().toISOString() };
    setStoredData(STORAGE_KEYS.APPOINTMENTS, current);
    return current[index];
  }
}

export const appointmentsService = new AppointmentsService();
