import React, { useState, useEffect } from 'react';
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
  Plus,
  Shield,
  Edit2,
  Trash2,
} from 'lucide-react';
import { patientsService } from '../../services/patients.service';
import { examsService } from '../../services/exams.service';
import { Patient, Exam } from '../../types';
import { formatDateBR } from '../../utils/formatters';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);
  const [patientExams, setPatientExams] = useState<Exam[]>([]);

  // Novo Paciente Form
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState<'M' | 'F' | 'Outro'>('F');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('Particular');
  const [profession, setProfession] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [wearsGlasses, setWearsGlasses] = useState(true);
  const [wearsContactLenses, setWearsContactLenses] = useState(false);
  const [allergies, setAllergies] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPatients();
    if (searchParams.get('action') === 'novo') {
      setModalOpen(true);
    }
  }, [searchParams]);

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await patientsService.getAll();
      setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenPatientRecord = async (patient: Patient) => {
    setSelectedPatientForView(patient);
    try {
      const exams = await examsService.getByPatientId(patient.id);
      setPatientExams(exams);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    try {
      const created = await patientsService.create({
        name,
        cpf,
        birthDate,
        gender,
        phone,
        email,
        healthInsurance,
        profession,
        anamnesis: {
          chiefComplaint,
          wearsGlasses,
          wearsContactLenses,
          allergies,
          systemicDiseases: [],
        },
      });

      setPatients((prev) => [created, ...prev]);
      setModalOpen(false);
      // Reset form
      setName('');
      setCpf('');
      setPhone('');
      setEmail('');
      setChiefComplaint('');
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAge = (birthDateStr: string) => {
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

  const filtered = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.cpf && p.cpf.includes(term)) ||
      p.phone.includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Pacientes & Prontuários</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Cadastro de pacientes, histórico clínico, refrações e anamnese
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Paciente</span>
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="text-xs text-slate-700 font-medium hidden sm:block">
          Total de {patients.length} pacientes cadastrados
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-700 text-sm">
            Nenhum paciente encontrado com o termo informado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Idade</th>
                  <th className="py-3 px-4">Telefone / Contato</th>
                  <th className="py-3 px-4">Convênio</th>
                  <th className="py-3 px-4">Uso de Lentes/Óculos</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <button
                        onClick={() => handleOpenPatientRecord(patient)}
                        className="text-left text-teal-700 hover:text-teal-900 hover:underline font-bold"
                      >
                        {patient.name}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {patient.cpf || 'Não informado'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {calculateAge(patient.birthDate)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex flex-col">
                        <span>{patient.phone}</span>
                        {patient.email && (
                          <span className="text-[11px] text-slate-700">{patient.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-[11px]">
                        {patient.healthInsurance || 'Particular'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        {patient.anamnesis?.wearsGlasses && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold">
                            Óculos
                          </span>
                        )}
                        {patient.anamnesis?.wearsContactLenses && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-semibold">
                            Lentes Contato
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPatientRecord(patient)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        Prontuário
                      </button>
                      <button
                        onClick={() => navigate(`/admin/exames?patientId=${patient.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        + Exame
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visualizador de Prontuário do Paciente */}
      {selectedPatientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {selectedPatientForView.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedPatientForView.name}
                  </h3>
                  <p className="text-xs text-slate-700">
                    CPF: {selectedPatientForView.cpf || '—'} • {calculateAge(selectedPatientForView.birthDate)} • {selectedPatientForView.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Anamnese */}
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Anamnese & Queixa Principal</span>
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {selectedPatientForView.anamnesis?.chiefComplaint || 'Nenhuma queixa registrada no momento.'}
                </p>
                {selectedPatientForView.anamnesis?.allergies && (
                  <p className="text-rose-600 font-medium">
                    Alergias relatadas: {selectedPatientForView.anamnesis.allergies}
                  </p>
                )}
              </div>

              {/* Histórico de Exames Refrativos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs">
                    Histórico de Refrações & Exames ({patientExams.length})
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

                {patientExams.length === 0 ? (
                  <p className="text-slate-700 py-3 text-center bg-slate-50 rounded-xl">
                    Nenhum exame refrativo registrado para este paciente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patientExams.map((ex) => (
                      <div key={ex.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between font-medium text-slate-800">
                          <span>Data do Exame: {formatDateBR(ex.date)}</span>
                          <span className="text-teal-700 font-semibold">{ex.optometristName}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                          <div>
                            <strong className="text-teal-700 font-sans">OD: </strong>
                            {ex.subjectiveRefraction.od.spherical >= 0 ? '+' : ''}
                            {ex.subjectiveRefraction.od.spherical.toFixed(2)} ESF /{' '}
                            {ex.subjectiveRefraction.od.cylindrical.toFixed(2)} CIL x{' '}
                            {ex.subjectiveRefraction.od.axis}° (AV {ex.subjectiveRefraction.od.visualAcuity || '20/20'})
                          </div>
                          <div>
                            <strong className="text-teal-700 font-sans">OE: </strong>
                            {ex.subjectiveRefraction.oe.spherical >= 0 ? '+' : ''}
                            {ex.subjectiveRefraction.oe.spherical.toFixed(2)} ESF /{' '}
                            {ex.subjectiveRefraction.oe.cylindrical.toFixed(2)} CIL x{' '}
                            {ex.subjectiveRefraction.oe.axis}° (AV {ex.subjectiveRefraction.oe.visualAcuity || '20/20'})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-medium text-xs text-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Paciente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Cadastrar Paciente
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo do paciente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="Outro">Outro / Prefere não dizer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Convênio / Plano
                  </label>
                  <input
                    type="text"
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(e.target.value)}
                    placeholder="Particular, Unimed, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Queixa Principal / Anamnese
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Relato de cefaleia, queixa de astenopia, dificuldade para longe/perto..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={wearsGlasses}
                    onChange={(e) => setWearsGlasses(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Já usa óculos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={wearsContactLenses}
                    onChange={(e) => setWearsContactLenses(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Usa lentes de contato</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
