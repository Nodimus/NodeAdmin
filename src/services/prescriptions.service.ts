import { Prescription } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_PRESCRIPTIONS,
} from './storage-local';

export interface EnvioReceitaResponse {
  sucesso: boolean;
  mensagem: string;
  linkTemporario: string;
  expiraEm: string;
  textoWhatsapp?: string;
  destinatario: string;
  receita: Prescription;
}

class PrescriptionsService {
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

  public async getAll(params?: { pacienteId?: string; status?: string; busca?: string }): Promise<Prescription[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pacienteId) queryParams.set('pacienteId', params.pacienteId);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.busca) queryParams.set('busca', params.busca);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await fetch(`/api/admin/receitas${qs}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && Array.isArray(json.receitas)) {
          return json.receitas.map((r: any) => this.mapReceitaToPrescription(r));
        }
      }
    } catch (e) {
      console.warn('Falha ao buscar receitas no backend, usando fallback local:', e);
    }
    return getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
  }

  public async getById(id: string): Promise<Prescription | null> {
    try {
      const res = await fetch(`/api/admin/receitas/${id}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.receita) {
          return this.mapReceitaToPrescription(json.receita);
        }
      }
    } catch (e) {
      console.warn(`Erro ao buscar receita ${id} no backend:`, e);
    }
    const all = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    return all.find((p) => p.id === id) || null;
  }

  public async getByPatientId(patientId: string): Promise<Prescription[]> {
    return this.getAll({ pacienteId: patientId });
  }

  public async create(data: Partial<Prescription>): Promise<Prescription> {
    try {
      const payload = {
        pacienteId: data.patientId,
        atendimentoId: data.atendimentoId || data.examId,
        tabelaRefracao: {
          od: data.od,
          oe: data.oe,
          dpTotal: data.dpTotal,
        },
        tipoLente: data.lensType,
        tratamentos: data.coatings,
        observacoes: data.observacoes,
        recomendacoes: data.recommendations,
        validadeDias: data.validadeDias,
      };

      const res = await fetch('/api/admin/receitas', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.receita) {
          const mapped = this.mapReceitaToPrescription(json.receita);
          const current = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
          setStoredData(STORAGE_KEYS.PRESCRIPTIONS, [mapped, ...current]);
          return mapped;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao emitir receita óptica');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Erro ao emitir no backend, gravando localmente:', e);
      const now = new Date().toISOString();
      const current = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
      const seq = current.length + 1;
      const ano = new Date().getFullYear();
      const novoFormatado = `${ano}/${String(seq).padStart(4, '0')}`;

      const newPrescription: Prescription = {
        id: `rec-${Date.now().toString(36)}`,
        numeroSequencial: seq,
        numeroFormatado: novoFormatado,
        status: 'emitida',
        examId: data.examId,
        patientId: data.patientId || '',
        patientName: data.patientName || '',
        optometristName: data.optometristName || 'Dr. Roberto Viana',
        registerNumber: data.registerNumber || 'CBOO 14.892-SP | CBO 3223-05',
        date: data.date || now.split('T')[0],
        expirationDate: data.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        od: data.od || { spherical: 0, cylindrical: 0, axis: 0 },
        oe: data.oe || { spherical: 0, cylindrical: 0, axis: 0 },
        dpTotal: data.dpTotal,
        lensType: data.lensType || 'Monofocal',
        coatings: data.coatings || [],
        recommendations: data.recommendations || '',
        observacoes: data.observacoes || '',
        contagemReimpressoes: 0,
        createdAt: now,
      };

      setStoredData(STORAGE_KEYS.PRESCRIPTIONS, [newPrescription, ...current]);
      return newPrescription;
    }
    throw new Error('Falha inesperada ao emitir receita');
  }

  /**
   * Cancelar Receita Óptica com motivo obrigatório (Regra Prompt 09)
   */
  public async cancelar(id: string, motivo: string): Promise<Prescription> {
    const res = await fetch(`/api/admin/receitas/${id}/cancelar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.sucesso && json.receita) {
        const mapped = this.mapReceitaToPrescription(json.receita);
        const current = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
        const idx = current.findIndex((p) => p.id === id);
        if (idx !== -1) {
          current[idx] = mapped;
          setStoredData(STORAGE_KEYS.PRESCRIPTIONS, current);
        }
        return mapped;
      }
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao cancelar receita.');
  }

  /**
   * Reimpressão de Receita (Incrementa contador de 2ª via e audita)
   */
  public async reimprimir(id: string): Promise<{ contagemReimpressoes: number; receita: Prescription }> {
    const res = await fetch(`/api/admin/receitas/${id}/reimprimir`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.sucesso && json.receita) {
        const mapped = this.mapReceitaToPrescription(json.receita);
        return {
          contagemReimpressoes: json.contagemReimpressoes,
          receita: mapped,
        };
      }
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao registrar reimpressão de receita.');
  }

  /**
   * Enviar Receita por WhatsApp ou E-mail com Link Temporário Expirável (Regra Prompt 09)
   */
  public async enviar(id: string, tipo: 'whatsapp' | 'email', destinatario?: string): Promise<EnvioReceitaResponse> {
    const res = await fetch(`/api/admin/receitas/${id}/enviar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tipo, destinatario }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.sucesso) {
        return {
          sucesso: true,
          mensagem: json.mensagem,
          linkTemporario: json.linkTemporario,
          expiraEm: json.expiraEm,
          textoWhatsapp: json.textoWhatsapp,
          destinatario: json.destinatario,
          receita: this.mapReceitaToPrescription(json.receita),
        };
      }
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao enviar receita por ${tipo}.`);
  }

  public async getPublicDigital(token: string): Promise<Prescription> {
    const res = await fetch(`/api/public/receita-digital/${token}`);
    if (res.ok) {
      const json = await res.json();
      if (json.sucesso && json.receita) {
        return this.mapReceitaToPrescription(json.receita);
      }
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Não foi possível carregar a receita digital.');
  }

  private mapReceitaToPrescription(r: any): Prescription {
    return {
      id: r.id,
      numeroSequencial: r.numeroSequencial,
      numeroFormatado: r.numeroFormatado,
      status: r.status || (r.cancelada ? 'cancelada' : 'emitida'),
      examId: r.atendimentoId,
      atendimentoId: r.atendimentoId,
      patientId: r.pacienteId,
      patientName: r.snapshotPaciente?.nome || r.patientName,
      optometristName: r.snapshotProfissional?.nome || r.optometristName,
      registerNumber: r.snapshotProfissional?.registroProfissional || r.registerNumber,
      date: r.dataEmissao || r.date,
      expirationDate: r.dataValidade || r.expirationDate,
      validadeDias: r.validadeDias,
      od: r.tabelaRefracao?.od || r.od || { spherical: 0, cylindrical: 0, axis: 0 },
      oe: r.tabelaRefracao?.oe || r.oe || { spherical: 0, cylindrical: 0, axis: 0 },
      dpTotal: r.tabelaRefracao?.dpTotal || r.dpTotal,
      lensType: r.tipoLente || r.lensType,
      coatings: r.tratamentos || r.coatings || [],
      recommendations: r.recomendacoes || r.recommendations || '',
      observacoes: r.observacoes || '',
      snapshotConsultorio: r.snapshotConsultorio,
      snapshotProfissional: r.snapshotProfissional,
      snapshotPaciente: r.snapshotPaciente,
      contagemReimpressoes: r.contagemReimpressoes || 0,
      historicoEnvios: r.historicoEnvios || [],
      tokenAcessoTemporario: r.tokenAcessoTemporario,
      tokenExpiraEm: r.tokenExpiraEm,
      cancelada: Boolean(r.cancelada || r.status === 'cancelada'),
      motivoCancelamento: r.motivoCancelamento,
      canceladaEm: r.canceladaEm,
      canceladaPor: r.canceladaPor,
      createdAt: r.criadaEm || r.createdAt || r.dataEmissao,
    };
  }
}

export const prescriptionsService = new PrescriptionsService();
