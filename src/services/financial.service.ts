import { FinancialTransaction } from '../types';
import { getStoredData, setStoredData, STORAGE_KEYS, INITIAL_FINANCIAL } from './storage-local';

class FinancialService {
  public async getAll(): Promise<FinancialTransaction[]> {
    return getStoredData<FinancialTransaction[]>(STORAGE_KEYS.FINANCES, INITIAL_FINANCIAL);
  }

  public async create(data: Omit<FinancialTransaction, 'id'>): Promise<FinancialTransaction> {
    const newTransaction: FinancialTransaction = {
      ...data,
      id: `fin-${Date.now().toString(36)}`,
    };
    const current = await this.getAll();
    const updated = [newTransaction, ...current];
    setStoredData(STORAGE_KEYS.FINANCES, updated);
    return newTransaction;
  }

  public async getSummary(): Promise<{
    totalIncomeInCents: number;
    totalExpenseInCents: number;
    balanceInCents: number;
    pendingCount: number;
  }> {
    const list = await this.getAll();
    let totalIncomeInCents = 0;
    let totalExpenseInCents = 0;
    let pendingCount = 0;

    for (const item of list) {
      if (item.status === 'pago') {
        if (item.type === 'receita') totalIncomeInCents += item.amountInCents;
        else if (item.type === 'despesa') totalExpenseInCents += item.amountInCents;
      }
      if (item.status === 'pendente') {
        pendingCount++;
      }
    }

    return {
      totalIncomeInCents,
      totalExpenseInCents,
      balanceInCents: totalIncomeInCents - totalExpenseInCents,
      pendingCount,
    };
  }
}

export const financialService = new FinancialService();
