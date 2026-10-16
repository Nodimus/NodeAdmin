import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  Plus,
  FileCheck,
  Search,
  Sparkles,
  Printer,
  Glasses,
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { examsService } from '../../services/exams.service';
import { patientsService } from '../../services/patients.service';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Exam, Patient, EyeRefraction } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { formatDateBR } from '../../utils/formatters';

export const ExamsPage: React.FC = () => {
  const { user } = useAuth();
  const { consultorio } = useConsultorio();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [exams, setExams] = useState<Exam[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do Formulário de Exame Optométrico
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Acuidade Visual Snellen
  const [avScOd, setAvScOd] = useState('20/50');
  const [avScOe, setAvScOe] = useState('20/50');
  const [avCcOd, setAvCcOd] = useState('20/20');
  const [avCcOe, setAvCcOe] = useState('20/20');

  // Refração OD
  const [odSph, setOdSph] = useState<number>(-1.75);
  const [odCyl, setOdCyl] = useState<number>(-0.75);
  const [odAxis, setOdAxis] = useState<number>(175);
  const [odDnp, setOdDnp] = useState<number>(31.0);
  const [odAdd, setOdAdd] = useState<number | undefined>(undefined);

  // Refração OE
  const [oeSph, setOeSph] = useState<number>(-1.50);
  const [oeCyl, setOeCyl] = useState<number>(-0.50);
  const [oeAxis, setOeAxis] = useState<number>(5);
  const [oeDnp, setOeDnp] = useState<number>(31.5);
  const [oeAdd, setOeAdd] = useState<number | undefined>(undefined);

  // Exames complementares
  const [iopOd, setIopOd] = useState<number>(14);
  const [iopOe, setIopOe] = useState<number>(15);
  const [k1Od, setK1Od] = useState<number>(43.25);
  const [k2Od, setK2Od] = useState<number>(44.00);

  // Diagnóstico e Recomendações
  const [diagnosisNotes, setDiagnosisNotes] = useState(
    'Miopia com astigmatismo miópico bilateral. Sem alterações no polo anterior.'
  );
  const [lensType, setLensType] = useState<
    'monofocal' | 'multifocal' | 'bifocal' | 'lente_contato'
  >('monofocal');
  const [blueCut, setBlueCut] = useState(true);
  const [antiGlare, setAntiGlare] = useState(true);
  const [uvProtection, setUvProtection] = useState(true);
  const [photochromic, setPhotochromic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const patientParam = searchParams.get('patientId');
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

  // Helper de transposição esferocilíndrica (Óptica Clínica)
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

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    setSubmitting(true);
    try {
      const filters: string[] = [];
      if (blueCut) filters.push('Filtro de Luz Azul (Blue Cut)');
      if (antiGlare) filters.push('Antirreflexo Premium');
      if (uvProtection) filters.push('Proteção UV400');
      if (photochromic) filters.push('Fotossensível');

      const newExam = await examsService.create({
        patientId: patient.id,
        patientName: patient.name,
        optometristId: user?.uid || 'optometrista-01',
        optometristName: user?.displayName || 'Dr. Roberto Viana',
        date: examDate,
        visualAcuitySc: {
          od: avScOd,
          oe: avScOe,
        },
        visualAcuityCc: {
          od: avCcOd,
          oe: avCcOe,
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
          dpTotal: odDnp + oeDnp,
          dnpOd: odDnp,
          dnpOe: oeDnp,
        },
        intraocularPressure: {
          od: iopOd,
          oe: iopOe,
          method: 'Tonometria de Aplanação',
        },
        diagnosisNotes,
        lensesRecommendation: {
          type: lensType,
          filters,
        },
        status: 'finalizado',
      });

      // Gera automaticamente a prescrição oficial vinculada ao consultório
      await prescriptionsService.create({
        examId: newExam.id,
        patientId: patient.id,
        patientName: patient.name,
        optometristName: user?.displayName || consultorio.responsavelTecnico,
        registerNumber: user?.registerNumber || consultorio.registroResponsavelTecnico,
        date: examDate,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        od: newExam.subjectiveRefraction.od,
        oe: newExam.subjectiveRefraction.oe,
        dpTotal: odDnp + oeDnp,
        lensType:
          lensType === 'monofocal'
            ? 'Lente Monofocal Digital'
            : lensType === 'multifocal'
            ? 'Lente Multifocal Progressiva'
            : lensType === 'lente_contato'
            ? 'Lentes de Contato Hidrogel'
            : 'Lente Bifocal',
        coatings: filters,
        recommendations: 'Uso conforme orientação optométrica.',
      });

      setExams((prev) => [newExam, ...prev]);
      setIsEditorOpen(false);
      navigate('/admin/prescricoes');
    } catch (err) {
      console.error('Erro ao salvar exame:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExams = exams.filter((e) =>
    e.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-teal-600" />
            <span>Exames Optométricos & Refração</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Refração subjetiva OD/OE, acuidade Snellen, ceratometria e prescrições
          </p>
        </div>

        <button
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isEditorOpen ? 'Fechar Ficha' : 'Realizar Novo Exame'}</span>
        </button>
      </div>

      {/* Editor Clínico de Exame (Drawer ou Bloco Superior) */}
      {isEditorOpen && (
        <div className="bg-white rounded-2xl border-2 border-teal-500 shadow-xl p-6 transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <span>Ficha de Avaliação Refrativa Optométrica</span>
              </h2>
              <p className="text-xs text-slate-700">
                Preencha os parâmetros e gere a receita com 1 clique
              </p>
            </div>
            <button
              onClick={() => setIsEditorOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveExam} className="mt-5 space-y-6 text-xs">
            {/* Linha 1: Paciente e Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Paciente em Atendimento *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (CPF: {p.cpf || '—'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data do Exame
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Linha 2: Acuidade Visual Snellen */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>1. Acuidade Visual (Escala Snellen)</span>
                <span className="text-[11px] text-teal-700 font-normal">
                  OD = Olho Direito • OE = Olho Esquerdo
                </span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    OD Sem Correção (s/c)
                  </label>
                  <select
                    value={avScOd}
                    onChange={(e) => setAvScOd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {['20/15', '20/20', '20/25', '20/30', '20/40', '20/50', '20/60', '20/80', '20/100', '20/200', '20/400'].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    OE Sem Correção (s/c)
                  </label>
                  <select
                    value={avScOe}
                    onChange={(e) => setAvScOe(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {['20/15', '20/20', '20/25', '20/30', '20/40', '20/50', '20/60', '20/80', '20/100', '20/200', '20/400'].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1 text-emerald-700">
                    OD Com Correção (c/c)
                  </label>
                  <select
                    value={avCcOd}
                    onChange={(e) => setAvCcOd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-800"
                  >
                    {['20/15', '20/20', '20/25', '20/30', '20/40', '20/50'].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1 text-emerald-700">
                    OE Com Correção (c/c)
                  </label>
                  <select
                    value={avCcOe}
                    onChange={(e) => setAvCcOe(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-800"
                  >
                    {['20/15', '20/20', '20/25', '20/30', '20/40', '20/50'].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Linha 3: Tabela de Refração OD / OE com Transposição */}
            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-teal-400 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Glasses className="w-4 h-4" />
                  <span>2. Refração Subjetiva & Prescrição Óptica</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  DP Total: {(odDnp + oeDnp).toFixed(1)} mm
                </span>
              </div>

              {/* Bloco OD */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 text-sm">OLHO DIREITO (OD)</span>
                  <button
                    type="button"
                    onClick={() => handleTranspose('OD')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-mono transition-colors"
                    title="Inverte o sinal do cilindro e soma o valor ao esférico"
                  >
                    ⇄ Transpor Cilíndrico
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Esférico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={odSph}
                      onChange={(e) => setOdSph(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Cilíndrico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={odCyl}
                      onChange={(e) => setOdCyl(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Eixo (°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={odAxis}
                      onChange={(e) => setOdAxis(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">DNP (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={odDnp}
                      onChange={(e) => setOdDnp(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Adição (Perto)</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="+0.00"
                      value={odAdd || ''}
                      onChange={(e) => setOdAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco OE */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 text-sm">OLHO ESQUERDO (OE)</span>
                  <button
                    type="button"
                    onClick={() => handleTranspose('OE')}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-mono transition-colors"
                  >
                    ⇄ Transpor Cilíndrico
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Esférico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={oeSph}
                      onChange={(e) => setOeSph(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Cilíndrico (D)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={oeCyl}
                      onChange={(e) => setOeCyl(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Eixo (°)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={oeAxis}
                      onChange={(e) => setOeAxis(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">DNP (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={oeDnp}
                      onChange={(e) => setOeDnp(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Adição (Perto)</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="+0.00"
                      value={oeAdd || ''}
                      onChange={(e) => setOeAdd(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Linha 4: Recomendações e Tratamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Design de Lente Indicada
                </label>
                <select
                  value={lensType}
                  onChange={(e) => setLensType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="monofocal">Monofocal (Visão Simples Longe/Perto)</option>
                  <option value="multifocal">Multifocal / Progressiva Digital</option>
                  <option value="bifocal">Bifocal (Kryptok / Flattop)</option>
                  <option value="lente_contato">Lente de Contato Especializada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tratamentos e Filtros Recomendados
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blueCut}
                      onChange={(e) => setBlueCut(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Filtro Luz Azul</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={antiGlare}
                      onChange={(e) => setAntiGlare(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Antirreflexo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uvProtection}
                      onChange={(e) => setUvProtection(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Proteção UV400</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photochromic}
                      onChange={(e) => setPhotochromic(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Fotossensível</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnóstico Funcional & Observações Clínicas
                </label>
                <input
                  type="text"
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  placeholder="Ex: Astigmatismo miópico com astenopia por esforço visual..."
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>{submitting ? 'Emitindo Receita...' : 'Finalizar Exame e Gerar Receita'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Exames Realizados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-700 font-medium">
            {filteredExams.length} exames registrados
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {exam.patientName}
                  </h3>
                  <span className="text-[11px] text-slate-700 font-medium">
                    Data: {formatDateBR(exam.date)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    Finalizado
                  </span>
                </div>

                {/* Parâmetros Refrativos */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-700 max-w-xl">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-sans font-bold text-teal-700">OD: </span>
                    {exam.subjectiveRefraction.od.spherical >= 0 ? '+' : ''}
                    {exam.subjectiveRefraction.od.spherical.toFixed(2)} ESF /{' '}
                    {exam.subjectiveRefraction.od.cylindrical.toFixed(2)} CIL x{' '}
                    {exam.subjectiveRefraction.od.axis}° (DNP {exam.subjectiveRefraction.od.dnp}mm)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-sans font-bold text-teal-700">OE: </span>
                    {exam.subjectiveRefraction.oe.spherical >= 0 ? '+' : ''}
                    {exam.subjectiveRefraction.oe.spherical.toFixed(2)} ESF /{' '}
                    {exam.subjectiveRefraction.oe.cylindrical.toFixed(2)} CIL x{' '}
                    {exam.subjectiveRefraction.oe.axis}° (DNP {exam.subjectiveRefraction.oe.dnp}mm)
                  </div>
                </div>

                {exam.diagnosisNotes && (
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Diagnóstico: </strong>
                    {exam.diagnosisNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => navigate('/admin/prescricoes')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver Receituário</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
