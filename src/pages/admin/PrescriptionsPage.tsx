import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Printer,
  Search,
  Glasses,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Calendar,
  X,
  Plus,
  RefreshCw,
  Ban,
  Share2,
  Download,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { prescriptionsService, EnvioReceitaResponse } from '../../services/prescriptions.service';
import { patientsService } from '../../services/patients.service';
import { Prescription, Patient } from '../../types';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateBR } from '../../utils/formatters';

export const PrescriptionsPage: React.FC = () => {
  const { consultorio } = useConsultorio();
  const { user, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();

  // Permissões
  const isAdmin = user?.role === 'admin' || user?.papelId === 'admin';
  const podeLer = isAdmin || hasPermission('receitas.ler');
  const podeCriar = isAdmin || hasPermission('receitas.criar');
  const podeImprimir = isAdmin || hasPermission('receitas.imprimir');
  const podeCancelar = isAdmin || hasPermission('receitas.excluir') || hasPermission('receitas.editar');

  // Estados
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'emitida' | 'cancelada'>('todas');
  const [selectedForPrint, setSelectedForPrint] = useState<Prescription | null>(null);

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Modais de Ação (Prompt 09)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const [modalEnviarAberto, setModalEnviarAberto] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<'whatsapp' | 'email'>('whatsapp');
  const [destinatarioEnvio, setDestinatarioEnvio] = useState('');
  const [envioResultado, setEnvioResultado] = useState<EnvioReceitaResponse | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Modal Emitir Nova Receita
  const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
  const [novoPacienteId, setNovoPacienteId] = useState('');
  const [novoOdSph, setNovoOdSph] = useState<number>(-1.75);
  const [novoOdCyl, setNovoOdCyl] = useState<number>(-0.75);
  const [novoOdAxis, setNovoOdAxis] = useState<number>(175);
  const [novoOdAdd, setNovoOdAdd] = useState<number | undefined>(undefined);
  const [novoOdDnp, setNovoOdDnp] = useState<number>(31.0);
  const [novoOeSph, setNovoOeSph] = useState<number>(-1.50);
  const [novoOeCyl, setNovoOeCyl] = useState<number>(-0.50);
  const [novoOeAxis, setNovoOeAxis] = useState<number>(5);
  const [novoOeAdd, setNovoOeAdd] = useState<number | undefined>(undefined);
  const [novoOeDnp, setNovoOeDnp] = useState<number>(31.5);
  const [novoLensType, setNovoLensType] = useState('Monofocal Digital com Filtro Blue Control');
  const [novoObservacoes, setNovoObservacoes] = useState('Uso contínuo para trabalho em computador e condução veicular.');
  const [novoRecomendacoes, setNovoRecomendacoes] = useState('Revisão anual preventiva da acuidade visual recomendada.');
  const [submittingNovaReceita, setSubmittingNovaReceita] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const recId = searchParams.get('receitaId');
    if (recId && prescriptions.length > 0) {
      const encontrada = prescriptions.find((p) => p.id === recId);
      if (encontrada) {
        setSelectedForPrint(encontrada);
      }
    }
  }, [searchParams, prescriptions]);

  async function loadData() {
    setLoading(true);
    try {
      const [recData, ptData] = await Promise.all([
        prescriptionsService.getAll(),
        patientsService.getAll(),
      ]);
      setPrescriptions(recData);
      setPatients(ptData);
      if (recData.length > 0 && !selectedForPrint) {
        setSelectedForPrint(recData[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 1. Imprimir
  const handlePrint = () => {
    window.print();
  };

  // 2. Reimpressão com registro oficial de 2ª via
  const handleReimprimir = async () => {
    if (!selectedForPrint || !podeImprimir) return;
    try {
      const res = await prescriptionsService.reimprimir(selectedForPrint.id);
      setSelectedForPrint(res.receita);
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === res.receita.id ? res.receita : p))
      );
      setMensagemSucesso(`Reimpressão (2ª via nº ${res.contagemReimpressoes}) registrada com sucesso na auditoria!`);
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao registrar reimpressão.');
    }
  };

  // 3. Cancelar com motivo obrigatório
  const handleConfirmarCancelamento = async () => {
    if (!selectedForPrint || !motivoCancelamento.trim()) {
      setMensagemErro('É obrigatório informar a justificativa/motivo do cancelamento.');
      return;
    }

    try {
      const cancelada = await prescriptionsService.cancelar(selectedForPrint.id, motivoCancelamento.trim());
      setSelectedForPrint(cancelada);
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === cancelada.id ? cancelada : p))
      );
      setModalCancelarAberto(false);
      setMotivoCancelamento('');
      setMensagemSucesso(`Receita nº ${cancelada.numeroFormatado} cancelada com sucesso. Registro gravado na auditoria.`);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao cancelar receita.');
    }
  };

  // 4. Enviar por WhatsApp ou E-mail com Link Temporário
  const handleAbrirModalEnvio = (tipo: 'whatsapp' | 'email') => {
    if (!selectedForPrint) return;
    setTipoEnvio(tipo);
    const dest =
      tipo === 'whatsapp'
        ? selectedForPrint.snapshotPaciente?.telefone || ''
        : selectedForPrint.snapshotPaciente?.email || '';
    setDestinatarioEnvio(dest);
    setEnvioResultado(null);
    setModalEnviarAberto(true);
  };

  const handleExecutarEnvio = async () => {
    if (!selectedForPrint) return;
    setEnviando(true);
    setMensagemErro('');
    try {
      const res = await prescriptionsService.enviar(
        selectedForPrint.id,
        tipoEnvio,
        destinatarioEnvio
      );
      setEnvioResultado(res);
      setSelectedForPrint(res.receita);
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === res.receita.id ? res.receita : p))
      );
      setMensagemSucesso(`Receita preparada para envio por ${tipoEnvio.toUpperCase()} com link temporário expirável gerado!`);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao preparar envio da receita.');
    } finally {
      setEnviando(false);
    }
  };

  // 5. Emitir Nova Receita com Validação e Snapshot Congelado
  const handleEmitirNovaReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPacienteId) {
      setMensagemErro('Selecione um paciente cadastrado.');
      return;
    }

    setSubmittingNovaReceita(true);
    setMensagemErro('');
    try {
      const nova = await prescriptionsService.create({
        patientId: novoPacienteId,
        validadeDias: consultorio.validadeReceitaDias || 365,
        od: {
          spherical: novoOdSph,
          cylindrical: novoOdCyl,
          axis: novoOdAxis,
          dnp: novoOdDnp,
          addition: novoOdAdd,
          visualAcuity: '20/20',
        },
        oe: {
          spherical: novoOeSph,
          cylindrical: novoOeCyl,
          axis: novoOeAxis,
          dnp: novoOeDnp,
          addition: novoOeAdd,
          visualAcuity: '20/20',
        },
        dpTotal: Number((novoOdDnp + novoOeDnp).toFixed(1)),
        lensType: novoLensType,
        coatings: ['Antirreflexo Premium', 'Filtro de Luz Azul (Blue Cut)', 'Proteção UV400'],
        observacoes: novoObservacoes,
        recommendations: novoRecomendacoes,
      });

      setPrescriptions((prev) => [nova, ...prev]);
      setSelectedForPrint(nova);
      setModalNovaReceitaAberto(false);
      setMensagemSucesso(`Receita nº ${nova.numeroFormatado} emitida com sucesso! Snapshot do consultório e do profissional congelados.`);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao emitir receita.');
    } finally {
      setSubmittingNovaReceita(false);
    }
  };

  const filtered = prescriptions.filter((p) => {
    const nome = p.snapshotPaciente?.nome || p.patientName || '';
    const num = p.numeroFormatado || p.id || '';
    const matchesSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      num.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'todas' ||
      (statusFilter === 'emitida' && !p.cancelada && p.status !== 'cancelada') ||
      (statusFilter === 'cancelada' && (p.cancelada || p.status === 'cancelada'));
    return matchesSearch && matchesStatus;
  });

  // Dados do snapshot congelado ou fallback do consultório
  const consultorioSnapshot = selectedForPrint?.snapshotConsultorio || consultorio;
  const profissionalSnapshot = selectedForPrint?.snapshotProfissional || {
    nome: selectedForPrint?.optometristName || consultorio.responsavelTecnico,
    registroProfissional: selectedForPrint?.registerNumber || consultorio.registroResponsavelTecnico,
  };
  const pacienteSnapshot = selectedForPrint?.snapshotPaciente || {
    nome: selectedForPrint?.patientName,
    cpf: '',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-teal-600" />
            <span>Receituário Óptico Digital & Compensação Visual</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Numeração sequencial atômica sem lacunas, dados congelados na emissão, link temporário de WhatsApp e conformidade CBOO
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {podeCriar && (
            <button
              onClick={() => setModalNovaReceitaAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Nova Receita</span>
            </button>
          )}

          {selectedForPrint && podeImprimir && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{mensagemErro}</span>
          </div>
          <button onClick={() => setMensagemErro('')} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Lateral: Lista de Receitas */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por paciente ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            {/* Filtros de Status */}
            <div className="flex items-center gap-1">
              {(['todas', 'emitida', 'cancelada'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex-1 ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'todas' ? 'Todas' : st === 'emitida' ? 'Ativas' : 'Canceladas'}
                </button>
              ))}
            </div>

            {/* Lista com Rolagem */}
            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto space-y-1">
              {filtered.map((prx) => {
                const isSelected = selectedForPrint?.id === prx.id;
                const isCancelada = prx.cancelada || prx.status === 'cancelada';

                return (
                  <button
                    key={prx.id}
                    onClick={() => setSelectedForPrint(prx)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border border-teal-200 text-teal-950 font-medium shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate">
                        {prx.snapshotPaciente?.nome || prx.patientName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isCancelada
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCancelada ? 'Cancelada' : 'Emitida'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Nº {prx.numeroFormatado || prx.id}</span>
                      <span>{formatDateBR(prx.date)}</span>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma receita encontrada.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel Principal: Visualização da Folha Oficial A4 */}
        <div className="lg:col-span-8">
          {selectedForPrint ? (
            <div className="space-y-4">
              {/* Barra de Ações Rápidas da Receita Selecionada (Oculta na impressão) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Ações da Receita:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      selectedForPrint.cancelada
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedForPrint.cancelada ? 'Cancelada' : 'Ativa / Emitida'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp */}
                  <button
                    onClick={() => handleAbrirModalEnvio('whatsapp')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs inline-flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* E-mail */}
                  <button
                    onClick={() => handleAbrirModalEnvio('email')}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs inline-flex items-center gap-1.5 border border-purple-200 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>E-mail</span>
                  </button>

                  {/* Reimprimir */}
                  {podeImprimir && (
                    <button
                      onClick={handleReimprimir}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Registra nova via na auditoria e imprime"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reimprimir (2ª via)</span>
                    </button>
                  )}

                  {/* Cancelar (se não cancelada) */}
                  {!selectedForPrint.cancelada && podeCancelar && (
                    <button
                      onClick={() => setModalCancelarAberto(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancelar Receita</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Folha A4 Oficial da Receita */}
              <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 sm:p-12 relative print:m-0 print:p-8 print:border-none print:shadow-none print:rounded-none">
                {/* Banner de Cancelamento */}
                {selectedForPrint.cancelada && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">RECEITA CANCELADA NO SISTEMA</p>
                      <p className="text-[11px] mt-0.5">
                        <strong>Motivo:</strong> {selectedForPrint.motivoCancelamento || 'Não especificado'}
                      </p>
                      {selectedForPrint.canceladaEm && (
                        <p className="text-[10px] text-rose-600 mt-0.5">
                          Cancelada em: {formatDateBR(selectedForPrint.canceladaEm.split('T')[0])} por {selectedForPrint.canceladaPor?.nome || 'Administrador'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cabeçalho do Consultório (Snapshot congelado na emissão - Regra Prompt 09) */}
                <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {consultorioSnapshot.logoUrl ? (
                      <img
                        src={consultorioSnapshot.logoUrl}
                        alt="Logo Consultório"
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0">
                        <Glasses className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                        {consultorioSnapshot.nomeFantasia || consultorio.nomeFantasia}
                      </h2>
                      <p className="text-xs font-semibold text-teal-700">
                        {profissionalSnapshot.nome || consultorio.responsavelTecnico} • {profissionalSnapshot.registroProfissional || consultorio.registroProfissional}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        CNPJ: {consultorioSnapshot.cnpj || consultorio.cnpj} • Gabinete Clínico Optométrico
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-[11px] text-slate-600 shrink-0">
                    <p className="font-semibold">
                      {consultorioSnapshot.endereco?.logradouro}, {consultorioSnapshot.endereco?.numero}
                    </p>
                    <p>
                      {consultorioSnapshot.endereco?.bairro} - {consultorioSnapshot.endereco?.cidade}/{consultorioSnapshot.endereco?.uf}
                    </p>
                    <p className="font-mono mt-0.5">
                      Tel: {consultorioSnapshot.telefone || consultorioSnapshot.whatsapp}
                    </p>
                  </div>
                </div>

                {/* Título da Folha e Identificação Sequencial */}
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Receituário Óptico & Compensação Refrativa
                    </h3>
                    <span className="text-[10px] text-slate-500">Documento clínico oficial numerado</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                      Nº {selectedForPrint.numeroFormatado || `REC-${selectedForPrint.id}`}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Emissão: {formatDateBR(selectedForPrint.date)}
                    </p>
                  </div>
                </div>

                {/* Dados do Paciente (Snapshot congelado) */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paciente</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {pacienteSnapshot.nome || selectedForPrint.patientName}
                      </span>
                    </div>
                    <div className="sm:col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPF</span>
                      <span className="font-mono text-slate-800">{pacienteSnapshot.cpf || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-200/60">
                    <div className="sm:col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</span>
                      <span className="text-slate-700">
                        {pacienteSnapshot.dataNascimento ? formatDateBR(pacienteSnapshot.dataNascimento) : 'Não informada'}
                      </span>
                    </div>
                    <div className="sm:col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone / WhatsApp</span>
                      <span className="font-mono text-slate-700">{pacienteSnapshot.telefone || 'Não informado'}</span>
                    </div>
                    <div className="sm:col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade / UF</span>
                      <span className="text-slate-700">
                        {pacienteSnapshot.endereco?.cidade || 'São Paulo'} - {pacienteSnapshot.endereco?.uf || 'SP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TABELA REFRATIVA OFICIAL (OD / OE) */}
                <div className="mb-6 overflow-hidden rounded-2xl border border-slate-300">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-left">Olho</th>
                        <th className="py-2.5 px-3">Esférico (D)</th>
                        <th className="py-2.5 px-3">Cilíndrico (D)</th>
                        <th className="py-2.5 px-3">Eixo (°)</th>
                        <th className="py-2.5 px-3">Adição (D)</th>
                        <th className="py-2.5 px-3">DNP (mm)</th>
                        <th className="py-2.5 px-3">Acuidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-slate-800 font-medium">
                      <tr className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-left font-sans font-bold text-slate-900">
                          OD <span className="text-[10px] text-slate-500 font-normal">(Direito)</span>
                        </td>
                        <td className="py-3 px-3 text-teal-900 font-bold">
                          {selectedForPrint.od.spherical !== undefined && selectedForPrint.od.spherical !== null
                            ? (selectedForPrint.od.spherical > 0 ? `+${selectedForPrint.od.spherical.toFixed(2)}` : selectedForPrint.od.spherical.toFixed(2))
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-indigo-900 font-bold">
                          {selectedForPrint.od.cylindrical !== undefined && selectedForPrint.od.cylindrical !== null && selectedForPrint.od.cylindrical !== 0
                            ? selectedForPrint.od.cylindrical.toFixed(2)
                            : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.od.axis ? `${selectedForPrint.od.axis}°` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.od.addition ? `+${selectedForPrint.od.addition.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.od.dnp ? `${selectedForPrint.od.dnp} mm` : '—'}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {selectedForPrint.od.visualAcuity || '20/20'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 bg-slate-50/40">
                        <td className="py-3 px-3 text-left font-sans font-bold text-slate-900">
                          OE <span className="text-[10px] text-slate-500 font-normal">(Esquerdo)</span>
                        </td>
                        <td className="py-3 px-3 text-teal-900 font-bold">
                          {selectedForPrint.oe.spherical !== undefined && selectedForPrint.oe.spherical !== null
                            ? (selectedForPrint.oe.spherical > 0 ? `+${selectedForPrint.oe.spherical.toFixed(2)}` : selectedForPrint.oe.spherical.toFixed(2))
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-indigo-900 font-bold">
                          {selectedForPrint.oe.cylindrical !== undefined && selectedForPrint.oe.cylindrical !== null && selectedForPrint.oe.cylindrical !== 0
                            ? selectedForPrint.oe.cylindrical.toFixed(2)
                            : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.oe.axis ? `${selectedForPrint.oe.axis}°` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.oe.addition ? `+${selectedForPrint.oe.addition.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {selectedForPrint.oe.dnp ? `${selectedForPrint.oe.dnp} mm` : '—'}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {selectedForPrint.oe.visualAcuity || '20/20'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DP Total e Lentes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Design da Lente
                    </span>
                    <p className="font-bold text-slate-800">{selectedForPrint.lensType || 'Monofocal Digital'}</p>
                    {selectedForPrint.dpTotal && (
                      <p className="text-[11px] text-slate-600 mt-1 font-mono">
                        Distância Pupilar Total (DP): <strong>{selectedForPrint.dpTotal} mm</strong>
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Tratamentos Sugeridos
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedForPrint.coatings && selectedForPrint.coatings.length > 0 ? (
                        selectedForPrint.coatings.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-medium">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px]">Conforme escolha do paciente</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observações e Recomendações */}
                {(selectedForPrint.observacoes || selectedForPrint.recommendations) && (
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Observações Clínicas & Orientações
                    </span>
                    {selectedForPrint.observacoes && (
                      <p className="text-slate-700 leading-relaxed">{selectedForPrint.observacoes}</p>
                    )}
                    {selectedForPrint.recommendations && (
                      <p className="text-slate-700 leading-relaxed font-medium">{selectedForPrint.recommendations}</p>
                    )}
                  </div>
                )}

                {/* Validade da Receita */}
                <div className="mb-8 p-3 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span className="font-semibold">
                      Validade da Prescrição: <strong>{formatDateBR(selectedForPrint.expirationDate)}</strong> ({selectedForPrint.validadeDias || consultorio.validadeReceitaDias || 365} dias)
                    </span>
                  </div>
                  {selectedForPrint.contagemReimpressoes !== undefined && selectedForPrint.contagemReimpressoes > 0 && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-teal-200 font-mono">
                      {selectedForPrint.contagemReimpressoes + 1}ª Via Impressa
                    </span>
                  )}
                </div>

                {/* Assinatura e Carimbo Oficial */}
                <div className="pt-6 border-t border-slate-200 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-[10px] text-slate-500 max-w-xs text-center sm:text-left">
                    <p className="leading-relaxed">
                      {consultorioSnapshot.textoRodape ||
                        'Prescrição óptica formulada de acordo com as prerrogativas do profissional optometrista (CBO 3223-05). Válido por 1 ano a partir da data de emissão.'}
                    </p>
                  </div>

                  <div className="text-center min-w-[240px]">
                    {consultorioSnapshot.assinaturaUrl ? (
                      <img src={consultorioSnapshot.assinaturaUrl} alt="Assinatura" className="h-12 mx-auto mb-1 object-contain" />
                    ) : (
                      <div className="h-12 flex items-center justify-center">
                        <span className="font-serif italic text-lg text-slate-700">
                          {profissionalSnapshot.nome}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-slate-900 pt-1.5">
                      <p className="font-bold text-xs text-slate-900">
                        {profissionalSnapshot.nome}
                      </p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {profissionalSnapshot.registroProfissional}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Optometrista Responsável Técnico</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Selecione uma receita na lista lateral para visualizar e imprimir.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CANCELAMENTO DE RECEITA (PROMPT 09)                              */}
      {/* ========================================================================= */}
      {modalCancelarAberto && selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancelar Receita Óptica</h3>
                  <span className="text-[11px] text-slate-500">Nº {selectedForPrint.numeroFormatado}</span>
                </div>
              </div>
              <button onClick={() => setModalCancelarAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Conforme a regra clínica e legal do sistema, <strong>uma receita emitida não pode ser editada</strong>. Caso haja necessidade de correção no grau ou parâmetros, esta receita deve ser cancelada informando o motivo e uma nova emitida.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo / Justificativa do Cancelamento *
              </label>
              <textarea
                rows={3}
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Paciente relatou desconforto no eixo refrativo e foi refeita a refração..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalCancelarAberto(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!motivoCancelamento.trim()}
                onClick={handleConfirmarCancelamento}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ENVIO POR WHATSAPP / E-MAIL COM LINK TEMPORÁRIO (PROMPT 09)      */}
      {/* ========================================================================= */}
      {modalEnviarAberto && selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tipoEnvio === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                  {tipoEnvio === 'whatsapp' ? <Send className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Enviar Receita por {tipoEnvio === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Gera link temporário e seguro para o PDF (válido por 7 dias)
                  </span>
                </div>
              </div>
              <button onClick={() => setModalEnviarAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!envioResultado ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tipoEnvio === 'whatsapp' ? 'Telefone / WhatsApp do Destinatário' : 'E-mail do Destinatário'} *
                  </label>
                  <input
                    type="text"
                    value={destinatarioEnvio}
                    onChange={(e) => setDestinatarioEnvio(e.target.value)}
                    placeholder={tipoEnvio === 'whatsapp' ? '(11) 98765-4321' : 'paciente@email.com'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
                  <p className="font-semibold text-slate-800">Privacidade LGPD:</p>
                  <p className="text-[11px] leading-relaxed">
                    O link de acesso ao PDF é protegido por um token temporário que expira automaticamente em 7 dias, garantindo a privacidade dos dados clínicos do titular.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEnviarAberto(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={enviando || !destinatarioEnvio.trim()}
                    onClick={handleExecutarEnvio}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {enviando ? 'Gerando Link...' : 'Gerar Link & Enviar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Link temporário seguro gerado com sucesso! Válido até {formatDateBR(envioResultado.expiraEm.split('T')[0])}.</span>
                </div>

                {tipoEnvio === 'whatsapp' && envioResultado.textoWhatsapp && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 text-xs">Mensagem Pronta para WhatsApp:</label>
                    <textarea
                      rows={4}
                      readOnly
                      value={envioResultado.textoWhatsapp}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-800 select-all"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${destinatarioEnvio.replace(/\D/g, '')}&text=${encodeURIComponent(envioResultado.textoWhatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Abrir e Disparar no WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalEnviarAberto(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EMITIR NOVA RECEITA COM VALIDAÇÃO CLÍNICA (PROMPT 09)             */}
      {/* ========================================================================= */}
      {modalNovaReceitaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[95vh] flex flex-col space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Glasses className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Emitir Receituário Óptico Oficial</h3>
                  <span className="text-xs text-slate-500">
                    Numeração atômica sequencial automática e congelamento dos dados cadastrais
                  </span>
                </div>
              </div>
              <button onClick={() => setModalNovaReceitaAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmitirNovaReceita} className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paciente *</label>
                <select
                  value={novoPacienteId}
                  onChange={(e) => setNovoPacienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-900"
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabela OD */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-teal-800 block text-xs">Olho Direito (OD)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Esférico (D) *</label>
                    <input
                      type="number"
                      step="0.25"
                      value={novoOdSph}
                      onChange={(e) => setNovoOdSph(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Cilíndrico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={novoOdCyl}
                      onChange={(e) => setNovoOdCyl(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center text-indigo-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Eixo (°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={novoOdAxis}
                      onChange={(e) => setNovoOdAxis(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Adição (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="4"
                      value={novoOdAdd || ''}
                      onChange={(e) => setNovoOdAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: +1.50"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">DNP (mm) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={novoOdDnp}
                      onChange={(e) => setNovoOdDnp(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center text-teal-700"
                    />
                  </div>
                </div>
              </div>

              {/* Tabela OE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-teal-800 block text-xs">Olho Esquerdo (OE)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Esférico (D) *</label>
                    <input
                      type="number"
                      step="0.25"
                      value={novoOeSph}
                      onChange={(e) => setNovoOeSph(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Cilíndrico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={novoOeCyl}
                      onChange={(e) => setNovoOeCyl(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center text-indigo-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Eixo (°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={novoOeAxis}
                      onChange={(e) => setNovoOeAxis(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Adição (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="4"
                      value={novoOeAdd || ''}
                      onChange={(e) => setNovoOeAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: +1.50"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">DNP (mm) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={novoOeDnp}
                      onChange={(e) => setNovoOeDnp(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center text-teal-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Lente Indicada</label>
                <input
                  type="text"
                  value={novoLensType}
                  onChange={(e) => setNovoLensType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Receita</label>
                <input
                  type="text"
                  value={novoObservacoes}
                  onChange={(e) => setNovoObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalNovaReceitaAberto(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingNovaReceita || !novoPacienteId}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submittingNovaReceita ? 'Emitindo...' : 'Emitir Receita Óptica'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
