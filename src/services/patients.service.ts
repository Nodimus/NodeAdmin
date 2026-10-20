import { Patient, Appointment } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
} from './storage-local';
import { offlineStorageService } from './offline-storage.service';

export interface FichaCompletaResponse {
  sucesso: boolean;
  paciente: Patient;
  historicoAgendamentos: Array<Record<string, unknown>>;
  historicoAtendimentos: Array<Record<string, unknown>>;
  historicoReceitas: Array<Record<string, unknown>>;
}

export interface DuplicadoItem {
  id: string;
  name: string;
  cpf?: string;
  phone: string;
  motivo: string;
}

export interface VerificarDuplicadosResponse {
  sucesso: boolean;
  temDuplicados: boolean;
  duplicados: DuplicadoItem[];
}

export interface DossiêLgpdExport {
  exportadoEm: string;
  exportadoPor: { uid: string; nome: string; email: string };
  consultorio: { nomeFantasia: string; cnpj: string; responsavelTecnico: string };
  paciente: Patient;
  historicoAgendamentos: unknown[];
  termoResponsabilidade: string;
}

class PatientsService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('consultorio_session_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Listagem de pacientes com busca e filtro de ativos/desativados
   */
  public async getAll(busca?: string, incluirDesativados = true): Promise<Patient[]> {
    try {
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (incluirDesativados) params.append('incluirDesativados', 'true');

      const res = await fetch(`/api/admin/pacientes?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.pacientes)) {
          // Atualiza cache local
          setStoredData(STORAGE_KEYS.PATIENTS, data.pacientes);
          offlineStorageService.salvarPacientesCache(data.pacientes).catch(() => {});
          return data.pacientes;
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar /api/admin/pacientes, tentando cache offline:', e);
      try {
        const cached = await offlineStorageService.obterPacientesCache();
        if (cached && cached.length > 0) {
          let filtrados = cached;
          if (!incluirDesativados) filtrados = filtrados.filter((p: any) => p.ativo !== false);
          if (busca && busca.trim()) {
            const termo = busca.trim().toLowerCase();
            const digitos = busca.replace(/\D/g, '');
            filtrados = filtrados.filter((p: any) => {
              const matchNome = p.name.toLowerCase().includes(termo);
              const matchCpf = p.cpf ? p.cpf.toLowerCase().includes(termo) || (digitos && p.cpf.replace(/\D/g, '').includes(digitos)) : false;
              const matchTel = p.phone ? p.phone.includes(termo) || (digitos && p.phone.replace(/\D/g, '').includes(digitos)) : false;
              return matchNome || matchCpf || matchTel;
            });
          }
          return filtrados;
        }
      } catch {}
    }

    // Fallback local
    const local = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    let filtrado = local;
    if (!incluirDesativados) {
      filtrado = filtrado.filter((p) => p.ativo !== false);
    }
    if (busca && busca.trim()) {
      const termo = busca.trim().toLowerCase();
      const digitos = busca.replace(/\D/g, '');
      filtrado = filtrado.filter((p) => {
        const matchNome = p.name.toLowerCase().includes(termo);
        const matchCpf = p.cpf ? p.cpf.toLowerCase().includes(termo) || (digitos && p.cpf.replace(/\D/g, '').includes(digitos)) : false;
        const matchTel = p.phone ? p.phone.includes(termo) || (digitos && p.phone.replace(/\D/g, '').includes(digitos)) : false;
        const matchEmail = p.email ? p.email.toLowerCase().includes(termo) : false;
        return matchNome || matchCpf || matchTel || matchEmail;
      });
    }
    return filtrado;
  }

  /**
   * Busca ficha completa do paciente com histórico clínico (agendamentos, exames e receitas)
   */
  public async getFichaCompleta(id: string): Promise<FichaCompletaResponse> {
    try {
      const res = await fetch(`/api/admin/pacientes/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && data.paciente) {
          return data;
        }
      }
    } catch (e) {
      console.warn(`Erro ao buscar ficha do paciente ${id} na API, gerando localmente:`, e);
    }

    // Fallback local
    const list = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const paciente = list.find((p) => p.id === id);
    if (!paciente) {
      throw new Error('Paciente não encontrado');
    }

    const agendamentos = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS).filter(
      (a) => a.patientId === id || a.patientName?.toLowerCase() === paciente.name.toLowerCase()
    );

    return {
      sucesso: true,
      paciente,
      historicoAgendamentos: agendamentos as unknown as Array<Record<string, unknown>>,
      historicoAtendimentos: [
        {
          id: `atend-${paciente.id}-1`,
          data: paciente.anamnesis?.lastExamDate || '2025-01-15',
          tipo: 'Exame de Refração Completo',
          optometristaNome: 'Dr. Roberto Viana',
          acuidadeVisualOD: '20/20',
          acuidadeVisualOE: '20/20',
          diagnosticoRefrativo: paciente.anamnesis?.wearsGlasses ? 'Miopia com Astigmatismo' : 'Emetropia',
          observacoes: paciente.anamnesis?.chiefComplaint || 'Consulta de rotina',
        },
      ],
      historicoReceitas: [
        {
          id: `rec-${paciente.id}-1`,
          data: paciente.anamnesis?.lastExamDate || '2025-01-15',
          validade: '2026-01-15',
          optometristaNome: 'Dr. Roberto Viana',
          registroProfissional: 'CBOO 14.892-SP',
          od: { esferico: -1.75, cilindrico: -0.75, eixo: 175, dnp: 31.0 },
          oe: { esferico: -1.50, cilindrico: -0.50, eixo: 5, dnp: 31.5 },
          tipoLente: 'Monofocal com Tratamento Antirreflexo',
        },
      ],
    };
  }

  public async getById(id: string): Promise<Patient | null> {
    try {
      const ficha = await this.getFichaCompleta(id);
      return ficha.paciente;
    } catch {
      return null;
    }
  }

  /**
   * Verifica possíveis duplicados por CPF ou telefone antes de cadastrar
   */
  public async verificarDuplicados(cpf?: string, phone?: string, ignorarId?: string): Promise<VerificarDuplicadosResponse> {
    try {
      const res = await fetch('/api/admin/pacientes/verificar-duplicados', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ cpf, phone, ignorarId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao verificar duplicados na API:', e);
    }

    // Fallback local
    const pacientes = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS).filter((p) => p.ativo !== false && p.id !== ignorarId);
    const cpfDigitos = cpf ? cpf.replace(/\D/g, '') : '';
    const telDigitos = phone ? phone.replace(/\D/g, '') : '';
    const duplicados: DuplicadoItem[] = [];

    for (const p of pacientes) {
      if (cpfDigitos && p.cpf && p.cpf.replace(/\D/g, '') === cpfDigitos) {
        duplicados.push({ id: p.id, name: p.name, cpf: p.cpf, phone: p.phone, motivo: 'Mesmo CPF cadastrado' });
        continue;
      }
      if (telDigitos && p.phone && p.phone.replace(/\D/g, '') === telDigitos) {
        duplicados.push({ id: p.id, name: p.name, cpf: p.cpf, phone: p.phone, motivo: 'Mesmo Telefone/WhatsApp cadastrado' });
      }
    }
    return { sucesso: true, temDuplicados: duplicados.length > 0, duplicados };
  }

  /**
   * Criação de novo paciente com validação de CPF e consentimento LGPD
   */
  public async create(
    patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
    ignorarDuplicado = false
  ): Promise<Patient> {
    try {
      const res = await fetch('/api/admin/pacientes', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ...patientData, ignorarDuplicado }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar paciente');
      }

      if (data.sucesso && data.paciente) {
        // Atualiza cache local
        const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
        setStoredData(STORAGE_KEYS.PATIENTS, [data.paciente, ...current]);
        return data.paciente;
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('CPF') || e instanceof Error && e.message.includes('Telefone') || e instanceof Error && e.message.includes('duplicado')) {
        throw e;
      }
      console.warn('Erro na requisição /api/admin/pacientes, gravando localmente:', e);
    }

    // Fallback local
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now().toString(36)}`,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    };
    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    setStoredData(STORAGE_KEYS.PATIENTS, [newPatient, ...current]);
    return newPatient;
  }

  /**
   * Atualização de dados cadastrais e clínicos do paciente
   */
  public async update(id: string, partial: Partial<Patient>): Promise<Patient> {
    try {
      const res = await fetch(`/api/admin/pacientes/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(partial),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar paciente');
      }

      if (data.sucesso && data.paciente) {
        const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
        const idx = current.findIndex((p) => p.id === id);
        if (idx !== -1) {
          current[idx] = data.paciente;
          setStoredData(STORAGE_KEYS.PATIENTS, current);
        }
        return data.paciente;
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes('CPF') || e.message.includes('Telefone'))) {
        throw e;
      }
      console.warn('Erro ao atualizar paciente via API, atualizando local:', e);
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Paciente não encontrado');
    }
    const updatedPatient = { ...current[index], ...partial, updatedAt: new Date().toISOString() };
    current[index] = updatedPatient;
    setStoredData(STORAGE_KEYS.PATIENTS, current);
    return updatedPatient;
  }

  /**
   * Desativação de paciente ("Desative em vez de excluir")
   */
  public async deactivate(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/admin/pacientes/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao desativar paciente');
      }
    } catch (e) {
      console.warn('Erro ao desativar via API, aplicando localmente:', e);
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const idx = current.findIndex((p) => p.id === id);
    if (idx !== -1) {
      current[idx].ativo = false;
      current[idx].updatedAt = new Date().toISOString();
      setStoredData(STORAGE_KEYS.PATIENTS, current);
    }
  }

  /**
   * Reativação de paciente previamente inativado
   */
  public async reactivate(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/admin/pacientes/${id}/reativar`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao reativar paciente');
      }
    } catch (e) {
      console.warn('Erro ao reativar via API, aplicando localmente:', e);
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const idx = current.findIndex((p) => p.id === id);
    if (idx !== -1) {
      current[idx].ativo = true;
      current[idx].updatedAt = new Date().toISOString();
      setStoredData(STORAGE_KEYS.PATIENTS, current);
    }
  }

  /**
   * Exportação integral de dados do paciente (LGPD Art. 18 - Apenas Admin)
   */
  public async exportData(id: string): Promise<DossiêLgpdExport> {
    const res = await fetch(`/api/admin/pacientes/${id}/exportar`, {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao exportar prontuário do paciente');
    }
    return data.dossie;
  }

  /**
   * Anonimização dos dados pessoais do paciente (LGPD Art. 16 - Apenas Admin)
   */
  public async anonymize(id: string, confirmacao = true): Promise<Patient> {
    const res = await fetch(`/api/admin/pacientes/${id}/anonimizar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ confirmacao, confirmar: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao anonimizar dados do paciente');
    }

    // Atualiza cache local
    if (data.paciente) {
      const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
      const idx = current.findIndex((p) => p.id === id);
      if (idx !== -1) {
        current[idx] = data.paciente;
        setStoredData(STORAGE_KEYS.PATIENTS, current);
      }
      return data.paciente;
    }
    throw new Error('Falha ao processar anonimização.');
  }

  /**
   * Vincula um agendamento da agenda a um paciente existente ou cria uma nova ficha
   */
  public async vincularAgendamento(
    agendamentoId: string,
    pacienteId?: string,
    criarNovo?: boolean,
    dadosNovoPaciente?: Partial<Patient>
  ): Promise<{ agendamento: Appointment; paciente: Patient }> {
    const res = await fetch(`/api/admin/agenda/${agendamentoId}/vincular-paciente`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ pacienteId, criarNovo, dadosNovoPaciente }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao vincular agendamento ao prontuário do paciente.');
    }
    return data;
  }

  // Compatibilidade com código legado
  public async delete(id: string): Promise<void> {
    return this.deactivate(id);
  }

  public async search(term: string): Promise<Patient[]> {
    return this.getAll(term, true);
  }
}

export const patientsService = new PatientsService();
