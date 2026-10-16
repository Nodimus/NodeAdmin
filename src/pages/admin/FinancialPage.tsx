import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { financialService } from '../../services/financial.service';
import { FinancialTransaction } from '../../types';
import { formatCurrencyFromCents, parseToCents, formatDateBR } from '../../utils/formatters';

export const FinancialPage: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState({
    totalIncomeInCents: 0,
    totalExpenseInCents: 0,
    balanceInCents: 0,
    pendingCount: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulário Nova Transação
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [category, setCategory] = useState<FinancialTransaction['category']>('consulta');
  const [amountStr, setAmountStr] = useState('180,00');
  const [paymentMethod, setPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('pix');
  const [patientName, setPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFinances();
  }, []);

  async function loadFinances() {
    setLoading(true);
    try {
      const [allTx, sum] = await Promise.all([
        financialService.getAll(),
        financialService.getSummary(),
      ]);
      setTransactions(allTx);
      setSummary(sum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = parseToCents(amountStr);
    if (!description || amountInCents <= 0) return;

    setSubmitting(true);
    try {
      const newTx = await financialService.create({
        date: new Date().toISOString().split('T')[0],
        description,
        type,
        category,
        amountInCents,
        status: 'pago',
        paymentMethod,
        patientName: patientName || undefined,
      });

      setTransactions((prev) => [newTx, ...prev]);
      const updatedSum = await financialService.getSummary();
      setSummary(updatedSum);
      setModalOpen(false);
      setDescription('');
      setPatientName('');
      setAmountStr('180,00');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-teal-600" />
            <span>Financeiro & Caixa do Consultório</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Controle de receitas de consultas, procedimentos, óculos e despesas clínicas (Valores em centavos inteiros)
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Movimentação</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Receitas Realizadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrencyFromCents(summary.totalIncomeInCents)}
          </p>
          <p className="text-xs text-slate-700 mt-1">Consultas e procedimentos</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Despesas Operacionais
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {formatCurrencyFromCents(summary.totalExpenseInCents)}
          </p>
          <p className="text-xs text-slate-700 mt-1">Insumos e manutenção do consultório</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Saldo em Caixa
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrencyFromCents(summary.balanceInCents)}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Margem Operacional Líquida</p>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Extrato de Movimentações</h3>
          <span className="text-xs text-slate-700 font-medium">{transactions.length} registros</span>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'receita'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {tx.type === 'receita' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-800">{tx.description}</h4>
                  <div className="flex items-center gap-2 text-slate-700 mt-0.5">
                    <span>{formatDateBR(tx.date)}</span>
                    <span>•</span>
                    <span className="uppercase font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {tx.paymentMethod}
                    </span>
                    {tx.patientName && (
                      <>
                        <span>•</span>
                        <span>{tx.patientName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-bold font-mono ${
                    tx.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'receita' ? '+' : '-'} {formatCurrencyFromCents(tx.amountInCents)}
                </span>
                <span className="block text-[10px] text-slate-700 capitalize">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Lançamento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Lançar no Caixa</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('receita')}
                  className={`py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                    type === 'receita'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  + Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setType('despesa')}
                  className={`py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                    type === 'despesa'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  - Despesa (Saída)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Consulta Optométrica Refração"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor em Reais (R$) *</label>
                  <input
                    type="text"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="180,00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-700">Gravado como centavos inteiros</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paciente Vinculado (Opcional)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-medium text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50">
                  {submitting ? 'Gravando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
