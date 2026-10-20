import { Exam } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_EXAMS,
} from './storage-local';

class ExamsService {
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  public async getAll(params?: { pacienteId?: string; status?: string; busca?: string; data?: string }): Promise<Exam[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pacienteId) queryParams.set('pacienteId', params.pacienteId);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.busca) queryParams.set('busca', params.busca);
      if (params?.data) queryParams.set('data', params.data);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await fetch(`/api/admin/atendimento${qs}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && Array.isArray(json.atendimentos)) {
          // Normaliza formato AtendimentoRegistro para Exam
          return json.atendimentos.map((at: any) => this.mapAtendimentoToExam(at));
        }
      }
    } catch (e) {
      console.warn('Falha ao buscar atendimentos na API backend, usando fallback local:', e);
    }
    return getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  }

  public async getById(id: string): Promise<Exam | null> {
    try {
      const res = await fetch(`/api/admin/atendimento/${id}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.atendimento) {
          return this.mapAtendimentoToExam(json.atendimento);
        }
      }
    } catch (e) {
      console.warn(`Falha ao buscar atendimento ${id} na API backend:`, e);
    }
    const all = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    return all.find((e) => e.id === id) || null;
  }

  public async getByPatientId(patientId: string): Promise<Exam[]> {
    return this.getAll({ pacienteId: patientId });
  }

  public async create(data: Partial<Exam> & { concluir?: boolean; emitirReceita?: boolean; dadosReceita?: any }): Promise<Exam> {
    try {
      const payload = {
        agendamentoId: data.agendamentoId,
        pacienteId: data.patientId,
        pacienteNome: data.patientName,
        anamnese: data.anamnese,
        acuidadeVisual: {
          sc: data.visualAcuitySc || { od: '20/20', oe: '20/20' },
          cc: data.visualAcuityCc || { od: '20/20', oe: '20/20' },
        },
        refracao: {
          od: data.subjectiveRefraction?.od || {},
          oe: data.subjectiveRefraction?.oe || {},
          dpTotal: data.pupillaryDistance?.dpTotal,
        },
        ceratometria: data.keratometry,
        pressaoIntraocular: data.intraocularPressure,
        observacoes: data.clinicalFindings,
        condutaDiagnostica: data.diagnosisNotes,
        status: data.status || (data.concluir ? 'finalizado' : 'em_andamento'),
        concluir: data.concluir,
        emitirReceita: data.emitirReceita,
        dadosReceita: data.dadosReceita,
      };

      const res = await fetch('/api/admin/atendimento', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.atendimento) {
          const mapped = this.mapAtendimentoToExam(json.atendimento);
          // Atualiza cache local
          const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
          setStoredData(STORAGE_KEYS.EXAMS, [mapped, ...current]);
          return mapped;
        }
        throw new Error(json.error || 'Resposta inválida do servidor');
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao registrar atendimento clínico');
      }
    } catch (e: any) {
      console.warn('Erro ao salvar no backend, salvando localmente:', e);
      // Fallback local
      const now = new Date().toISOString();
      const newExam: Exam = {
        id: `ex-${Date.now().toString(36)}`,
        patientId: data.patientId || '',
        patientName: data.patientName || '',
        optometristId: data.optometristId || 'opt-01',
        optometristName: data.optometristName || 'Dr. Roberto Viana',
        date: data.date || now.split('T')[0],
        visualAcuitySc: data.visualAcuitySc || { od: '20/20', oe: '20/20' },
        visualAcuityCc: data.visualAcuityCc || { od: '20/20', oe: '20/20' },
        subjectiveRefraction: data.subjectiveRefraction || {
          od: { spherical: 0, cylindrical: 0, axis: 0 },
          oe: { spherical: 0, cylindrical: 0, axis: 0 },
        },
        pupillaryDistance: data.pupillaryDistance,
        keratometry: data.keratometry,
        intraocularPressure: data.intraocularPressure,
        clinicalFindings: data.clinicalFindings,
        diagnosisNotes: data.diagnosisNotes,
        lensesRecommendation: data.lensesRecommendation,
        status: data.concluir ? 'finalizado' : (data.status || 'finalizado'),
        createdAt: now,
      };
      const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
      setStoredData(STORAGE_KEYS.EXAMS, [newExam, ...current]);
      return newExam;
    }
  }

  public async update(id: string, partial: Partial<Exam> & { concluir?: boolean }): Promise<Exam> {
    try {
      const payload: any = {};
      if (partial.anamnese) payload.anamnese = partial.anamnese;
      if (partial.visualAcuitySc || partial.visualAcuityCc) {
        payload.acuidadeVisual = {
          sc: partial.visualAcuitySc,
          cc: partial.visualAcuityCc,
        };
      }
      if (partial.subjectiveRefraction) {
        payload.refracao = {
          od: partial.subjectiveRefraction.od,
          oe: partial.subjectiveRefraction.oe,
          dpTotal: partial.pupillaryDistance?.dpTotal,
        };
      }
      if (partial.clinicalFindings) payload.observacoes = partial.clinicalFindings;
      if (partial.diagnosisNotes) payload.condutaDiagnostica = partial.diagnosisNotes;
      if (partial.status) payload.status = partial.status;
      if (partial.concluir) payload.concluir = true;

      const res = await fetch(`/api/admin/atendimento/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.atendimento) {
          return this.mapAtendimentoToExam(json.atendimento);
        }
      }
    } catch (e) {
      console.warn(`Erro ao atualizar atendimento ${id} no backend:`, e);
    }

    const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const index = current.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('Exame não encontrado');
    }
    const updated = { ...current[index], ...partial };
    current[index] = updated;
    setStoredData(STORAGE_KEYS.EXAMS, current);
    return updated;
  }

  public async delete(id: string): Promise<void> {
    const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const updated = current.filter((e) => e.id !== id);
    setStoredData(STORAGE_KEYS.EXAMS, updated);
  }

  private mapAtendimentoToExam(at: any): Exam {
    return {
      id: at.id,
      patientId: at.pacienteId,
      patientName: at.pacienteNome,
      optometristId: at.optometristaId,
      optometristName: at.optometristaNome,
      date: at.data,
      agendamentoId: at.agendamentoId,
      anamnese: at.anamnese,
      visualAcuitySc: at.acuidadeVisual?.sc || { od: '20/20', oe: '20/20' },
      visualAcuityCc: at.acuidadeVisual?.cc || { od: '20/20', oe: '20/20' },
      subjectiveRefraction: {
        od: at.refracao?.od || { spherical: 0, cylindrical: 0, axis: 0 },
        oe: at.refracao?.oe || { spherical: 0, cylindrical: 0, axis: 0 },
      },
      pupillaryDistance: {
        dpTotal: at.refracao?.dpTotal || (Number(at.refracao?.od?.dnp || 0) + Number(at.refracao?.oe?.dnp || 0)) || undefined,
        dnpOd: at.refracao?.od?.dnp,
        dnpOe: at.refracao?.oe?.dnp,
      },
      keratometry: at.ceratometria,
      intraocularPressure: at.pressaoIntraocular,
      clinicalFindings: at.observacoes,
      diagnosisNotes: at.condutaDiagnostica,
      status: at.status || 'finalizado',
      receitaId: at.receitaId,
      createdAt: at.criadoEm || at.data,
      finalizadoEm: at.finalizadoEm,
    };
  }
}

export const examsService = new ExamsService();
