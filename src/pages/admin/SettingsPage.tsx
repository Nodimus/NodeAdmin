import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Building,
  CheckCircle2,
  Shield,
  Save,
  Download,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { isFirebaseConfigured } from '../../services/firebase';
import { patientsService } from '../../services/patients.service';
import { examsService } from '../../services/exams.service';
import { appointmentsService } from '../../services/appointments.service';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { consultorio, atualizarConsultorio } = useConsultorio();

  // Estados dos campos do Consultório Único
  const [razaoSocial, setRazaoSocial] = useState(consultorio.razaoSocial);
  const [nomeFantasia, setNomeFantasia] = useState(consultorio.nomeFantasia);
  const [cnpj, setCnpj] = useState(consultorio.cnpj);
  const [registroProfissional, setRegistroProfissional] = useState(consultorio.registroProfissional);
  const [responsavelTecnico, setResponsavelTecnico] = useState(consultorio.responsavelTecnico);
  const [registroResponsavelTecnico, setRegistroResponsavelTecnico] = useState(consultorio.registroResponsavelTecnico);
  const [telefone, setTelefone] = useState(consultorio.telefone);
  const [whatsapp, setWhatsapp] = useState(consultorio.whatsapp);
  const [email, setEmail] = useState(consultorio.email);

  // Endereço
  const [logradouro, setLogradouro] = useState(consultorio.endereco.logradouro);
  const [numero, setNumero] = useState(consultorio.endereco.numero);
  const [complemento, setComplemento] = useState(consultorio.endereco.complemento || '');
  const [bairro, setBairro] = useState(consultorio.endereco.bairro);
  const [cidade, setCidade] = useState(consultorio.endereco.cidade);
  const [uf, setUf] = useState(consultorio.endereco.uf);
  const [cep, setCep] = useState(consultorio.endereco.cep);

  // Horários e Redes
  const [horarioFuncionamento, setHorarioFuncionamento] = useState(consultorio.horarioFuncionamento || '');
  const [instagram, setInstagram] = useState(consultorio.redesSociais?.instagram || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setRazaoSocial(consultorio.razaoSocial);
    setNomeFantasia(consultorio.nomeFantasia);
    setCnpj(consultorio.cnpj);
    setRegistroProfissional(consultorio.registroProfissional);
    setResponsavelTecnico(consultorio.responsavelTecnico);
    setRegistroResponsavelTecnico(consultorio.registroResponsavelTecnico);
    setTelefone(consultorio.telefone);
    setWhatsapp(consultorio.whatsapp);
    setEmail(consultorio.email);
    setLogradouro(consultorio.endereco.logradouro);
    setNumero(consultorio.endereco.numero);
    setComplemento(consultorio.endereco.complemento || '');
    setBairro(consultorio.endereco.bairro);
    setCidade(consultorio.endereco.cidade);
    setUf(consultorio.endereco.uf);
    setCep(consultorio.endereco.cep);
    setHorarioFuncionamento(consultorio.horarioFuncionamento || '');
    setInstagram(consultorio.redesSociais?.instagram || '');
  }, [consultorio]);

  const handleSaveConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await atualizarConsultorio({
        razaoSocial,
        nomeFantasia,
        cnpj,
        registroProfissional,
        responsavelTecnico,
        registroResponsavelTecnico,
        telefone,
        whatsapp,
        email,
        endereco: {
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          cep,
        },
        horarioFuncionamento,
        redesSociais: {
          instagram,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar dados do consultório:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const [patients, exams, appointments] = await Promise.all([
        patientsService.getAll(),
        examsService.getAll(),
        appointmentsService.getAll(),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        consultorio,
        stats: {
          patientsCount: patients.length,
          examsCount: exams.length,
          appointmentsCount: appointments.length,
        },
        patients,
        exams,
        appointments,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_consultorio_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>Dados do Consultório (Registro Único)</span>
        </h1>
        <p className="text-xs text-slate-700 mt-0.5">
          Todos os nomes, contatos, cabeçalhos de receitas e informações institucionais vêm deste registro.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Dados do consultório atualizados com sucesso no sistema!</span>
        </div>
      )}

      {/* Formulário de Edição do Consultório Único */}
      <form onSubmit={handleSaveConsultorio} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
        {/* Identificação */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            <span>Identificação e Razão Social</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nome Fantasia do Consultório *
              </label>
              <input
                type="text"
                required
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registro do Consultório (CBOO / CROO)
              </label>
              <input
                type="text"
                value={registroProfissional}
                onChange={(e) => setRegistroProfissional(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Responsável Técnico */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Responsável Técnico (Optometrista)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nome do Responsável Técnico
              </label>
              <input
                type="text"
                value={responsavelTecnico}
                onChange={(e) => setResponsavelTecnico(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registro Profissional do RT (CBO 3223-05 / CBOO)
              </label>
              <input
                type="text"
                value={registroResponsavelTecnico}
                onChange={(e) => setRegistroResponsavelTecnico(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Contatos */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Phone className="w-4 h-4 text-teal-600" />
            <span>Canais de Atendimento</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Telefone Fixo
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                WhatsApp Oficial
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Endereço do Gabinete</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Logradouro (Rua/Avenida)</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Complemento / Sala</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cidade / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
                <input
                  type="text"
                  value={uf}
                  maxLength={2}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="w-16 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Horários */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Horário de Funcionamento & Redes</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                value={horarioFuncionamento}
                onChange={(e) => setHorarioFuncionamento(e.target.value)}
                placeholder="Ex: Seg a Sex: 08:00 às 18:00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@consultorio.optometria"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-end border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Gravando...' : 'Salvar Dados do Consultório'}</span>
          </button>
        </div>
      </form>

      {/* Bloco: Status do Firebase */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Infraestrutura do Banco de Dados</span>
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isFirebaseConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-cyan-100 text-cyan-800'
            }`}
          >
            {isFirebaseConfigured ? 'Firebase Conectado' : 'Modo Local (Demonstração)'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          O sistema opera em modelo monolito de consultório único. As credenciais do Firebase são configuradas via variáveis de ambiente no arquivo <code>.env</code>.
        </p>
      </div>

      {/* Bloco: Backup Geral */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Exportação e Backup de Prontuários (LGPD)</span>
        </h2>
        <p className="text-xs text-slate-600">
          Baixe uma cópia completa de todos os prontuários, refrações de pacientes e agendamentos deste consultório em formato estruturado JSON.
        </p>

        <div className="pt-2">
          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>{exporting ? 'Gerando Arquivo...' : 'Exportar Backup do Consultório (.JSON)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
