import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  X,
  Paperclip,
  Eye,
  Ban,
  RefreshCw,
  AlertCircle,
  Repeat,
  Layers,
  ChevronDown,
  User,
  Building,
  Check,
} from 'lucide-react';
import { financialService } from '../../services/financial.service';
import { patientsService } from '../../services/patients.service';
import {
  FinancialTransaction,
  FinancialSummary,
  FinancialCategoryTotal,
  FinancialCashFlowMonth,
  Patient,
} from '../../types';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatCurrencyFromCents,
  parseToCents,
  formatDateBR,
} from '../../utils/formatters';

export const FinancialPage: React.FC = () => {
  const { consultorio } = useConsultorio();
  const { user, hasPermission } = useAuth();

  // Permissões
  const isAdmin = user?.role === 'admin' || user?.papelId === 'admin';
  const podeCriar = isAdmin || hasPermission('financeiro.criar') || hasPermission('financeiro.*');
  const podeEditar = isAdmin || hasPermission('financeiro.editar') || hasPermission('financeiro.*');
  const podeExcluir = isAdmin || hasPermission('financeiro.excluir') || hasPermission('financeiro.*');

  // Estados principais
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [totaisPorCategoria, setTotaisPorCategoria] = useState<FinancialCategoryTotal[]>([]);
  const [fluxoCaixaMensal, setFluxoCaixaMensal] = useState<FinancialCashFlowMonth[]>([]);
  const [alertas, setAlertas] = useState<{
    vencendoHoje: FinancialTransaction[];
    atrasadas: FinancialTransaction[];
  }>({ vencendoHoje: [], atrasadas: [] });

  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncomeInCents: 0,
    totalExpenseInCents: 0,
    balanceInCents: 0,
    pendingReceivableInCents: 0,
    pendingPayableInCents: 0,
    forecastBalanceInCents: 0,
    pendingCount: 0,
    vencendoHojeCount: 0,
    atrasadasCount: 0,
  });

  // Filtros ativos
  const [tabTipo, setTabTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'pago' | 'pendente' | 'cancelado' | 'vence_hoje' | 'atrasadas'
  >('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes_atual' | 'ultimos_30' | 'ano_atual' | 'todos' | 'custom'>('mes_atual');
  const [customInicio, setCustomInicio] = useState('');
  const [customFim, setCustomFim] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalComprovanteAberto, setModalComprovanteAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<FinancialTransaction | null>(null);

  // Estados do Formulário de Criação
  const [formType, setFormType] = useState<'receita' | 'despesa'>('receita');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValorStr, setFormValorStr] = useState('180,00');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formCategoryName, setFormCategoryName] = useState('');
  const [formPaymentMethodId, setFormPaymentMethodId] = useState('');
  const [formPaymentMethodName, setFormPaymentMethodName] = useState('');
  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formParcelas, setFormParcelas] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [formStatusInicial, setFormStatusInicial] = useState<'pendente' | 'pago'>('pago');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [formReceiptName, setFormReceiptName] = useState('');
  const [submittingNovo, setSubmittingNovo] = useState(false);

  // Estados da Baixa
  const [baixaData, setBaixaData] = useState(new Date().toISOString().split('T')[0]);
  const [baixaPaymentMethodId, setBaixaPaymentMethodId] = useState('');
  const [baixaPaymentMethodName, setBaixaPaymentMethodName] = useState('');
  const [baixaReceiptUrl, setBaixaReceiptUrl] = useState('');
  const [baixaReceiptName, setBaixaReceiptName] = useState('');
  const [baixaNotes, setBaixaNotes] = useState('');
  const [submittingBaixa, setSubmittingBaixa] = useState(false);

  // Estados do Cancelamento
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [submittingCancelar, setSubmittingCancelar] = useState(false);

  // Formas de pagamento e categorias dos cadastros auxiliares do Consultório (Prompt 06)
  const formasPagamentoAuxiliares = useMemo(() => {
    return (consultorio?.formasPagamento || []).filter((f) => f.ativo !== false);
  }, [consultorio]);

  const categoriasDespesaAuxiliares = useMemo(() => {
    return (consultorio?.categoriasDespesa || []).filter((c) => c.ativo !== false);
  }, [consultorio]);

  const categoriasReceitaAuxiliares = useMemo(() => {
    const servicos = (consultorio?.servicos || []).filter((s) => s.ativo !== false);
    return servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
    }));
  }, [consultorio]);

  // Carregamento de dados com base nos filtros
  useEffect(() => {
    loadFinances();
  }, [tabTipo, filtroStatus, filtroPeriodo, customInicio, customFim, filtroCategoria, searchTerm]);

  // Carrega pacientes para o autocomplete/select
  useEffect(() => {
    patientsService.getAll().then(setPatients).catch(console.error);
  }, []);

  async function loadFinances() {
    setLoading(true);
    setMensagemErro('');
    try {
      // Calcula datas de início e fim com base no seletor de período
      let dtInicio: string | undefined;
      let dtFim: string | undefined;
      const agora = new Date();

      if (filtroPeriodo === 'mes_atual') {
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        dtInicio = `${ano}-${mes}-01`;
        const ultimoDia = new Date(ano, agora.getMonth() + 1, 0).getDate();
        dtFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
      } else if (filtroPeriodo === 'ultimos_30') {
        const d30 = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        dtInicio = d30.toISOString().split('T')[0];
        dtFim = agora.toISOString().split('T')[0];
      } else if (filtroPeriodo === 'ano_atual') {
        const ano = agora.getFullYear();
        dtInicio = `${ano}-01-01`;
        dtFim = `${ano}-12-31`;
      } else if (filtroPeriodo === 'custom') {
        dtInicio = customInicio || undefined;
        dtFim = customFim || undefined;
      }

      const res = await financialService.getList({
        tipo: tabTipo,
        status: filtroStatus,
        periodoInicio: dtInicio,
        periodoFim: dtFim,
        categoria: filtroCategoria || undefined,
        busca: searchTerm || undefined,
      });

      setTransactions(res.transacoes || []);
      setSummary(res.resumo);
      setAlertas(res.alertas || { vencendoHoje: [], atrasadas: [] });
      setTotaisPorCategoria(res.totaisPorCategoria || []);
      setFluxoCaixaMensal(res.fluxoCaixaMensal || []);
    } catch (e: any) {
      console.error(e);
      setMensagemErro('Falha ao sincronizar dados com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Prepara formulário para nova movimentação
  const abrirModalNovo = (tipo: 'receita' | 'despesa') => {
    setFormType(tipo);
    setFormDescricao(tipo === 'receita' ? 'Consulta de Refração' : '');
    setFormValorStr('180,00');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormStatusInicial('pago');
    setFormIsRecurring(false);
    setFormParcelas(1);
    setFormNotes('');
    setFormReceiptUrl('');
    setFormReceiptName('');
    setFormPatientId('');
    setFormPatientName('');
    setFormSupplierName('');

    // Preenche forma de pagamento padrão do consultório
    const padraoFp = formasPagamentoAuxiliares.find((f) => f.padrao) || formasPagamentoAuxiliares[0];
    if (padraoFp) {
      setFormPaymentMethodId(padraoFp.id);
      setFormPaymentMethodName(padraoFp.nome);
    }

    // Preenche categoria inicial
    if (tipo === 'receita') {
      const cat = categoriasReceitaAuxiliares[0];
      if (cat) {
        setFormCategoryId(cat.id);
        setFormCategoryName(cat.nome);
      }
    } else {
      const cat = categoriasDespesaAuxiliares[0];
      if (cat) {
        setFormCategoryId(cat.id);
        setFormCategoryName(cat.nome);
      }
    }

    setModalNovoAberto(true);
  };

  // Upload de Comprovante em Base64
  const handleUploadComprovante = (file: File, isBaixa = false) => {
    if (file.size > 2 * 1024 * 1024) {
      setMensagemErro('O comprovante deve ter tamanho máximo de 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (isBaixa) {
        setBaixaReceiptUrl(dataUrl);
        setBaixaReceiptName(file.name);
      } else {
        setFormReceiptUrl(dataUrl);
        setFormReceiptName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submissão de Criação
  const handleSalvarNovaMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const centavos = parseToCents(formValorStr);
    if (!formDescricao.trim()) {
      setMensagemErro('Informe a descrição da movimentação.');
      return;
    }
    if (centavos <= 0) {
      setMensagemErro('O valor deve ser maior que zero.');
      return;
    }

    setSubmittingNovo(true);
    setMensagemErro('');
    try {
      await financialService.create({
        type: formType,
        description: formDescricao.trim(),
        amountInCents: centavos,
        status: formStatusInicial,
        dueDate: formDueDate,
        date: formDueDate,
        paymentDate: formStatusInicial === 'pago' ? formDueDate : undefined,
        categoryId: formCategoryId,
        categoryName: formCategoryName,
        paymentMethodId: formPaymentMethodId,
        paymentMethodName: formPaymentMethodName,
        patientId: formType === 'receita' ? formPatientId : undefined,
        patientName: formType === 'receita' ? formPatientName : undefined,
        supplierName: formType === 'despesa' ? formSupplierName : undefined,
        isRecurring: formIsRecurring,
        parcelas: formParcelas,
        receiptUrl: formReceiptUrl || undefined,
        receiptName: formReceiptName || undefined,
        notes: formNotes.trim() || undefined,
      });

      setMensagemSucesso('Movimentação financeira registrada com sucesso!');
      setModalNovoAberto(false);
      loadFinances();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSubmittingNovo(false);
    }
  };

  // Abertura do Modal de Baixa
  const abrirModalBaixa = (tx: FinancialTransaction) => {
    setTransacaoSelecionada(tx);
    setBaixaData(new Date().toISOString().split('T')[0]);
    setBaixaPaymentMethodId(tx.paymentMethodId || formasPagamentoAuxiliares[0]?.id || '');
    setBaixaPaymentMethodName(tx.paymentMethodName || formasPagamentoAuxiliares[0]?.nome || 'Pix');
    setBaixaReceiptUrl('');
    setBaixaReceiptName('');
    setBaixaNotes('');
    setModalBaixaAberto(true);
  };

  // Submissão da Baixa
  const handleConfirmarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transacaoSelecionada) return;

    setSubmittingBaixa(true);
    setMensagemErro('');
    try {
      await financialService.baixar(transacaoSelecionada.id, {
        paymentDate: baixaData,
        paymentMethodId: baixaPaymentMethodId,
        paymentMethodName: baixaPaymentMethodName,
        receiptUrl: baixaReceiptUrl || undefined,
        receiptName: baixaReceiptName || undefined,
        notes: baixaNotes.trim() || undefined,
      });

      setMensagemSucesso(`Baixa da conta "${transacaoSelecionada.description}" efetuada com sucesso!`);
      setModalBaixaAberto(false);
      loadFinances();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao realizar baixa.');
    } finally {
      setSubmittingBaixa(false);
    }
  };

  // Abertura do Modal de Cancelamento
  const abrirModalCancelar = (tx: FinancialTransaction) => {
    setTransacaoSelecionada(tx);
    setMotivoCancelamento('');
    setModalCancelarAberto(true);
  };

  // Submissão do Cancelamento
  const handleConfirmarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transacaoSelecionada || !motivoCancelamento.trim()) {
      setMensagemErro('Informe a justificativa/motivo do cancelamento.');
      return;
    }

    setSubmittingCancelar(true);
    setMensagemErro('');
    try {
      await financialService.cancelar(transacaoSelecionada.id, motivoCancelamento.trim());
      setMensagemSucesso(`Movimentação "${transacaoSelecionada.description}" cancelada com sucesso.`);
      setModalCancelarAberto(false);
      loadFinances();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao cancelar movimentação.');
    } finally {
      setSubmittingCancelar(false);
    }
  };

  // Exclusão
  const handleExcluir = async (tx: FinancialTransaction) => {
    if (!podeExcluir) return;
    if (!window.confirm(`Tem certeza que deseja excluir "${tx.description}"? Essa ação é irreversível e será auditada.`)) {
      return;
    }

    try {
      await financialService.delete(tx.id);
      setMensagemSucesso('Movimentação excluída com sucesso.');
      loadFinances();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao excluir movimentação.');
    }
  };

  // Download do CSV
  const handleExportarCsv = () => {
    const url = financialService.getCsvExportUrl({
      tipo: tabTipo,
      status: filtroStatus,
      periodoInicio: filtroPeriodo === 'custom' ? customInicio : undefined,
      periodoFim: filtroPeriodo === 'custom' ? customFim : undefined,
      categoria: filtroCategoria || undefined,
      busca: searchTerm || undefined,
    });
    window.location.href = url;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-teal-600" />
            <span>Módulo Financeiro & Fluxo de Caixa</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Gestão de contas a pagar, contas a receber, baixas com comprovante, fluxo de caixa e conciliação de honorários clínicos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportarCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exportar dados filtrados em planilha CSV (RFC-4180)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          {podeCriar && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => abrirModalNovo('receita')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Receita</span>
              </button>

              <button
                onClick={() => abrirModalNovo('despesa')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Notificação */}
      {mensagemSucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{mensagemErro}</span>
          </div>
          <button onClick={() => setMensagemErro('')} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de Conformidade Ética e Deontológica */}
      <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-950 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-teal-900">Segregação Deontológica Estrita:</strong> O módulo financeiro destina-se com exclusividade ao controle de honorários por exames e procedimentos optométricos, bem como despesas operacionais do consultório. É terminantemente vedada a comercialização de armações, óculos ou lentes neste estabelecimento clínico.
        </div>
      </div>

      {/* Banner de Alertas de Vencimento (Hoje e Atrasadas - Regra Prompt 10) */}
      {(summary.vencendoHojeCount > 0 || summary.atrasadasCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.vencendoHojeCount > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Vencendo Hoje ({summary.vencendoHojeCount})
                  </h2>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {summary.vencendoHojeCount === 1 ? '1 conta tem' : `${summary.vencendoHojeCount} contas têm`} vencimento programado para hoje.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFiltroStatus('vence_hoje');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Ver Contas
              </button>
            </div>
          )}

          {summary.atrasadasCount > 0 && (
            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                    Contas Atrasadas ({summary.atrasadasCount})
                  </h2>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {summary.atrasadasCount === 1 ? '1 conta pendente' : `${summary.atrasadasCount} contas pendentes`} ultrapassaram a data de vencimento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFiltroStatus('atrasadas');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Ver Atrasadas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Realizado em Caixa */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Saldo em Caixa
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.balanceInCents >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-bold mt-2 ${summary.balanceInCents >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {formatCurrencyFromCents(summary.balanceInCents)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
            <span>Receitas: {formatCurrencyFromCents(summary.totalIncomeInCents)}</span>
            <span aria-hidden="true">·</span>
            <span>Despesas: {formatCurrencyFromCents(summary.totalExpenseInCents)}</span>
          </div>
        </div>

        {/* Contas a Receber (Pendente) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Contas a Receber
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2">
            {formatCurrencyFromCents(summary.pendingReceivableInCents)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Honorários clínicos pendentes de liquidação
          </p>
        </div>

        {/* Contas a Pagar (Pendente) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Contas a Pagar
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-700 mt-2">
            {formatCurrencyFromCents(summary.pendingPayableInCents)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Compromissos operacionais a vencer
          </p>
        </div>

        {/* Saldo Previsto do Período */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Saldo Previsto
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-bold mt-2 ${summary.forecastBalanceInCents >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
            {formatCurrencyFromCents(summary.forecastBalanceInCents)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Caixa atual + A Receber - A Pagar
          </p>
        </div>
      </div>

      {/* Gráfico de Fluxo de Caixa Mensal & Totais por Categoria (Prompt 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Fluxo de Caixa Mensal */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Demonstrativo do Fluxo de Caixa Mensal</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Comparativo mensal de receitas realizadas, despesas pagas e saldo líquido
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span className="text-slate-600">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span className="text-slate-600">Despesas</span>
              </div>
            </div>
          </div>

          {fluxoCaixaMensal.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-600">
              Nenhuma movimentação realizada no histórico recente.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {/* Barras de fluxo por mês */}
              {fluxoCaixaMensal.map((m) => {
                const maxVal = Math.max(
                  ...fluxoCaixaMensal.map((item) => Math.max(item.receitasCentavos, item.despesasCentavos)),
                  1
                );
                const percRec = (m.receitasCentavos / maxVal) * 100;
                const percDesp = (m.despesasCentavos / maxVal) * 100;

                return (
                  <div key={m.mesAno} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{m.mesNome}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700 font-medium">
                          + {formatCurrencyFromCents(m.receitasCentavos)}
                        </span>
                        <span className="text-rose-700 font-medium">
                          - {formatCurrencyFromCents(m.despesasCentavos)}
                        </span>
                        <span className={`font-bold ${m.saldoCentavos >= 0 ? 'text-teal-800' : 'text-rose-800'}`}>
                          Saldo: {formatCurrencyFromCents(m.saldoCentavos)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* Barra Receitas */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percRec, 1)}%` }}
                        />
                      </div>
                      {/* Barra Despesas */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percDesp, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totais por Categoria */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Totais por Categoria</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Distribuição dos custos e receitas conforme cadastros auxiliares
              </p>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {totaisPorCategoria.length === 0 ? (
                <p className="text-xs text-slate-600 py-6 text-center">Nenhum dado por categoria no filtro.</p>
              ) : (
                totaisPorCategoria.slice(0, 6).map((cat) => (
                  <div key={`${cat.type}_${cat.categoryName}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[160px]" title={cat.categoryName}>
                        {cat.categoryName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-slate-900">
                          {formatCurrencyFromCents(cat.totalCentavos)}
                        </span>
                        <span className="text-slate-600 text-[10px]">({cat.percentual}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cat.type === 'receita' ? 'bg-teal-500' : 'bg-rose-500'}`}
                        style={{ width: `${cat.percentual}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-600">
            Categorias vinculadas automaticamente aos cadastros auxiliares da empresa (Prompt 06).
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca (Zero-Pill Discipline) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        {/* Linha 1: Segmented Control Tipo (Todos, Contas a Receber, Contas a Pagar) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setTabTipo('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${tabTipo === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todas as Contas
            </button>
            <button
              onClick={() => setTabTipo('receita')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${tabTipo === 'receita' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Contas a Receber
            </button>
            <button
              onClick={() => setTabTipo('despesa')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${tabTipo === 'despesa' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Contas a Pagar
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, paciente, fornecedor ou categoria..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-600 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Filtros de Status e Período */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Seletor Status */}
          <select
            value={filtroStatus}
            onChange={(e: any) => setFiltroStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="todos">Status: Todos</option>
            <option value="pendente">Status: Pendentes</option>
            <option value="pago">Status: Pagas / Baixadas</option>
            <option value="vence_hoje">Status: Vence Hoje</option>
            <option value="atrasadas">Status: Atrasadas</option>
            <option value="cancelado">Status: Canceladas</option>
          </select>

          {/* Seletor Período */}
          <select
            value={filtroPeriodo}
            onChange={(e: any) => setFiltroPeriodo(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="mes_atual">Período: Mês Atual</option>
            <option value="ultimos_30">Período: Últimos 30 Dias</option>
            <option value="ano_atual">Período: Ano Atual</option>
            <option value="todos">Período: Todo o Histórico</option>
            <option value="custom">Período Customizado</option>
          </select>

          {filtroPeriodo === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customInicio}
                onChange={(e) => setCustomInicio(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
              />
              <span className="text-slate-600">até</span>
              <input
                type="date"
                value={customFim}
                onChange={(e) => setCustomFim(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
              />
            </div>
          )}

          {/* Seletor Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[200px]"
          >
            <option value="">Categoria: Todas</option>
            <optgroup label="Despesas Operacionais">
              {categoriasDespesaAuxiliares.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </optgroup>
            <optgroup label="Receitas de Serviços">
              {categoriasReceitaAuxiliares.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </optgroup>
          </select>

          {/* Botão limpar filtros */}
          {(filtroStatus !== 'todos' || filtroPeriodo !== 'mes_atual' || filtroCategoria || searchTerm) && (
            <button
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroPeriodo('mes_atual');
                setFiltroCategoria('');
                setSearchTerm('');
              }}
              className="text-teal-700 hover:text-teal-900 underline text-xs ml-auto cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Listagem de Movimentações ({transactions.length})
          </span>
          <button
            onClick={loadFinances}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Carregando dados financeiros...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-600 space-y-2">
            <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Nenhuma movimentação encontrada com os filtros selecionados.</p>
            <p className="text-slate-600">Altere os filtros acima ou cadastre uma nova receita/despesa.</p>
          </div>
        ) : (
          <>
            {/* Versão Desktop (>= 1024px inalterada): Tabela completa */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição & Categoria</th>
                    <th className="py-3 px-4">Paciente / Fornecedor</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Forma & Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const isAtrasada = tx.status === 'pendente' && tx.dueDate < hoje;
                    const isHoje = tx.status === 'pendente' && tx.dueDate === hoje;

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/80 transition-colors ${tx.status === 'cancelado' ? 'opacity-50 line-through' : ''}`}
                      >
                        {/* Tipo */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {tx.type === 'receita' ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <ArrowUpRight className="w-4 h-4" />
                              <span>Receita</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                              <ArrowDownRight className="w-4 h-4" />
                              <span>Despesa</span>
                            </div>
                          )}
                        </td>

                        {/* Descrição & Categoria */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{tx.description}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                            <span>{tx.categoryName}</span>
                            {tx.installmentTotal && tx.installmentTotal > 1 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-indigo-700">
                                  Parcela {tx.installmentNumber}/{tx.installmentTotal}
                                </span>
                              </>
                            )}
                            {tx.isRecurring && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-0.5 text-teal-700">
                                  <Repeat className="w-3 h-3" />
                                  <span>Mensal</span>
                                </span>
                              </>
                            )}
                            {tx.receiptUrl && (
                              <>
                                <span aria-hidden="true">·</span>
                                <button
                                  onClick={() => {
                                    setTransacaoSelecionada(tx);
                                    setModalComprovanteAberto(true);
                                  }}
                                  className="inline-flex items-center gap-0.5 text-indigo-700 hover:underline cursor-pointer"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span>Comprovante</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Paciente / Fornecedor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {tx.patientName ? (
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <User className="w-3.5 h-3.5 text-slate-600" />
                              <span>{tx.patientName}</span>
                            </div>
                          ) : tx.supplierName ? (
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <Building className="w-3.5 h-3.5 text-slate-600" />
                              <span>{tx.supplierName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Vencimento & Alerta */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">
                            {formatDateBR(tx.dueDate)}
                          </div>
                          {isAtrasada && (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Atrasada
                            </span>
                          )}
                          {isHoje && (
                            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              Vence hoje
                            </span>
                          )}
                          {tx.status === 'pago' && tx.paymentDate && (
                            <span className="text-[10px] text-slate-600">
                              Baixa: {formatDateBR(tx.paymentDate)}
                            </span>
                          )}
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`font-bold ${tx.type === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {tx.type === 'receita' ? '+' : '-'} {formatCurrencyFromCents(tx.amountInCents)}
                          </span>
                        </td>

                        {/* Forma & Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800">{tx.paymentMethodName}</div>
                          <div className="text-[11px] mt-0.5">
                            {tx.status === 'pago' ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Pago
                              </span>
                            ) : tx.status === 'pendente' ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Pendente
                              </span>
                            ) : (
                              <span className="text-slate-600 font-semibold flex items-center gap-1">
                                <Ban className="w-3.5 h-3.5" /> Cancelado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.status === 'pendente' && podeEditar && (
                              <button
                                onClick={() => abrirModalBaixa(tx)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer"
                                title="Dar baixa com data de pagamento"
                              >
                                Dar Baixa
                              </button>
                            )}

                            {tx.status !== 'cancelado' && podeEditar && (
                              <button
                                onClick={() => abrirModalCancelar(tx)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-700 transition-colors"
                                title="Cancelar lançamento com motivo"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {podeExcluir && tx.status !== 'pago' && (
                              <button
                                onClick={() => handleExcluir(tx)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                                title="Excluir movimentação"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile (< 1024px): Cards de Movimentação com toque >= 44px */}
            <div className="lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {transactions.map((tx) => {
                const hoje = new Date().toISOString().split('T')[0];
                const isAtrasada = tx.status === 'pendente' && tx.dueDate < hoje;
                const isHoje = tx.status === 'pendente' && tx.dueDate === hoje;

                return (
                  <div
                    key={`mobile-tx-${tx.id}`}
                    className={`p-4 rounded-2xl border transition-all ${
                      tx.status === 'cancelado'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : tx.type === 'receita'
                        ? 'bg-white border-emerald-100 shadow-xs'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {tx.type === 'receita' ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">
                            {tx.description}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {tx.categoryName}
                            {tx.installmentTotal && tx.installmentTotal > 1 ? ` · Parc. ${tx.installmentNumber}/${tx.installmentTotal}` : ''}
                            {tx.isRecurring ? ' · Mensal' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-bold text-sm block ${tx.type === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {tx.type === 'receita' ? '+' : '-'} {formatCurrencyFromCents(tx.amountInCents)}
                        </span>
                        <div className="mt-0.5">
                          {tx.status === 'pago' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Pago
                            </span>
                          ) : tx.status === 'pendente' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              Pendente
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Cancelado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimento</span>
                        <span className="font-medium text-slate-800 block mt-0.5">
                          {formatDateBR(tx.dueDate)}
                        </span>
                        {isAtrasada && (
                          <span className="text-[10px] text-rose-600 font-bold block">Atrasada</span>
                        )}
                        {isHoje && (
                          <span className="text-[10px] text-amber-700 font-bold block">Vence hoje</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {tx.patientName ? 'Paciente' : tx.supplierName ? 'Fornecedor' : 'Forma'}
                        </span>
                        <span className="font-medium text-slate-800 block mt-0.5 truncate">
                          {tx.patientName || tx.supplierName || tx.paymentMethodName}
                        </span>
                      </div>
                    </div>

                    {/* Ações Mobile com alvo >= 44px */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      {tx.status === 'pendente' && podeEditar && (
                        <button
                          onClick={() => abrirModalBaixa(tx)}
                          className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>Dar Baixa</span>
                        </button>
                      )}

                      {tx.receiptUrl && (
                        <button
                          onClick={() => {
                            setTransacaoSelecionada(tx);
                            setModalComprovanteAberto(true);
                          }}
                          className="min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>Recibo</span>
                        </button>
                      )}

                      {tx.status !== 'cancelado' && podeEditar && (
                        <button
                          onClick={() => abrirModalCancelar(tx)}
                          className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                          title="Cancelar"
                          aria-label="Cancelar lançamento"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {podeExcluir && tx.status !== 'pago' && (
                        <button
                          onClick={() => handleExcluir(tx)}
                          className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                          title="Excluir"
                          aria-label="Excluir lançamento"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: Nova Movimentação Financeira */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                <span>Cadastrar {formType === 'receita' ? 'Conta a Receber (Receita)' : 'Conta a Pagar (Despesa)'}</span>
              </h2>
              <button onClick={() => setModalNovoAberto(false)} className="text-slate-600 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaMovimentacao} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Tipo seletor */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('receita');
                    const cat = categoriasReceitaAuxiliares[0];
                    if (cat) {
                      setFormCategoryId(cat.id);
                      setFormCategoryName(cat.nome);
                    }
                  }}
                  className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${formType === 'receita' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('despesa');
                    const cat = categoriasDespesaAuxiliares[0];
                    if (cat) {
                      setFormCategoryId(cat.id);
                      setFormCategoryName(cat.nome);
                    }
                  }}
                  className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${formType === 'despesa' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Despesa
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Exame de Refração Completo ou Aluguel do Mês"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Valor e Data de Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    value={formValorStr}
                    onChange={(e) => setFormValorStr(e.target.value)}
                    placeholder="180,00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Categoria Auxiliar do Consultório */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoria (Cadastros Auxiliares) *</label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormCategoryId(id);
                    if (formType === 'receita') {
                      const cat = categoriasReceitaAuxiliares.find((c) => c.id === id);
                      setFormCategoryName(cat?.nome || '');
                    } else {
                      const cat = categoriasDespesaAuxiliares.find((c) => c.id === id);
                      setFormCategoryName(cat?.nome || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {formType === 'receita' ? (
                    categoriasReceitaAuxiliares.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))
                  ) : (
                    categoriasDespesaAuxiliares.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Paciente (se receita) ou Fornecedor (se despesa) */}
              {formType === 'receita' ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vincular Paciente (Opcional)</label>
                  <select
                    value={formPatientId}
                    onChange={(e) => {
                      const ptId = e.target.value;
                      setFormPatientId(ptId);
                      const pt = patients.find((p) => p.id === ptId);
                      setFormPatientName(pt ? pt.name : '');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Nenhum paciente selecionado</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.cpf ? `(${p.cpf})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fornecedor / Prestador</label>
                  <input
                    type="text"
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    placeholder="Ex: Enel, Distribuidora Oftálmica, Vivo, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Forma de Pagamento Auxiliar */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento *</label>
                <select
                  required
                  value={formPaymentMethodId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormPaymentMethodId(id);
                    const fp = formasPagamentoAuxiliares.find((f) => f.id === id);
                    setFormPaymentMethodName(fp?.nome || '');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {formasPagamentoAuxiliares.map((fp) => (
                    <option key={fp.id} value={fp.id}>{fp.nome}</option>
                  ))}
                </select>
              </div>

              {/* Status inicial e Parcelamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Inicial</label>
                  <select
                    value={formStatusInicial}
                    onChange={(e: any) => setFormStatusInicial(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="pago">Já Liquidado / Pago</option>
                    <option value="pendente">Pendente (A receber / Pagar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parcelamento Simples</label>
                  <select
                    value={formParcelas}
                    onChange={(e) => setFormParcelas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value={1}>1x (À vista)</option>
                    <option value={2}>2x Mensais</option>
                    <option value={3}>3x Mensais</option>
                    <option value={4}>4x Mensais</option>
                    <option value={6}>6x Mensais</option>
                    <option value={10}>10x Mensais</option>
                    <option value={12}>12x Mensais</option>
                  </select>
                </div>
              </div>

              {/* Recorrência Mensal (Para Despesas fixas como aluguel, internet) */}
              {formType === 'despesa' && (
                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-sm"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Despesa com Recorrência Mensal</span>
                    <p className="text-[11px] text-slate-600">Sinaliza custo fixo mensal (ex: aluguel, software, energia)</p>
                  </div>
                </label>
              )}

              {/* Anexo de Comprovante */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Anexo de Comprovante (Imagem / PDF)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadComprovante(file, false);
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {formReceiptUrl && (
                    <span className="text-[11px] text-emerald-700 font-medium truncate max-w-[120px]">
                      {formReceiptName || 'Anexado'}
                    </span>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Anotações para conciliação bancária..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingNovo}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {submittingNovo ? 'Salvando...' : 'Salvar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Dar Baixa em Conta */}
      {modalBaixaAberto && transacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmar Baixa de {transacaoSelecionada.type === 'receita' ? 'Receita' : 'Despesa'}</span>
              </h2>
              <button onClick={() => setModalBaixaAberto(false)} className="text-slate-600 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarBaixa} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{transacaoSelecionada.description}</div>
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Valor: <strong className="text-slate-900">{formatCurrencyFromCents(transacaoSelecionada.amountInCents)}</strong></span>
                  <span>Vencimento: {formatDateBR(transacaoSelecionada.dueDate)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Data da Baixa / Pagamento *</label>
                <input
                  type="date"
                  required
                  value={baixaData}
                  onChange={(e) => setBaixaData(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento Utilizada *</label>
                <select
                  required
                  value={baixaPaymentMethodId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBaixaPaymentMethodId(id);
                    const fp = formasPagamentoAuxiliares.find((f) => f.id === id);
                    setBaixaPaymentMethodName(fp?.nome || '');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {formasPagamentoAuxiliares.map((fp) => (
                    <option key={fp.id} value={fp.id}>{fp.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Anexo de Comprovante de Pagamento</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadComprovante(file, true);
                  }}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {baixaReceiptName && (
                  <p className="text-[11px] text-emerald-700 mt-1">Anexado: {baixaReceiptName}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observações da Liquidação</label>
                <input
                  type="text"
                  value={baixaNotes}
                  onChange={(e) => setBaixaNotes(e.target.value)}
                  placeholder="Ex: Pago com desconto pontualidade ou TED..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalBaixaAberto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submittingBaixa}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {submittingBaixa ? 'Baixando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cancelar com Justificativa */}
      {modalCancelarAberto && transacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Cancelar Movimentação Financeira</span>
              </h2>
              <button onClick={() => setModalCancelarAberto(false)} className="text-slate-600 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarCancelamento} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-rose-950">{transacaoSelecionada.description}</div>
                <div className="text-rose-800">
                  Valor: {formatCurrencyFromCents(transacaoSelecionada.amountInCents)}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Justificativa / Motivo do Cancelamento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Informe detalhadamente por que este lançamento está sendo cancelado (registrado em auditoria)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCancelarAberto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submittingCancelar}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {submittingCancelar ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Visualizar Comprovante Anexado */}
      {modalComprovanteAberto && transacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <span>Comprovante Anexo: {transacaoSelecionada.description}</span>
              </h2>
              <button onClick={() => setModalComprovanteAberto(false)} className="text-slate-600 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-center">
              {transacaoSelecionada.receiptUrl?.startsWith('data:image/') || transacaoSelecionada.receiptUrl?.startsWith('data:image/svg') ? (
                <div className="max-h-96 overflow-auto border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
                  <img
                    src={transacaoSelecionada.receiptUrl}
                    alt="Comprovante"
                    className="max-h-80 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    {transacaoSelecionada.receiptName || 'Documento Comprovatório'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                {transacaoSelecionada.receiptUrl && (
                  <a
                    href={transacaoSelecionada.receiptUrl}
                    download={transacaoSelecionada.receiptName || 'comprovante.png'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo</span>
                  </a>
                )}
                <button
                  onClick={() => setModalComprovanteAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
