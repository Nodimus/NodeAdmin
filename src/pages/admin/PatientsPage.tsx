import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
  AlertTriangle,
  Plus,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  Download,
  UserX,
  CheckCircle,
  RefreshCw,
  X,
  ExternalLink,
  Clock,
  MapPin,
  HeartPulse,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { patientsService, FichaCompletaResponse, DossiêLgpdExport } from '../../services/patients.service';
import { examsService } from '../../services/exams.service';
import { useAuth } from '../../contexts/AuthContext';
import { Patient, Exam } from '../../types';
import { formatDateBR } from '../../utils/formatters';

// Validação algorítmica de CPF (11 dígitos e dígitos verificadores)
function validarCPF(cpfStr: string): boolean {
  if (!cpfStr) return false;
  const digits = cpfStr.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

// Formatação visual de CPF
function formatarCPF(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

// Formatação visual de Telefone
function formatarTelefone(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{4})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
}

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();

  // Permissões
  const isAdmin = user?.role === 'admin' || user?.papelId === 'admin';
  const podeLer = isAdmin || hasPermission('pacientes.ler');
  const podeCriar = isAdmin || hasPermission('pacientes.criar');
  const podeEditar = isAdmin || hasPermission('pacientes.editar');
  const podeExcluir = isAdmin || hasPermission('pacientes.excluir');

  // Estados principais
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'desativados' | 'todos'>('ativos');
  const [loading, setLoading] = useState(true);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Modais
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [pacienteEmEdicao, setPacienteEmEdicao] = useState<Patient | null>(null);

  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);
  const [fichaCompleta, setFichaCompleta] = useState<FichaCompletaResponse | null>(null);
  const [abaFichaAtiva, setAbaFichaAtiva] = useState<'cadastral' | 'agendamentos' | 'exames' | 'receitas' | 'lgpd'>('cadastral');
  const [carregandoFicha, setCarregandoFicha] = useState(false);

  // Modal de Confirmação de Desativação
  const [pacienteParaDesativar, setPacienteParaDesativar] = useState<Patient | null>(null);

  // Modal de Anonimização LGPD
  const [pacienteParaAnonimizar, setPacienteParaAnonimizar] = useState<Patient | null>(null);
  const [confirmacaoTextoAnonimizar, setConfirmacaoTextoAnonimizar] = useState('');

  // Modal de Exportação LGPD
  const [dossieExportado, setDossieExportado] = useState<DossiêLgpdExport | null>(null);

  // Formulário Paciente (Criação e Edição)
  const [formName, setFormName] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('1990-01-01');
  const [formGender, setFormGender] = useState<'M' | 'F' | 'Outro'>('F');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formHealthInsurance, setFormHealthInsurance] = useState('Particular');
  const [formProfession, setFormProfession] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formComplement, setFormComplement] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formCity, setFormCity] = useState('São Paulo');
  const [formState, setFormState] = useState('SP');
  const [formZipCode, setFormZipCode] = useState('');
  const [formChiefComplaint, setFormChiefComplaint] = useState('');
  const [formWearsGlasses, setFormWearsGlasses] = useState(false);
  const [formWearsContactLenses, setFormWearsContactLenses] = useState(false);
  const [formAllergies, setFormAllergies] = useState('');
  const [formSystemicDiseases, setFormSystemicDiseases] = useState('');
  const [formConsentimentoLgpd, setFormConsentimentoLgpd] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verificação dinâmica de duplicados no formulário
  const [duplicadosForm, setDuplicadosForm] = useState<Array<{ id: string; name: string; motivo: string }>>([]);

  useEffect(() => {
    loadPatients();
    if (searchParams.get('action') === 'novo' && podeCriar) {
      abrirModalNovo();
    }
  }, [searchParams]);

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await patientsService.getAll('', true);
      setPatients(data);
    } catch (e) {
      console.error('Erro ao carregar pacientes:', e);
    } finally {
      setLoading(false);
    }
  }

  // Checagem em tempo real de duplicidade ao digitar CPF ou Telefone
  useEffect(() => {
    if (!modalCadastroAberto) return;
    const cpfLimpo = formCpf.replace(/\D/g, '');
    const telLimpo = formPhone.replace(/\D/g, '');

    if (cpfLimpo.length === 11 || telLimpo.length >= 10) {
      const timer = setTimeout(async () => {
        try {
          const res = await patientsService.verificarDuplicados(formCpf, formPhone, pacienteEmEdicao?.id);
          if (res.temDuplicados) {
            setDuplicadosForm(res.duplicados);
          } else {
            setDuplicadosForm([]);
          }
        } catch {
          // ignore
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setDuplicadosForm([]);
    }
  }, [formCpf, formPhone, modalCadastroAberto, pacienteEmEdicao]);

  // Abertura do Modal de Novo Paciente
  const abrirModalNovo = () => {
    setPacienteEmEdicao(null);
    setFormName('');
    setFormCpf('');
    setFormBirthDate('1990-01-01');
    setFormGender('F');
    setFormPhone('');
    setFormEmail('');
    setFormHealthInsurance('Particular');
    setFormProfession('');
    setFormStreet('');
    setFormNumber('');
    setFormComplement('');
    setFormNeighborhood('');
    setFormCity('São Paulo');
    setFormState('SP');
    setFormZipCode('');
    setFormChiefComplaint('');
    setFormWearsGlasses(false);
    setFormWearsContactLenses(false);
    setFormAllergies('');
    setFormSystemicDiseases('');
    setFormConsentimentoLgpd(true);
    setFormNotes('');
    setDuplicadosForm([]);
    setMensagemErro('');
    setModalCadastroAberto(true);
  };

  // Abertura do Modal de Edição
  const abrirModalEdicao = (p: Patient) => {
    setPacienteEmEdicao(p);
    setFormName(p.name);
    setFormCpf(p.cpf ? formatarCPF(p.cpf) : '');
    setFormBirthDate(p.birthDate || '1990-01-01');
    setFormGender(p.gender || 'F');
    setFormPhone(p.phone ? formatarTelefone(p.phone) : '');
    setFormEmail(p.email || '');
    setFormHealthInsurance(p.healthInsurance || 'Particular');
    setFormProfession(p.profession || '');
    setFormStreet(p.address?.street || '');
    setFormNumber(p.address?.number || '');
    setFormComplement(p.address?.complement || '');
    setFormNeighborhood(p.address?.neighborhood || '');
    setFormCity(p.address?.city || 'São Paulo');
    setFormState(p.address?.state || 'SP');
    setFormZipCode(p.address?.zipCode || '');
    setFormChiefComplaint(p.anamnesis?.chiefComplaint || '');
    setFormWearsGlasses(Boolean(p.anamnesis?.wearsGlasses));
    setFormWearsContactLenses(Boolean(p.anamnesis?.wearsContactLenses));
    setFormAllergies(p.anamnesis?.allergies || '');
    setFormSystemicDiseases(p.anamnesis?.systemicDiseases?.join(', ') || '');
    setFormConsentimentoLgpd(p.consentimentoLgpd?.aceito !== false);
    setFormNotes(p.notes || '');
    setDuplicadosForm([]);
    setMensagemErro('');
    setModalCadastroAberto(true);
  };

  // Salvar Paciente (Criação ou Edição)
  const handleSalvarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setMensagemErro('Nome completo e Telefone são campos obrigatórios.');
      return;
    }

    if (formCpf.trim() && !validarCPF(formCpf)) {
      setMensagemErro('CPF inválido. Por favor, corrija os dígitos verificadores do documento.');
      return;
    }

    setSubmitting(true);
    setMensagemErro('');

    const dadosPayload = {
      name: formName.trim(),
      cpf: formCpf.trim() ? formCpf.trim() : undefined,
      birthDate: formBirthDate,
      gender: formGender,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      healthInsurance: formHealthInsurance.trim() || 'Particular',
      profession: formProfession.trim() || undefined,
      address: {
        street: formStreet.trim(),
        number: formNumber.trim(),
        complement: formComplement.trim() || undefined,
        neighborhood: formNeighborhood.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        zipCode: formZipCode.trim() || undefined,
      },
      anamnesis: {
        chiefComplaint: formChiefComplaint.trim() || undefined,
        wearsGlasses: formWearsGlasses,
        wearsContactLenses: formWearsContactLenses,
        allergies: formAllergies.trim() || undefined,
        systemicDiseases: formSystemicDiseases ? formSystemicDiseases.split(',').map((s) => s.trim()).filter(Boolean) : [],
      },
      consentimentoLgpd: {
        aceito: formConsentimentoLgpd,
        dataHora: new Date().toISOString(),
        versao: '1.0',
        canal: 'presencial',
      },
      notes: formNotes.trim() || undefined,
    };

    try {
      if (pacienteEmEdicao) {
        await patientsService.update(pacienteEmEdicao.id, dadosPayload);
        setMensagemSucesso(`Prontuário de ${formName} atualizado com sucesso.`);
      } else {
        await patientsService.create(dadosPayload, true);
        setMensagemSucesso(`Paciente ${formName} cadastrado com sucesso.`);
      }

      setModalCadastroAberto(false);
      await loadPatients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar paciente.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Ficha Completa do Paciente
  const handleOpenPatientRecord = async (patient: Patient) => {
    setSelectedPatientForView(patient);
    setAbaFichaAtiva('cadastral');
    setCarregandoFicha(true);
    try {
      const ficha = await patientsService.getFichaCompleta(patient.id);
      setFichaCompleta(ficha);
    } catch (e) {
      console.error('Erro ao carregar prontuário completo:', e);
    } finally {
      setCarregandoFicha(false);
    }
  };

  // Desativar Paciente ("Desative em vez de excluir")
  const handleConfirmarDesativacao = async () => {
    if (!pacienteParaDesativar || !podeExcluir) return;
    setSubmitting(true);
    try {
      await patientsService.deactivate(pacienteParaDesativar.id);
      setMensagemSucesso(`Paciente "${pacienteParaDesativar.name}" foi desativado. Seu histórico clínico permanece arquivado com segurança.`);
      setPacienteParaDesativar(null);
      await loadPatients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao desativar paciente.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reativar Paciente
  const handleReativarPaciente = async (patient: Patient) => {
    if (!podeEditar) return;
    try {
      await patientsService.reactivate(patient.id);
      setMensagemSucesso(`Paciente "${patient.name}" foi reativado com sucesso.`);
      await loadPatients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reativar paciente.';
      setMensagemErro(msg);
    }
  };

  // Exportar Prontuário LGPD (Apenas Admin)
  const handleExportarLgpd = async (pId: string) => {
    if (!isAdmin) {
      setMensagemErro('Apenas administradores podem exportar prontuários completos de pacientes conforme a LGPD.');
      return;
    }
    setSubmitting(true);
    try {
      const dossie = await patientsService.exportData(pId);
      setDossieExportado(dossie);
      setMensagemSucesso('Dossiê de dados pessoais e prontuário exportado com sucesso.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na exportação de dados.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Anonimizar Paciente LGPD (Apenas Admin)
  const handleConfirmarAnonimizacao = async () => {
    if (!pacienteParaAnonimizar || !isAdmin) return;
    if (confirmacaoTextoAnonimizar.trim().toUpperCase() !== 'CONFIRMAR') {
      setMensagemErro('Digite exatamente a palavra CONFIRMAR para autorizar a anonimização irreversível.');
      return;
    }

    setSubmitting(true);
    setMensagemErro('');
    try {
      await patientsService.anonymize(pacienteParaAnonimizar.id, true);
      setMensagemSucesso(`Dados pessoais do paciente foram anonimizados conforme Art. 16 da LGPD.`);
      setPacienteParaAnonimizar(null);
      setConfirmacaoTextoAnonimizar('');
      if (selectedPatientForView?.id === pacienteParaAnonimizar.id) {
        setSelectedPatientForView(null);
      }
      await loadPatients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao anonimizar paciente.';
      setMensagemErro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  // Filtro de Busca e Status
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Filtro de status
      if (filtroStatus === 'ativos' && p.ativo === false) return false;
      if (filtroStatus === 'desativados' && p.ativo !== false) return false;

      // Busca textual
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const termDigitos = searchTerm.replace(/\D/g, '');

      const matchNome = p.name.toLowerCase().includes(term);
      const matchCpf = p.cpf
        ? p.cpf.toLowerCase().includes(term) || (termDigitos && p.cpf.replace(/\D/g, '').includes(termDigitos))
        : false;
      const matchPhone = p.phone
        ? p.phone.includes(term) || (termDigitos && p.phone.replace(/\D/g, '').includes(termDigitos))
        : false;
      const matchEmail = p.email ? p.email.toLowerCase().includes(term) : false;

      return matchNome || matchCpf || matchPhone || matchEmail;
    });
  }, [patients, searchTerm, filtroStatus]);

  if (!podeLer) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm my-10">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito ao Módulo de Pacientes</h2>
        <p className="text-slate-600 text-xs leading-relaxed">
          Seu perfil de usuário atual não possui a permissão necessária (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono">pacientes.ler</code>) para visualizar a lista ou fichas de prontuário dos pacientes. Solicite permissão a um Administrador do consultório.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Mensagens de Sucesso e Erro */}
      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{mensagemErro}</span>
          </div>
          <button onClick={() => setMensagemErro('')} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Pacientes & Prontuários</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Cadastro de pacientes, histórico clínico, refrações, receitas e governança LGPD
          </p>
        </div>

        {podeCriar && (
          <button
            onClick={abrirModalNovo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Paciente</span>
          </button>
        )}
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1">Status:</span>
          {(['ativos', 'desativados', 'todos'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                filtroStatus === st
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="text-xs text-slate-500 font-medium ml-2 hidden lg:inline">
            ({filteredPatients.length} exibidos)
          </span>
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Carregando pacientes e prontuários...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Nenhum paciente encontrado.</p>
            <p className="text-slate-500">Tente ajustar o termo de pesquisa ou o filtro de status acima.</p>
          </div>
        ) : (
          <>
            {/* Versão Desktop (>= 1024px inalterada): Tabela completa */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Idade</th>
                    <th className="py-3 px-4">Telefone / Contato</th>
                    <th className="py-3 px-4">Convênio</th>
                    <th className="py-3 px-4">Status & LGPD</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => {
                    const isAnonimo = Boolean(patient.anonimizado);
                    const isDesativado = patient.ativo === false && !isAnonimo;
                    const lgpdAceito = patient.consentimentoLgpd?.aceito !== false;

                    return (
                      <tr
                        key={patient.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isDesativado ? 'bg-slate-50/60 opacity-75' : ''
                        } ${isAnonimo ? 'bg-purple-50/30' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <button
                            onClick={() => handleOpenPatientRecord(patient)}
                            className="text-left text-teal-700 hover:text-teal-900 hover:underline font-bold flex items-center gap-2 group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                              {patient.name.charAt(0)}
                            </div>
                            <span>{patient.name}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          {patient.cpf ? formatarCPF(patient.cpf) : 'Não informado'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          {calculateAge(patient.birthDate)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {patient.phone ? formatarTelefone(patient.phone) : '—'}
                            </span>
                            {patient.email && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {patient.email}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-[11px] text-slate-700">
                            {patient.healthInsurance || 'Particular'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex flex-col gap-1 items-start">
                            {isAnonimo ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Anonimizado LGPD
                              </span>
                            ) : isDesativado ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Desativado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Ativo
                              </span>
                            )}

                            {lgpdAceito && !isAnonimo && (
                              <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium" title="Consentimento de tratamento de dados de saúde registrado">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                LGPD v{patient.consentimentoLgpd?.versao || '1.0'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenPatientRecord(patient)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ver Prontuário Completo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ficha</span>
                            </button>

                            {podeEditar && !isAnonimo && (
                              <button
                                onClick={() => abrirModalEdicao(patient)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar Dados Cadastrais"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {isDesativado && podeEditar && !isAnonimo && (
                              <button
                                onClick={() => handleReativarPaciente(patient)}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                title="Reativar Paciente"
                              >
                                Reativar
                              </button>
                            )}

                            {!isDesativado && !isAnonimo && podeExcluir && (
                              <button
                                onClick={() => setPacienteParaDesativar(patient)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Desativar Paciente (Sem excluir histórico clínico)"
                              >
                                <UserX className="w-4 h-4" />
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

            {/* Versão Mobile (< 1024px): Lista de Cards com alvos de toque >= 44px */}
            <div className="lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredPatients.map((patient) => {
                const isAnonimo = Boolean(patient.anonimizado);
                const isDesativado = patient.ativo === false && !isAnonimo;
                const lgpdAceito = patient.consentimentoLgpd?.aceito !== false;

                return (
                  <div
                    key={`mobile-${patient.id}`}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDesativado
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : isAnonimo
                        ? 'bg-purple-50/40 border-purple-200'
                        : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenPatientRecord(patient)}
                            className="text-left font-bold text-sm text-slate-900 hover:text-teal-700"
                          >
                            {patient.name}
                          </button>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {patient.cpf ? formatarCPF(patient.cpf) : 'CPF não informado'} • {calculateAge(patient.birthDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {isAnonimo ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                            LGPD
                          </span>
                        ) : isDesativado ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Inativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato</span>
                        <a
                          href={patient.phone ? `tel:${patient.phone.replace(/\D/g, '')}` : undefined}
                          className="font-medium text-teal-700 hover:underline flex items-center gap-1 mt-0.5 min-h-[30px]"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{patient.phone ? formatarTelefone(patient.phone) : '—'}</span>
                        </a>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Convênio</span>
                        <span className="font-medium text-slate-700 block mt-0.5 truncate">
                          {patient.healthInsurance || 'Particular'}
                        </span>
                      </div>
                    </div>

                    {/* Ações Mobile com toque >= 44px */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPatientRecord(patient)}
                        className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Prontuário</span>
                      </button>

                      {podeEditar && !isAnonimo && (
                        <button
                          onClick={() => abrirModalEdicao(patient)}
                          className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                          title="Editar"
                          aria-label="Editar Paciente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {!isDesativado && !isAnonimo && podeExcluir && (
                        <button
                          onClick={() => setPacienteParaDesativar(patient)}
                          className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                          title="Desativar"
                          aria-label="Desativar Paciente"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}

                      {isDesativado && podeEditar && !isAnonimo && (
                        <button
                          onClick={() => handleReativarPaciente(patient)}
                          className="min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center justify-center cursor-pointer"
                        >
                          Reativar
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

      {/* ========================================================================= */}
      {/* MODAL 1: FICHA COMPLETA DO PACIENTE COM HISTÓRICO CLÍNICO                 */}
      {/* ========================================================================= */}
      {selectedPatientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in zoom-in-95">
            {/* Header da Ficha */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-600/20">
                  {selectedPatientForView.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {selectedPatientForView.name}
                    </h3>
                    {selectedPatientForView.anonimizado ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                        Anonimizado LGPD
                      </span>
                    ) : selectedPatientForView.ativo === false ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Desativado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    CPF: {selectedPatientForView.cpf ? formatarCPF(selectedPatientForView.cpf) : 'Não informado'} •{' '}
                    {calculateAge(selectedPatientForView.birthDate)} • {selectedPatientForView.phone ? formatarTelefone(selectedPatientForView.phone) : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-1 border-b border-slate-200 py-2.5 overflow-x-auto text-xs shrink-0">
              <button
                onClick={() => setAbaFichaAtiva('cadastral')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  abaFichaAtiva === 'cadastral'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dados Cadastrais & LGPD
              </button>
              <button
                onClick={() => setAbaFichaAtiva('agendamentos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  abaFichaAtiva === 'agendamentos'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Histórico de Consultas ({fichaCompleta?.historicoAgendamentos?.length || 0})
              </button>
              <button
                onClick={() => setAbaFichaAtiva('exames')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  abaFichaAtiva === 'exames'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Refrações & Exames ({fichaCompleta?.historicoAtendimentos?.length || 0})
              </button>
              <button
                onClick={() => setAbaFichaAtiva('receitas')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  abaFichaAtiva === 'receitas'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Receitas Ópticas ({fichaCompleta?.historicoReceitas?.length || 0})
              </button>
              {isAdmin && (
                <button
                  onClick={() => setAbaFichaAtiva('lgpd')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    abaFichaAtiva === 'lgpd'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  Governança LGPD (Admin)
                </button>
              )}
            </div>

            {/* Conteúdo da Ficha */}
            <div className="flex-1 overflow-y-auto py-4 text-xs space-y-4">
              {carregandoFicha ? (
                <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  <span>Carregando prontuário...</span>
                </div>
              ) : abaFichaAtiva === 'cadastral' ? (
                /* 1. DADOS CADASTRAIS & LGPD */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>Identificação Civil</span>
                      </h4>
                      <p><strong className="text-slate-700">Nome:</strong> {selectedPatientForView.name}</p>
                      <p><strong className="text-slate-700">CPF:</strong> {selectedPatientForView.cpf ? formatarCPF(selectedPatientForView.cpf) : 'Não informado'}</p>
                      <p><strong className="text-slate-700">Nascimento:</strong> {formatDateBR(selectedPatientForView.birthDate)} ({calculateAge(selectedPatientForView.birthDate)})</p>
                      <p><strong className="text-slate-700">Gênero:</strong> {selectedPatientForView.gender || 'F'}</p>
                      <p><strong className="text-slate-700">Profissão:</strong> {selectedPatientForView.profession || 'Não informada'}</p>
                      <p><strong className="text-slate-700">Convênio / Plano:</strong> {selectedPatientForView.healthInsurance || 'Particular'}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>Endereço & Contato</span>
                      </h4>
                      <p><strong className="text-slate-700">Telefone:</strong> {selectedPatientForView.phone ? formatarTelefone(selectedPatientForView.phone) : '—'}</p>
                      <p><strong className="text-slate-700">E-mail:</strong> {selectedPatientForView.email || 'Não informado'}</p>
                      <p>
                        <strong className="text-slate-700">Endereço:</strong>{' '}
                        {selectedPatientForView.address?.street
                          ? `${selectedPatientForView.address.street}, ${selectedPatientForView.address.number || 'S/N'}${
                              selectedPatientForView.address.complement ? ` - ${selectedPatientForView.address.complement}` : ''
                            }, ${selectedPatientForView.address.neighborhood || ''}, ${
                              selectedPatientForView.address.city || 'São Paulo'
                            }/${selectedPatientForView.address.state || 'SP'}`
                          : 'Endereço não cadastrado'}
                      </p>
                      {selectedPatientForView.address?.zipCode && (
                        <p><strong className="text-slate-700">CEP:</strong> {selectedPatientForView.address.zipCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Anamnese & Queixa */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Anamnese & Queixa Principal</span>
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedPatientForView.anamnesis?.chiefComplaint || 'Nenhuma queixa inicial registrada.'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedPatientForView.anamnesis?.wearsGlasses && (
                        <span className="px-2.5 py-1 rounded-lg bg-teal-100/70 text-teal-800 font-semibold text-[11px]">
                          Já usa óculos
                        </span>
                      )}
                      {selectedPatientForView.anamnesis?.wearsContactLenses && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-100/70 text-cyan-800 font-semibold text-[11px]">
                          Usa lentes de contato
                        </span>
                      )}
                      {selectedPatientForView.anamnesis?.allergies && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100/70 text-rose-800 font-semibold text-[11px]">
                          Alergias: {selectedPatientForView.anamnesis.allergies}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Registro de Consentimento LGPD */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                    <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Governança de Privacidade & Consentimento LGPD</span>
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      O paciente manifestou consentimento expresso e inequívoco para tratamento de dados pessoais e de saúde estritamente para assistência optométrica primária, conforme os Artigos 7º, I e 11, II da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-white rounded-xl border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">Status:</span>
                        <strong className="text-emerald-700">Consentimento Ativo</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">Versão da Política:</span>
                        <strong className="text-slate-800">{selectedPatientForView.consentimentoLgpd?.versao || 'v1.0'}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">Canal de Coleta:</span>
                        <strong className="text-slate-800 capitalize">{selectedPatientForView.consentimentoLgpd?.canal || 'Presencial'}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-emerald-200">
                        <span className="text-slate-500 block text-[10px]">Data do Aceite:</span>
                        <strong className="text-slate-800">
                          {selectedPatientForView.consentimentoLgpd?.dataHora
                            ? formatDateBR(selectedPatientForView.consentimentoLgpd.dataHora.split('T')[0])
                            : '2026-01-10'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : abaFichaAtiva === 'agendamentos' ? (
                /* 2. HISTÓRICO DE AGENDAMENTOS */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Histórico de Consultas & Agendamentos
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedPatientForView(null);
                        navigate('/admin/agenda');
                      }}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      + Novo Agendamento na Agenda
                    </button>
                  </div>

                  {!fichaCompleta?.historicoAgendamentos || fichaCompleta.historicoAgendamentos.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      Nenhum agendamento vinculado a este paciente até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fichaCompleta.historicoAgendamentos.map((apt: any) => (
                        <div key={apt.id || Math.random()} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{formatDateBR(apt.data || apt.date)} às {apt.horario || apt.time}</span>
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-semibold">
                                {apt.status || 'confirmado'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Serviço: {apt.servicoNome || apt.serviceName || 'Consulta Optométrica Completa'}
                            </p>
                            {apt.observacoes && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Obs: {apt.observacoes}
                              </p>
                            )}
                          </div>
                          {apt.protocolo && (
                            <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                              {apt.protocolo}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : abaFichaAtiva === 'exames' ? (
                /* 3. HISTÓRICO DE EXAMES / ATENDIMENTOS */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Histórico de Refrações & Exames Optométricos
                    </h4>
                    <button
                      onClick={() => {
                        const id = selectedPatientForView.id;
                        setSelectedPatientForView(null);
                        navigate(`/admin/exames?patientId=${id}`);
                      }}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      + Novo Exame
                    </button>
                  </div>

                  {!fichaCompleta?.historicoAtendimentos || fichaCompleta.historicoAtendimentos.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      Nenhum exame refrativo registrado para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fichaCompleta.historicoAtendimentos.map((ex: any) => (
                        <div key={ex.id || Math.random()} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center font-medium text-slate-800">
                            <span className="font-bold">Data: {formatDateBR(ex.data)} — {ex.tipo || 'Exame de Refração'}</span>
                            <span className="text-teal-700 font-semibold">{ex.optometristaNome || 'Dr. Roberto Viana'}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                            <p><strong className="text-teal-700 font-sans">Diagnóstico:</strong> {ex.diagnosticoRefrativo || 'Miopia com Astigmatismo'}</p>
                            <p><strong className="text-teal-700 font-sans">Acuidade Visual:</strong> OD {ex.acuidadeVisualOD || '20/20'} • OE {ex.acuidadeVisualOE || '20/20'}</p>
                            {ex.observacoes && <p className="text-slate-600 font-sans pt-1">Notas: {ex.observacoes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : abaFichaAtiva === 'receitas' ? (
                /* 4. HISTÓRICO DE RECEITAS */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Receitas Ópticas Emitidas
                    </h4>
                  </div>

                  {!fichaCompleta?.historicoReceitas || fichaCompleta.historicoReceitas.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      Nenhuma receita óptica emitida para este paciente até o momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fichaCompleta.historicoReceitas.map((rec: any) => (
                        <div key={rec.id || Math.random()} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-bold text-slate-900">Prescrição de Lentes Oftálmicas</h5>
                              <span className="text-slate-500 text-[11px]">Emitida em {formatDateBR(rec.data)} • Validade: {formatDateBR(rec.validade)}</span>
                            </div>
                            <span className="text-teal-700 font-bold text-xs">{rec.optometristaNome} ({rec.registroProfissional})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <strong className="text-teal-700 font-sans block mb-1">Olho Direito (OD):</strong>
                              <span>Esf: {rec.od?.esferico >= 0 ? '+' : ''}{rec.od?.esferico?.toFixed(2)} | Cil: {rec.od?.cilindrico?.toFixed(2)} | Eixo: {rec.od?.eixo}° | DNP: {rec.od?.dnp}mm</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <strong className="text-teal-700 font-sans block mb-1">Olho Esquerdo (OE):</strong>
                              <span>Esf: {rec.oe?.esferico >= 0 ? '+' : ''}{rec.oe?.esferico?.toFixed(2)} | Cil: {rec.oe?.cilindrico?.toFixed(2)} | Eixo: {rec.oe?.eixo}° | DNP: {rec.oe?.dnp}mm</span>
                            </div>
                          </div>

                          {rec.tipoLente && (
                            <p className="text-[11px] text-slate-700">
                              <strong className="text-slate-900">Recomendação de Lentes:</strong> {rec.tipoLente}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* 5. GOVERNANÇA LGPD (Apenas Admin) */
                <div className="space-y-4 p-2">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                    <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-700" />
                      <span>Painel de Direitos do Titular LGPD (Apenas Administrador)</span>
                    </h4>
                    <p className="text-purple-800 text-xs leading-relaxed">
                      Ferramentas exclusivas para o Administrador do consultório atender solicitações do paciente titular de dados, com auditoria estrita registrada no sistema.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleExportarLgpd(selectedPatientForView.id)}
                        disabled={submitting}
                        className="p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-400 text-left space-y-1 transition-all cursor-pointer shadow-xs hover:shadow-md"
                      >
                        <div className="flex items-center justify-between text-purple-900 font-bold">
                          <span>Exportar Dossiê (Art. 18)</span>
                          <Download className="w-4 h-4 text-purple-700" />
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Gera arquivo JSON estruturado contendo todos os dados cadastrais, agendamentos e prontuários.
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setPacienteParaAnonimizar(selectedPatientForView);
                          setConfirmacaoTextoAnonimizar('');
                        }}
                        disabled={submitting || selectedPatientForView.anonimizado}
                        className="p-4 bg-white rounded-xl border border-rose-200 hover:border-rose-400 text-left space-y-1 transition-all cursor-pointer shadow-xs hover:shadow-md"
                      >
                        <div className="flex items-center justify-between text-rose-900 font-bold">
                          <span>Anonimizar Dados (Art. 16)</span>
                          <UserX className="w-4 h-4 text-rose-700" />
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Substitui nomes, CPF, e-mail e telefone por hashes irreversíveis, preservando apenas dados clínicos desidentificados.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé da Ficha */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                ID do Prontuário: {selectedPatientForView.id}
              </span>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CADASTRO / EDIÇÃO DE PACIENTE (COM VALIDAÇÃO DE CPF & LGPD)       */}
      {/* ========================================================================= */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>{pacienteEmEdicao ? `Editar Prontuário: ${pacienteEmEdicao.name}` : 'Cadastrar Novo Paciente'}</span>
              </h3>
              <button onClick={() => setModalCadastroAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPaciente} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {/* Alerta de duplicados em tempo real */}
              {duplicadosForm.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Atenção: Possível cadastro duplicado detectado!</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Já existe(m) paciente(s) com este telefone ou CPF:
                  </p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {duplicadosForm.map((d) => (
                      <li key={d.id}>
                        <strong>{d.name}</strong> — {d.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Seção 1: Identificação Básica */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome completo do paciente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    CPF (Validação Oficial)
                  </label>
                  <input
                    type="text"
                    value={formCpf}
                    onChange={(e) => setFormCpf(formatarCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:bg-white focus:outline-none ${
                      formCpf && !validarCPF(formCpf)
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-slate-200 bg-slate-50 focus:border-teal-500'
                    }`}
                  />
                  {formCpf && !validarCPF(formCpf) && (
                    <span className="text-[10px] text-rose-600 block mt-0.5">Dígitos de CPF inválidos</span>
                  )}
                  {formCpf && validarCPF(formCpf) && (
                    <span className="text-[10px] text-emerald-600 block mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 inline" /> CPF válido
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gênero
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="Outro">Outro / Prefere não dizer</option>
                  </select>
                </div>
              </div>

              {/* Seção 2: Contato e Convênio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(formatarTelefone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="paciente@exemplo.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Convênio / Plano
                  </label>
                  <input
                    type="text"
                    value={formHealthInsurance}
                    onChange={(e) => setFormHealthInsurance(e.target.value)}
                    placeholder="Particular, Unimed, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
              </div>

              {/* Seção 3: Endereço */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Endereço Residencial
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-600 mb-0.5">Logradouro / Rua</label>
                    <input
                      type="text"
                      value={formStreet}
                      onChange={(e) => setFormStreet(e.target.value)}
                      placeholder="Av. Paulista, Rua ..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Número</label>
                    <input
                      type="text"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Bairro</label>
                    <input
                      type="text"
                      value={formNeighborhood}
                      onChange={(e) => setFormNeighborhood(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Cidade</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">CEP</label>
                    <input
                      type="text"
                      value={formZipCode}
                      onChange={(e) => setFormZipCode(e.target.value)}
                      placeholder="01310-100"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Anamnese e Dados Clínicos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Queixa Principal / Motivo da Consulta
                </label>
                <textarea
                  rows={2}
                  value={formChiefComplaint}
                  onChange={(e) => setFormChiefComplaint(e.target.value)}
                  placeholder="Relato de dor de cabeça, dificuldade para perto/longe, ardência ocular..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formWearsGlasses}
                    onChange={(e) => setFormWearsGlasses(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-800">Já usa óculos de grau</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formWearsContactLenses}
                    onChange={(e) => setFormWearsContactLenses(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-800">Usa lentes de contato</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alergias relatadas
                  </label>
                  <input
                    type="text"
                    value={formAllergies}
                    onChange={(e) => setFormAllergies(e.target.value)}
                    placeholder="Colírios, poeira, pólen, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Doenças Sistêmicas
                  </label>
                  <input
                    type="text"
                    value={formSystemicDiseases}
                    onChange={(e) => setFormSystemicDiseases(e.target.value)}
                    placeholder="Diabetes, hipertensão, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* Seção 5: Termo de Consentimento LGPD */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formConsentimentoLgpd}
                    onChange={(e) => setFormConsentimentoLgpd(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-emerald-950 block">Termo de Consentimento LGPD (Obrigatório):</strong>
                    Declaro que o paciente autorizou expressamente o tratamento dos seus dados cadastrais e de saúde visual para fins de prontuário clínico e contato do consultório, em conformidade com a LGPD (Lei nº 13.709/2018).
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalCadastroAberto(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? 'Salvando...' : pacienteEmEdicao ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMAÇÃO DE DESATIVAÇÃO ("Desative em vez de excluir")         */}
      {/* ========================================================================= */}
      {pacienteParaDesativar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Desativar Paciente</h3>
                <span className="text-xs text-slate-500">Política de arquivamento médico</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Deseja desativar o cadastro de <strong className="text-slate-900">{pacienteParaDesativar.name}</strong>?
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p>
                <strong>Regra deontológica e legal:</strong> O histórico clínico, exames refrativos e receitas emitidas NÃO serão apagados fisicamente, permanecendo resguardados sob sigilo profissional.
              </p>
              <p>O paciente poderá ser reativado a qualquer momento caso retorne ao consultório.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPacienteParaDesativar(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmarDesativacao}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {submitting ? 'Desativando...' : 'Confirmar Desativação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRMAÇÃO DE ANONIMIZAÇÃO LGPD (APENAS ADMIN)                   */}
      {/* ========================================================================= */}
      {pacienteParaAnonimizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Anonimização Irreversível de Dados (LGPD)</h3>
                <span className="text-xs text-rose-600 font-semibold">Ação exclusiva do Administrador</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200 text-rose-950 text-xs space-y-2">
              <p className="font-semibold">
                Você está prestes a anonimizar os dados pessoais de "{pacienteParaAnonimizar.name}".
              </p>
              <p className="text-[11px] leading-relaxed">
                Conforme o Artigo 16 da LGPD, o nome, CPF, telefone, e-mail e endereço civil serão permanentemente substituídos por registros anônimos. Esta operação é <strong>irreversível</strong> e registrada com timestamp e IP na trilha de auditoria.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Para autorizar, digite a palavra <strong className="text-rose-700">CONFIRMAR</strong> abaixo:
              </label>
              <input
                type="text"
                value={confirmacaoTextoAnonimizar}
                onChange={(e) => setConfirmacaoTextoAnonimizar(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono font-bold"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPacienteParaAnonimizar(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting || confirmacaoTextoAnonimizar.trim().toUpperCase() !== 'CONFIRMAR'}
                onClick={handleConfirmarAnonimizacao}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? 'Anonimizando...' : 'Anonimizar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VISUALIZADOR DE DOSSIÊ LGPD EXPORTADO                             */}
      {/* ========================================================================= */}
      {dossieExportado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Dossiê de Portabilidade LGPD (Art. 18)</h3>
                  <span className="text-xs text-slate-500">Prontuário completo gerado para exportação</span>
                </div>
              </div>
              <button onClick={() => setDossieExportado(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <p className="text-slate-600">
                Arquivo de exportação contendo o registro integral do paciente titular <strong>{dossieExportado.paciente.name}</strong>, incluindo dados cadastrais, histórico de consultas e consentimentos legais.
              </p>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-72">
                {JSON.stringify(dossieExportado, null, 2)}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(dossieExportado, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dossie-paciente-${dossieExportado.paciente.id}-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo JSON do Dossiê</span>
              </button>

              <button
                type="button"
                onClick={() => setDossieExportado(null)}
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
