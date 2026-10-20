import {
  FinancialTransaction,
  FinancialSummary,
  FinancialFilters,
  FinancialCategoryTotal,
  FinancialCashFlowMonth,
} from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_FINANCIAL,
} from './storage-local';

export interface FinancialListResponse {
  sucesso: boolean;
  total: number;
  transacoes: FinancialTransaction[];
  resumo: FinancialSummary;
  alertas: {
    vencendoHoje: FinancialTransaction[];
    atrasadas: FinancialTransaction[];
  };
  totaisPorCategoria: FinancialCategoryTotal[];
  fluxoCaixaMensal: FinancialCashFlowMonth[];
}

class FinancialService {
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('consultorio_auth_user');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.sessionToken) {
            headers['Authorization'] = `Bearer ${parsed.sessionToken}`;
          }
        } catch {
          // ignore
        }
      }
    }
    return headers;
  }

  public async getList(filters?: FinancialFilters): Promise<FinancialListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.tipo && filters.tipo !== 'todos') params.set('tipo', filters.tipo);
      if (filters?.status && filters.status !== 'todos') params.set('status', filters.status);
      if (filters?.periodoInicio) params.set('periodoInicio', filters.periodoInicio);
      if (filters?.periodoFim) params.set('periodoFim', filters.periodoFim);
      if (filters?.categoria) params.set('categoria', filters.categoria);
      if (filters?.busca) params.set('busca', filters.busca);
      if (filters?.pacienteId) params.set('pacienteId', filters.pacienteId);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/financeiro${qs}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso) {
          // Atualiza cache local para redundância
          if (json.transacoes && Array.isArray(json.transacoes)) {
            setStoredData(STORAGE_KEYS.FINANCES, json.transacoes);
          }
          return json;
        }
      }
    } catch (e) {
      console.warn('Falha ao buscar movimentações na API backend:', e);
    }

    // Fallback local
    const localAll = getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
    const resumo = await this.getSummary();
    return {
      sucesso: true,
      total: localAll.length,
      transacoes: localAll,
      resumo,
      alertas: {
        vencendoHoje: [],
        atrasadas: [],
      },
      totaisPorCategoria: [],
      fluxoCaixaMensal: [],
    };
  }

  public async getAll(filters?: FinancialFilters): Promise<FinancialTransaction[]> {
    const listRes = await this.getList(filters);
    return listRes.transacoes;
  }

  public async getById(id: string): Promise<FinancialTransaction | null> {
    try {
      const res = await fetch(`/api/admin/financeiro/${id}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.transacao) {
          return json.transacao;
        }
      }
    } catch (e) {
      console.warn(`Falha ao buscar transação ${id} na API:`, e);
    }
    const all = await this.getAll();
    return all.find((t) => t.id === id) || null;
  }

  public async create(
    data: Partial<FinancialTransaction> & { parcelas?: number }
  ): Promise<FinancialTransaction> {
    try {
      const res = await fetch('/api/admin/financeiro', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.transacao) {
          const current = getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
          const novos = json.transacoes ? json.transacoes : [json.transacao];
          setStoredData(STORAGE_KEYS.FINANCES, [...novos, ...current]);
          return json.transacao;
        }
        throw new Error(json.error || 'Erro ao criar movimentação financeira');
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao cadastrar movimentação');
      }
    } catch (e: any) {
      console.warn('Falha no backend, criando localmente:', e);
      const newTransaction: FinancialTransaction = {
        id: `fin-${Date.now().toString(36)}`,
        type: data.type || 'receita',
        description: data.description || 'Movimentação sem descrição',
        amountInCents: data.amountInCents || 0,
        status: data.status || 'pendente',
        date: data.date || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || data.date || new Date().toISOString().split('T')[0],
        paymentDate: data.paymentDate,
        categoryName: data.categoryName || 'Geral',
        categoryId: data.categoryId,
        paymentMethodName: data.paymentMethodName || 'Pix',
        paymentMethodId: data.paymentMethodId,
        patientId: data.patientId,
        patientName: data.patientName,
        supplierName: data.supplierName,
        notes: data.notes,
        isRecurring: data.isRecurring,
        receiptUrl: data.receiptUrl,
        receiptName: data.receiptName,
      };
      const current = getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
      setStoredData(STORAGE_KEYS.FINANCES, [newTransaction, ...current]);
      return newTransaction;
    }
  }

  public async update(id: string, partial: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    try {
      const res = await fetch(`/api/admin/financeiro/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(partial),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.sucesso && json.transacao) {
          return json.transacao;
        }
        throw new Error(json.error || 'Erro ao atualizar');
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao atualizar movimentação');
      }
    } catch (e) {
      console.warn(`Erro ao atualizar transação ${id} no backend:`, e);
    }

    const current = getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Movimentação não encontrada');
    const updated = { ...current[index], ...partial };
    current[index] = updated;
    setStoredData(STORAGE_KEYS.FINANCES, current);
    return updated;
  }

  public async baixar(
    id: string,
    dadosBaixa: {
      paymentDate?: string;
      paymentMethodId?: string;
      paymentMethodName?: string;
      receiptUrl?: string;
      receiptName?: string;
      notes?: string;
    }
  ): Promise<FinancialTransaction> {
    const res = await fetch(`/api/admin/financeiro/${id}/baixar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(dadosBaixa),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erro ao registrar baixa financeira');
    }

    const json = await res.json();
    return json.transacao;
  }

  public async cancelar(id: string, motivo: string): Promise<FinancialTransaction> {
    const res = await fetch(`/api/admin/financeiro/${id}/cancelar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erro ao cancelar movimentação financeira');
    }

    const json = await res.json();
    return json.transacao;
  }

  public async delete(id: string): Promise<void> {
    const res = await fetch(`/api/admin/financeiro/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erro ao excluir movimentação financeira');
    }

    const current = getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
    setStoredData(
      STORAGE_KEYS.FINANCES,
      current.filter((t) => t.id !== id)
    );
  }

  public async getSummary(filters?: FinancialFilters): Promise<FinancialSummary> {
    try {
      const list = await this.getList(filters);
      return list.resumo;
    } catch {
      const list = await this.getAll();
      let totalIncomeInCents = 0;
      let totalExpenseInCents = 0;
      let pendingReceivableInCents = 0;
      let pendingPayableInCents = 0;
      let pendingCount = 0;

      for (const item of list) {
        if (item.status === 'cancelado') continue;
        if (item.status === 'pago') {
          if (item.type === 'receita') totalIncomeInCents += item.amountInCents;
          else if (item.type === 'despesa') totalExpenseInCents += item.amountInCents;
        } else if (item.status === 'pendente') {
          pendingCount++;
          if (item.type === 'receita') pendingReceivableInCents += item.amountInCents;
          else if (item.type === 'despesa') pendingPayableInCents += item.amountInCents;
        }
      }

      return {
        totalIncomeInCents,
        totalExpenseInCents,
        balanceInCents: totalIncomeInCents - totalExpenseInCents,
        pendingReceivableInCents,
        pendingPayableInCents,
        forecastBalanceInCents: totalIncomeInCents - totalExpenseInCents + pendingReceivableInCents - pendingPayableInCents,
        pendingCount,
        vencendoHojeCount: 0,
        atrasadasCount: 0,
      };
    }
  }

  public getCsvExportUrl(filters?: FinancialFilters): string {
    const params = new URLSearchParams();
    if (filters?.tipo && filters.tipo !== 'todos') params.set('tipo', filters.tipo);
    if (filters?.status && filters.status !== 'todos') params.set('status', filters.status);
    if (filters?.periodoInicio) params.set('periodoInicio', filters.periodoInicio);
    if (filters?.periodoFim) params.set('periodoFim', filters.periodoFim);
    if (filters?.categoria) params.set('categoria', filters.categoria);
    if (filters?.busca) params.set('busca', filters.busca);
    if (filters?.pacienteId) params.set('pacienteId', filters.pacienteId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return `/api/admin/financeiro/exportar-csv${qs}`;
  }
}

export const financialService = new FinancialService();
