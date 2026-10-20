import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Printer,
  Glasses,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
  X,
  Shield,
  Send,
} from 'lucide-react';
import { examsService } from '../../services/exams.service';
import { patientsService } from '../../services/patients.service';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Exam, Patient } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { formatDateBR } from '../../utils/formatters';

export const ExamsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { consultorio } = useConsultorio();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Permissões
  const isAdmin = user?.role === 'admin' || user?.papelId === 'admin';
  const podeLer = isAdmin || hasPermission('atendimento.ler');
  const podeCriar = isAdmin || hasPermission('atendimento.criar');
  const podeEditar = isAdmin || hasPermission('atendimento.editar');

  // Estados principais
  const [exams, setExams] = useState<Exam[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'finalizado' | 'em_andamento'>('todos');
  const [selectedExamForView, setSelectedExamForView] = useState<Exam | null>(null);

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Estados do Formulário de Atendimento
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [agendamentoVinculadoId, setAgendamentoVinculadoId] = useState<string | undefined>(undefined);
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [horarioAtendimento, setHorarioAtendimento] = useState(new Date().toTimeString().slice(0, 5));

  // Aba ativa do editor
  const [abaEditor, setAbaEditor] = useState<'anamnese' | 'acuidade' | 'refracao' | 'complementares' | 'conduta'>('anamnese');

  // 1. Anamnese
  const [queixaPrincipal, setQueixaPrincipal] = useState('Dificuldade para focar de perto e cansaço visual após horas em telas digitais.');
  const [motivoConsulta, setMotivoConsulta] = useState('Exame de rotina anual');
  const [usaOculos, setUsaOculos] = useState(false);
  const [usaLentesContato, setUsaLentesContato] = useState(false);
  const [alergias, setAlergias] = useState('');
  const [doencasSistemicas, setDoencasSistemicas] = useState('');
  const [medicamentosUso, setMedicamentosUso] = useState('');
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState('');

  // 2. Acuidade Visual Snellen
  const [avScOd, setAvScOd] = useState('20/50');
  const [avScOe, setAvScOe] = useState('20/50');
  const [avScBinocular, setAvScBinocular] = useState('20/40');
  const [avCcOd, setAvCcOd] = useState('20/20');
  const [avCcOe, setAvCcOe] = useState('20/20');
  const [avCcBinocular, setAvCcBinocular] = useState('20/15');

  // 3. Refração Subjetiva OD
  const [odSph, setOdSph] = useState<number>(-1.75);
  const [odCyl, setOdCyl] = useState<number>(-0.75);
  const [odAxis, setOdAxis] = useState<number>(175);
  const [odDnp, setOdDnp] = useState<number>(31.0);
  const [odAdd, setOdAdd] = useState<number | undefined>(undefined);

  // Refração Subjetiva OE
  const [oeSph, setOeSph] = useState<number>(-1.50);
  const [oeCyl, setOeCyl] = useState<number>(-0.50);
  const [oeAxis, setOeAxis] = useState<number>(5);
  const [oeDnp, setOeDnp] = useState<number>(31.5);
  const [oeAdd, setOeAdd] = useState<number | undefined>(undefined);

  // 4. Exames Complementares
  const [iopOd, setIopOd] = useState<number>(14);
  const [iopOe, setIopOe] = useState<number>(15);
  const [k1Od, setK1Od] = useState<number>(43.25);
  const [k2Od, setK2Od] = useState<number>(44.00);
  const [k1Oe, setK1Oe] = useState<number>(43.50);
  const [k2Oe, setK2Oe] = useState<number>(44.25);

  // 5. Diagnóstico e Conduta
  const [clinicalFindings, setClinicalFindings] = useState('Meios ópticos transparentes. Reflexos pupilares direto e consensual íntegros.');
  const [diagnosisNotes, setDiagnosisNotes] = useState('Miopia composta com astigmatismo miópico bilateral. Sem alterações no polo anterior.');
  const [lensType, setLensType] = useState<'monofocal' | 'multifocal' | 'bifocal' | 'lente_contato'>('monofocal');
  const [blueCut, setBlueCut] = useState(true);
  const [antiGlare, setAntiGlare] = useState(true);
  const [uvProtection, setUvProtection] = useState(true);
  const [photochromic, setPhotochromic] = useState(false);

  // Opção de emitir receita diretamente
  const [emitirReceitaDireta, setEmitirReceitaDireta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const patientParam = searchParams.get('patientId');
    const aptParam = searchParams.get('agendamentoId');
    if (aptParam) {
      setAgendamentoVinculadoId(aptParam);
    }
    if (patientParam && patients.length > 0) {
      setSelectedPatientId(patientParam);
      setIsEditorOpen(true);
    }
    if (searchParams.get('action') === 'novo') {
      setIsEditorOpen(true);
    }
  }, [searchParams, patients]);

  async function loadData() {
    setLoading(true);
    try {
      const [exData, ptData] = await Promise.all([
        examsService.getAll(),
        patientsService.getAll(),
      ]);
      setExams(exData);
      setPatients(ptData);
      if (ptData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(ptData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Transposição Esferocilíndrica (Regra Óptica Clínica)
  const handleTranspose = (eye: 'OD' | 'OE') => {
    if (eye === 'OD') {
      const newSph = odSph + odCyl;
      const newCyl = -odCyl;
      let newAxis = odAxis > 90 ? odAxis - 90 : odAxis + 90;
      setOdSph(Number(newSph.toFixed(2)));
      setOdCyl(Number(newCyl.toFixed(2)));
      setOdAxis(newAxis);
    } else {
      const newSph = oeSph + oeCyl;
      const newCyl = -oeCyl;
      let newAxis = oeAxis > 90 ? oeAxis - 90 : oeAxis + 90;
      setOeSph(Number(newSph.toFixed(2)));
      setOeCyl(Number(newCyl.toFixed(2)));
      setOeAxis(newAxis);
    }
  };

  const handleSalvarAtendimento = async (concluir: boolean) => {
    if (!selectedPatientId) {
      setMensagemErro('Selecione um paciente para registrar o atendimento.');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    setSubmitting(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const filters: string[] = [];
      if (blueCut) filters.push('Filtro de Luz Azul (Blue Cut)');
      if (antiGlare) filters.push('Antirreflexo Premium');
      if (uvProtection) filters.push('Proteção UV400');
      if (photochromic) filters.push('Fotossensível');

      const examPayload = {
        patientId: patient.id,
        patientName: patient.name,
        agendamentoId: agendamentoVinculadoId,
        optometristId: user?.uid || 'optometrista-01',
        optometristName: user?.displayName || consultorio.responsavelTecnico || 'Dr. Roberto Viana',
        date: examDate,
        anamnese: {
          queixaPrincipal,
          motivoConsulta,
          usaOculos,
          usaLentesContato,
          alergias,
          doencasSistemicas,
          medicamentosUso,
          antecedentesFamiliares,
        },
        visualAcuitySc: {
          od: avScOd,
          oe: avScOe,
          binocular: avScBinocular,
        },
        visualAcuityCc: {
          od: avCcOd,
          oe: avCcOe,
          binocular: avCcBinocular,
        },
        subjectiveRefraction: {
          od: {
            spherical: odSph,
            cylindrical: odCyl,
            axis: odAxis,
            dnp: odDnp,
            addition: odAdd,
            visualAcuity: avCcOd,
          },
          oe: {
            spherical: oeSph,
            cylindrical: oeCyl,
            axis: oeAxis,
            dnp: oeDnp,
            addition: oeAdd,
            visualAcuity: avCcOe,
          },
        },
        pupillaryDistance: {
          dpTotal: Number((odDnp + oeDnp).toFixed(1)),
          dnpOd: odDnp,
          dnpOe: oeDnp,
        },
        keratometry: {
          od: { k1: k1Od, k2: k2Od, axis: odAxis },
          oe: { k1: k1Oe, k2: k2Oe, axis: oeAxis },
        },
        intraocularPressure: {
          od: iopOd,
          oe: iopOe,
          method: 'Tonometria de Aplanação',
        },
        clinicalFindings,
        diagnosisNotes,
        lensesRecommendation: {
          type: lensType,
          filters,
        },
        status: concluir ? ('finalizado' as const) : ('em_andamento' as const),
        concluir,
        emitirReceita: concluir && emitirReceitaDireta,
        dadosReceita: {
          validadeDias: consultorio.validadeReceitaDias || 365,
          tipoLente:
            lensType === 'monofocal'
              ? 'Lente Monofocal Digital'
              : lensType === 'multifocal'
              ? 'Lente Multifocal Progressiva'
              : lensType === 'lente_contato'
              ? 'Lentes de Contato Hidrogel'
              : 'Lente Bifocal',
          tratamentos: filters,
          observacoes: clinicalFindings,
          recomendacoes: diagnosisNotes,
        },
      };

      const newExam = await examsService.create(examPayload);

      setExams((prev) => [newExam, ...prev]);
      setIsEditorOpen(false);

      if (concluir && emitirReceitaDireta) {
        setMensagemSucesso('Atendimento concluído com sucesso e receita óptica emitida!');
        navigate('/admin/prescricoes');
      } else {
        setMensagemSucesso(concluir ? 'Atendimento clínico concluído com sucesso e consulta marcada como atendida!' : 'Atendimento salvo em andamento.');
      }
    } catch (err: any) {
      console.error('Erro ao salvar atendimento:', err);
      setMensagemErro(err.message || 'Erro ao registrar atendimento clínico.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch = e.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'finalizado' && e.status === 'finalizado') ||
      (filtroStatus === 'em_andamento' && e.status !== 'finalizado');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-teal-600" />
            <span>Atendimento Clínico & Exames de Refração</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Anamnese completa, acuidade Snellen OD/OE, refração subjetiva, ceratometria e emissão de receitas
          </p>
        </div>

        {podeCriar && (
          <button
            onClick={() => {
              setIsEditorOpen(true);
              setAgendamentoVinculadoId(undefined);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Atendimento Clínico</span>
          </button>
        )}
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
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{mensagemErro}</span>
          </div>
          <button onClick={() => setMensagemErro('')} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['todos', 'finalizado', 'em_andamento'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'todos' ? 'Todos' : st === 'finalizado' ? 'Finalizados' : 'Em Andamento'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{exam.patientName}</h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateBR(exam.date)}</span>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    exam.status === 'finalizado'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {exam.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
                </span>
              </div>

              {/* Resumo da Refração OD/OE */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="font-bold text-teal-800 font-sans">OD:</span>
                  <span>
                    {exam.subjectiveRefraction.od.spherical !== undefined
                      ? (exam.subjectiveRefraction.od.spherical > 0 ? `+${exam.subjectiveRefraction.od.spherical.toFixed(2)}` : exam.subjectiveRefraction.od.spherical.toFixed(2))
                      : '—'}
                    {exam.subjectiveRefraction.od.cylindrical ? ` (${exam.subjectiveRefraction.od.cylindrical.toFixed(2)} x ${exam.subjectiveRefraction.od.axis}°)` : ''}
                  </span>
                  <span className="text-[10px] font-sans text-slate-500">AV: {exam.visualAcuityCc.od}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800">
                  <span className="font-bold text-teal-800 font-sans">OE:</span>
                  <span>
                    {exam.subjectiveRefraction.oe.spherical !== undefined
                      ? (exam.subjectiveRefraction.oe.spherical > 0 ? `+${exam.subjectiveRefraction.oe.spherical.toFixed(2)}` : exam.subjectiveRefraction.oe.spherical.toFixed(2))
                      : '—'}
                    {exam.subjectiveRefraction.oe.cylindrical ? ` (${exam.subjectiveRefraction.oe.cylindrical.toFixed(2)} x ${exam.subjectiveRefraction.oe.axis}°)` : ''}
                  </span>
                  <span className="text-[10px] font-sans text-slate-500">AV: {exam.visualAcuityCc.oe}</span>
                </div>
              </div>

              {exam.diagnosisNotes && (
                <p className="mt-3 text-[11px] text-slate-600 line-clamp-2">
                  <strong className="text-slate-800">Diagnóstico:</strong> {exam.diagnosisNotes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedExamForView(exam)}
                className="font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Ficha Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {exam.receitaId && (
                <button
                  onClick={() => navigate(`/admin/prescricoes?receitaId=${exam.receitaId}`)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Receita Óptica</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && !loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Eye className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Nenhum atendimento clínico encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">Clique em "Novo Atendimento Clínico" para iniciar uma avaliação optométrica.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / FORMULÁRIO DE ATENDIMENTO CLÍNICO (PROMPT 09)                     */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[95vh] flex flex-col space-y-4 animate-in zoom-in-95">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Atendimento Clínico Optométrico</h3>
                  <span className="text-xs text-slate-500">
                    {agendamentoVinculadoId
                      ? 'Atendimento vinculado à consulta da agenda (será concluído automaticamente)'
                      : 'Novo exame de refração ocular individual'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Consulta Vinculada */}
            {agendamentoVinculadoId && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-900 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Vínculo de Agenda Ativo:</strong> Ao clicar em "Concluir Atendimento", esta consulta será automaticamente marcada como <strong>atendida</strong> na agenda do consultório.
                </span>
              </div>
            )}

            {/* Cabeçalho do formulário: Seleção do Paciente e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-2 border-b border-slate-100 shrink-0 text-xs">
              <div className="sm:col-span-8">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Paciente *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-900"
                >
                  <option value="">Selecione o paciente do prontuário...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Data do Atendimento</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                />
              </div>
            </div>

            {/* Abas do Atendimento */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 shrink-0 overflow-x-auto text-xs">
              {[
                { id: 'anamnese', label: '1. Anamnese' },
                { id: 'acuidade', label: '2. Acuidade Visual' },
                { id: 'refracao', label: '3. Refração Subjetiva' },
                { id: 'complementares', label: '4. Complementares' },
                { id: 'conduta', label: '5. Diagnóstico & Conduta' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAbaEditor(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    abaEditor === tab.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {/* ABA 1: ANAMNESE */}
              {abaEditor === 'anamnese' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Queixa Principal (QP) *</label>
                    <textarea
                      rows={3}
                      value={queixaPrincipal}
                      onChange={(e) => setQueixaPrincipal(e.target.value)}
                      placeholder="Descreva as queixas visuais, início dos sintomas, cefaleias, fadiga ocular..."
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">Correção Óptica Prévia</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usaOculos}
                          onChange={(e) => setUsaOculos(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span className="text-xs text-slate-700">Já usa óculos de grau</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usaLentesContato}
                          onChange={(e) => setUsaLentesContato(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span className="text-xs text-slate-700">Usa lentes de contato</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">Alergias Oculares / Gerais</label>
                      <input
                        type="text"
                        value={alergias}
                        onChange={(e) => setAlergias(e.target.value)}
                        placeholder="Ex: Rinite, conjuntivite alérgica..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Doenças Sistêmicas</label>
                      <input
                        type="text"
                        value={doencasSistemicas}
                        onChange={(e) => setDoencasSistemicas(e.target.value)}
                        placeholder="Ex: Diabetes, hipertensão..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Histórico Familiar Ocular</label>
                      <input
                        type="text"
                        value={antecedentesFamiliares}
                        onChange={(e) => setAntecedentesFamiliares(e.target.value)}
                        placeholder="Ex: Glaucoma, catarata, ceratocone..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: ACUIDADE VISUAL */}
              {abaEditor === 'acuidade' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-800">
                      Acuidade Visual Sem Correção (s/c)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">OD (Direito)</label>
                        <input
                          type="text"
                          value={avScOd}
                          onChange={(e) => setAvScOd(e.target.value)}
                          placeholder="20/50"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">OE (Esquerdo)</label>
                        <input
                          type="text"
                          value={avScOe}
                          onChange={(e) => setAvScOe(e.target.value)}
                          placeholder="20/50"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Binocular</label>
                        <input
                          type="text"
                          value={avScBinocular}
                          onChange={(e) => setAvScBinocular(e.target.value)}
                          placeholder="20/40"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-200 space-y-3">
                    <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider">
                      Acuidade Visual Com Correção (c/c)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-teal-800 mb-1">OD (Direito)</label>
                        <input
                          type="text"
                          value={avCcOd}
                          onChange={(e) => setAvCcOd(e.target.value)}
                          placeholder="20/20"
                          className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-teal-800 mb-1">OE (Esquerdo)</label>
                        <input
                          type="text"
                          value={avCcOe}
                          onChange={(e) => setAvCcOe(e.target.value)}
                          placeholder="20/20"
                          className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-teal-800 mb-1">Binocular</label>
                        <input
                          type="text"
                          value={avCcBinocular}
                          onChange={(e) => setAvCcBinocular(e.target.value)}
                          placeholder="20/15"
                          className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: REFRAÇÃO SUBJETIVA */}
              {abaEditor === 'refracao' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Bloco OD */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-800">
                        Olho Direito (OD)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranspose('OD')}
                        className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Transposição esferocilíndrica clínica"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Transpor Sinal Cilindro</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Esférico (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={odSph}
                          onChange={(e) => setOdSph(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Cilíndrico (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={odCyl}
                          onChange={(e) => setOdCyl(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center text-indigo-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Eixo (°)</label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={odAxis}
                          onChange={(e) => setOdAxis(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Adição (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="4"
                          value={odAdd || ''}
                          onChange={(e) => setOdAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Ex: +1.50"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">DNP (mm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={odDnp}
                          onChange={(e) => setOdDnp(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center text-teal-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco OE */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-800">
                        Olho Esquerdo (OE)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranspose('OE')}
                        className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Transposição esferocilíndrica clínica"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Transpor Sinal Cilindro</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Esférico (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={oeSph}
                          onChange={(e) => setOeSph(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Cilíndrico (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={oeCyl}
                          onChange={(e) => setOeCyl(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center text-indigo-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Eixo (°)</label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={oeAxis}
                          onChange={(e) => setOeAxis(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Adição (D)</label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="4"
                          value={oeAdd || ''}
                          onChange={(e) => setOeAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Ex: +1.50"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">DNP (mm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={oeDnp}
                          onChange={(e) => setOeDnp(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-center text-teal-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DP Total Calculada */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between font-medium">
                    <span>Distância Pupilar Total (DP Total = DNP OD + DNP OE):</span>
                    <strong className="font-mono text-sm">{(odDnp + oeDnp).toFixed(1)} mm</strong>
                  </div>
                </div>
              )}

              {/* ABA 4: EXAMES COMPLEMENTARES */}
              {abaEditor === 'complementares' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                      Tonometria de Aplanação (PIO em mmHg)
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Olho Direito (OD)</label>
                        <input
                          type="number"
                          value={iopOd}
                          onChange={(e) => setIopOd(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Olho Esquerdo (OE)</label>
                        <input
                          type="number"
                          value={iopOe}
                          onChange={(e) => setIopOe(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                      Ceratometria (K1 / K2)
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="font-bold text-teal-800 text-xs block">OD (Direito)</span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.25"
                            value={k1Od}
                            onChange={(e) => setK1Od(parseFloat(e.target.value) || 0)}
                            placeholder="K1"
                            className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                          />
                          <input
                            type="number"
                            step="0.25"
                            value={k2Od}
                            onChange={(e) => setK2Od(parseFloat(e.target.value) || 0)}
                            placeholder="K2"
                            className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-teal-800 text-xs block">OE (Esquerdo)</span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.25"
                            value={k1Oe}
                            onChange={(e) => setK1Oe(parseFloat(e.target.value) || 0)}
                            placeholder="K1"
                            className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                          />
                          <input
                            type="number"
                            step="0.25"
                            value={k2Oe}
                            onChange={(e) => setK2Oe(parseFloat(e.target.value) || 0)}
                            placeholder="K2"
                            className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: CONDUTA E RECEITA */}
              {abaEditor === 'conduta' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observações Clínicas / Biomicroscopia
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalFindings}
                      onChange={(e) => setClinicalFindings(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diagnóstico Optométrico & Conduta *
                    </label>
                    <textarea
                      rows={2}
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-3">
                    <span className="font-bold text-teal-950 text-xs uppercase tracking-wider block">
                      Prescrição e Compensação Óptica
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Design de Lente Indicada</label>
                        <select
                          value={lensType}
                          onChange={(e) => setLensType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                        >
                          <option value="monofocal">Monofocal Digital</option>
                          <option value="multifocal">Multifocal Progressiva</option>
                          <option value="bifocal">Bifocal</option>
                          <option value="lente_contato">Lentes de Contato</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-slate-700 mb-1">Tratamentos Sugeridos</span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={blueCut}
                              onChange={(e) => setBlueCut(e.target.checked)}
                              className="rounded text-teal-600"
                            />
                            <span>Blue Cut (Telas)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={antiGlare}
                              onChange={(e) => setAntiGlare(e.target.checked)}
                              className="rounded text-teal-600"
                            />
                            <span>Antirreflexo</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={uvProtection}
                              onChange={(e) => setUvProtection(e.target.checked)}
                              className="rounded text-teal-600"
                            />
                            <span>Proteção UV400</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emitirReceitaDireta}
                          onChange={(e) => setEmitirReceitaDireta(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span className="text-xs font-bold text-teal-950">
                          Emitir Receita Óptica Oficial automaticamente com numeração sequencial
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSalvarAtendimento(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar em Andamento
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSalvarAtendimento(true)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Gravando...' : 'Concluir Atendimento'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO COMPLETA DO ATENDIMENTO                              */}
      {/* ========================================================================= */}
      {selectedExamForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedExamForView.patientName}</h3>
                  <span className="text-xs text-slate-500">
                    Atendimento realizado em {formatDateBR(selectedExamForView.date)} por {selectedExamForView.optometristName}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedExamForView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Tabela de Refração */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-teal-800">
                  Refração Subjetiva & Acuidade Snellen
                </span>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold font-sans text-teal-800 block text-xs">Olho Direito (OD)</span>
                    <p className="mt-1">
                      Esf: <strong>{selectedExamForView.subjectiveRefraction.od.spherical}</strong> | Cil: <strong>{selectedExamForView.subjectiveRefraction.od.cylindrical}</strong> x <strong>{selectedExamForView.subjectiveRefraction.od.axis}°</strong>
                    </p>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                      AV s/c: {selectedExamForView.visualAcuitySc.od} • AV c/c: {selectedExamForView.visualAcuityCc.od}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold font-sans text-teal-800 block text-xs">Olho Esquerdo (OE)</span>
                    <p className="mt-1">
                      Esf: <strong>{selectedExamForView.subjectiveRefraction.oe.spherical}</strong> | Cil: <strong>{selectedExamForView.subjectiveRefraction.oe.cylindrical}</strong> x <strong>{selectedExamForView.subjectiveRefraction.oe.axis}°</strong>
                    </p>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                      AV s/c: {selectedExamForView.visualAcuitySc.oe} • AV c/c: {selectedExamForView.visualAcuityCc.oe}
                    </p>
                  </div>
                </div>
              </div>

              {/* Anamnese / Observações */}
              {selectedExamForView.anamnese && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 block">Anamnese / Queixa Principal</span>
                  <p className="text-slate-700">{selectedExamForView.anamnese.queixaPrincipal || 'Não especificada'}</p>
                </div>
              )}

              {selectedExamForView.diagnosisNotes && (
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-1.5">
                  <span className="font-bold text-teal-900 block">Diagnóstico & Conduta Clínica</span>
                  <p className="text-teal-950 font-medium">{selectedExamForView.diagnosisNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              {selectedExamForView.receitaId ? (
                <button
                  onClick={() => {
                    navigate(`/admin/prescricoes?receitaId=${selectedExamForView.receitaId}`);
                    setSelectedExamForView(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Abrir Receita Óptica Vinculada</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Nenhuma receita gerada para este exame</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedExamForView(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
