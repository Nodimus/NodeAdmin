import React, { useState, useEffect } from 'react';
import {
  Printer,
  Calendar,
  Filter,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  History,
  TrendingUp,
  Cake,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { reportsService, RelatorioItem, RelatorioDados } from '../../services/reports.service';
import { RelatorioImpressao } from '../../components/admin/RelatorioImpressao';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { patientsService } from '../../services/patients.service';
import { Patient } from '../../types';

export const ReportsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { consultorio } = useConsultorio();

  const [catalogo, setCatalogo] = useState<RelatorioItem[]>([]);
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState<string>('agenda');
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatorioDados | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  // Filtros de controle
  const hoje = new Date().toISOString().split('T')[0];
  const [filtroDataInicio, setFiltroDataInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [filtroDataFim, setFiltroDataFim] = useState(hoje);
  const [filtroProfissional, setFiltroProfissional] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroMes, setFiltroMes] = useState(String(new Date().getMonth() + 1));
  const [filtroMesAno, setFiltroMesAno] = useState(hoje.slice(0, 7));
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroPacienteId, setFiltroPacienteId] = useState('todos');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');

  // Carrega catálogo de relatórios disponíveis
  useEffect(() => {
    carregarCatalogo();
    patientsService.getAll().then(setPatients).catch(console.error);
  }, []);

  // Quando o catálogo é carregado, define o primeiro relatório disponível
  async function carregarCatalogo() {
    try {
      const lista = await reportsService.getCatalogo();
      setCatalogo(lista);
      if (lista.length > 0) {
        setRelatorioSelecionadoId(lista[0].id);
      }
    } catch (e: any) {
      console.error(e);
      setErro('Falha ao carregar relatórios autorizados para o seu perfil.');
    }
  }

  // Gera dados do relatório quando selecionado ou filtros mudam
  useEffect(() => {
    if (relatorioSelecionadoId) {
      gerarRelatorio();
    }
  }, [
    relatorioSelecionadoId,
    filtroDataInicio,
    filtroDataFim,
    filtroProfissional,
    filtroStatus,
    filtroCidade,
    filtroMes,
    filtroMesAno,
    filtroCategoria,
    filtroPacienteId,
    filtroUsuario,
  ]);

  async function gerarRelatorio() {
    setLoading(true);
    setErro('');
    try {
      const dados = await reportsService.getDados(relatorioSelecionadoId, {
        periodoInicio: filtroDataInicio,
        periodoFim: filtroDataFim,
        dataInicio: filtroDataInicio,
        dataFim: filtroDataFim,
        data: filtroDataInicio === filtroDataFim ? filtroDataInicio : undefined,
        profissional: filtroProfissional,
        status: filtroStatus,
        cidade: filtroCidade,
        mes: filtroMes,
        mesAno: filtroMesAno,
        categoria: filtroCategoria,
        pacienteId: filtroPacienteId,
        usuario: filtroUsuario,
      });
      setDadosRelatorio(dados);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao emitir relatório.');
      setDadosRelatorio(null);
    } finally {
      setLoading(false);
    }
  }

  const handleImprimir = () => {
    window.print();
  };

  const relatorioAtual = catalogo.find((r) => r.id === relatorioSelecionadoId);

  // Ícones por tipo de relatório
  const getIconeRelatorio = (id: string) => {
    switch (id) {
      case 'agenda':
        return Calendar;
      case 'atendimentos':
        return Eye;
      case 'receitas':
        return FileText;
      case 'pacientes':
        return Users;
      case 'aniversariantes':
        return Cake;
      case 'contas_receber':
      case 'contas_pagar':
        return DollarSign;
      case 'fluxo_caixa':
        return TrendingUp;
      case 'usuarios':
        return ShieldCheck;
      case 'auditoria':
        return History;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. PAINEL DE CONTROLE (OCULTO NA IMPRESSÃO @media print) */}
      <div className="no-print space-y-4">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Printer className="w-6 h-6 text-teal-600" />
              <span>Relatórios Impressos & Exportação Oficial</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Documentos oficiais formatados para folha A4 com cabeçalho institucional, paginação e conformidade LGPD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={gerarRelatorio}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Atualizar dados do relatório"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleImprimir}
              disabled={!dadosRelatorio || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Abrir diálogo de impressão do navegador ou salvar em PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

        {/* Alerta de Erro se houver */}
        {erro && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* SELETOR DE RELATÓRIO E FILTROS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Selecione o Modelo de Relatório ({catalogo.length} disponíveis para seu perfil)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {catalogo.map((item) => {
                const Icon = getIconeRelatorio(item.id);
                const isSelected = item.id === relatorioSelecionadoId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setRelatorioSelecionadoId(item.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-950 ring-1 ring-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold truncate leading-tight">
                        {item.titulo}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {item.descricao}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA DE FILTROS DINÂMICOS CONFORME O RELATÓRIO SELECIONADO */}
          {relatorioAtual && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros do Relatório:</span>
              </div>

              {/* Filtros de Período (para a maioria) */}
              {(relatorioAtual.filtrosSuportados.includes('periodoInicio') ||
                relatorioAtual.filtrosSuportados.includes('data')) && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[11px]">De:</span>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[11px]">Até:</span>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Filtro de Mês (Aniversariantes) */}
              {relatorioAtual.filtrosSuportados.includes('mes') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Mês:</span>
                  <select
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                </div>
              )}

              {/* Filtro de Mês/Ano (Fluxo de Caixa) */}
              {relatorioAtual.filtrosSuportados.includes('mesAno') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Mês/Ano:</span>
                  <input
                    type="month"
                    value={filtroMesAno}
                    onChange={(e) => setFiltroMesAno(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Filtro de Status (Agenda, Contas, Pacientes, Usuários) */}
              {relatorioAtual.filtrosSuportados.includes('status') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Status:</span>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="todos">Todos</option>
                    {relatorioAtual.id === 'pacientes' || relatorioAtual.id === 'usuarios' ? (
                      <>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                      </>
                    ) : relatorioAtual.id.startsWith('contas') ? (
                      <>
                        <option value="pago">Liquidados / Pagos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="cancelado">Cancelados</option>
                      </>
                    ) : (
                      <>
                        <option value="confirmado">Confirmados</option>
                        <option value="pendente">Pendentes</option>
                        <option value="atendido">Atendidos</option>
                        <option value="cancelado">Cancelados</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Filtro de Paciente (Receitas) */}
              {relatorioAtual.filtrosSuportados.includes('pacienteId') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Paciente:</span>
                  <select
                    value={filtroPacienteId}
                    onChange={(e) => setFiltroPacienteId(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 max-w-[180px]"
                  >
                    <option value="todos">Todos os Pacientes</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro de Cidade (Pacientes) */}
              {relatorioAtual.filtrosSuportados.includes('cidade') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Cidade:</span>
                  <input
                    type="text"
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 max-w-[140px]"
                  />
                </div>
              )}

              {/* Filtro de Categoria (Contas a Pagar) */}
              {relatorioAtual.filtrosSuportados.includes('categoria') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Categoria:</span>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 max-w-[200px]"
                  >
                    <option value="todos">Todas as Categorias</option>
                    {(consultorio?.categoriasDespesa || []).map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. ÁREA DE PRÉ-VISUALIZAÇÃO / FOLHA IMPRESSA */}
      <div className="relative">
        {loading && (
          <div className="no-print absolute inset-0 z-10 bg-white/70 backdrop-blur-2xs flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Gerando visualização do relatório...</span>
            </div>
          </div>
        )}

        {dadosRelatorio ? (
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[720px] lg:min-w-0">
              <RelatorioImpressao dados={dadosRelatorio} />
            </div>
          </div>
        ) : (
          !loading && (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs">
              Selecione um relatório e clique em Atualizar para carregar os dados.
            </div>
          )
        )}
      </div>
    </div>
  );
};
