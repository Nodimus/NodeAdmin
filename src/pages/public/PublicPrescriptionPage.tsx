import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Glasses,
  Printer,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Phone,
  MapPin,
  FileText,
  User,
  ArrowLeft,
} from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Prescription } from '../../types';
import { formatDateBR } from '../../utils/formatters';

export const PublicPrescriptionPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (token) {
      loadDigital();
    }
  }, [token]);

  async function loadDigital() {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    setIsExpired(false);
    try {
      const data = await prescriptionsService.getPublicDigital(token);
      setPrescription(data);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('expirou') || msg.includes('410')) {
        setIsExpired(true);
      } else {
        setErrorMsg(msg || 'Receita óptica não encontrada ou link inválido.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Carregando Receita Óptica Digital...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Link de Visualização Expirado</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Por motivos de segurança e privacidade do prontuário do paciente (LGPD), este link temporário de acesso à receita digital expirou após o período de validade.
          </p>
          <p className="text-xs text-slate-500">
            Entre em contato com o consultório para solicitar o reenvio de uma nova via segura.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Página Inicial</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !prescription) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Receita Não Encontrada</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMsg || 'O link informado não corresponde a nenhuma receita ativa no consultório.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
            >
              <span>Ir para a Página Inicial</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dados do snapshot congelado
  const consultorio = prescription.snapshotConsultorio || {};
  const profissional = prescription.snapshotProfissional || {};
  const paciente = prescription.snapshotPaciente || {};

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      {/* Barra Superior para visualização na Web (oculta na impressão) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Receita Óptica Digital Oficial</h2>
            <p className="text-[11px] text-slate-500">
              Emitida em {formatDateBR(prescription.date)} • Nº {prescription.numeroFormatado || prescription.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Baixar PDF</span>
          </button>
        </div>
      </div>

      {/* Folha A4 Oficial da Receita Óptica */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-300 shadow-xl p-8 sm:p-12 relative print:m-0 print:p-8 print:border-none print:shadow-none print:rounded-none">
        {/* Banner se cancelada */}
        {prescription.cancelada && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">RECEITA CANCELADA NO SISTEMA</p>
              <p className="text-[11px] mt-0.5">
                Motivo: {prescription.motivoCancelamento || 'Retificação clínica necessária.'}
              </p>
            </div>
          </div>
        )}

        {/* Cabeçalho do Consultório (Dados congelados no momento da emissão) */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {consultorio.logoUrl ? (
              <img
                src={consultorio.logoUrl}
                alt={consultorio.nomeFantasia || 'Consultório'}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0">
                <Glasses className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {consultorio.nomeFantasia || 'Consultório de Optometria Dr. Roberto Viana'}
              </h1>
              <p className="text-xs font-semibold text-teal-700">
                {consultorio.responsavelTecnico || profissional.nome || 'Dr. Roberto Viana'} • {consultorio.registroProfissional || profissional.registroProfissional || 'CBOO 14.892-SP'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                CNPJ: {consultorio.cnpj || '12.345.678/0001-90'} • Atendimento Óptico-Clínico Primário
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[11px] text-slate-600 shrink-0">
            <p className="font-semibold">{consultorio.endereco?.logradouro || 'Av. Paulista'}, {consultorio.endereco?.numero || '1578'}</p>
            <p>{consultorio.endereco?.bairro || 'Bela Vista'} - {consultorio.endereco?.cidade || 'São Paulo'}/{consultorio.endereco?.uf || 'SP'}</p>
            <p className="font-mono mt-0.5">Tel: {consultorio.telefone || consultorio.whatsapp || '(11) 98765-4321'}</p>
          </div>
        </div>

        {/* Título da Folha e Identificação Sequencial */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Prescrição e Receituário Óptico
            </h2>
            <span className="text-[10px] text-slate-500">Via oficial de compensação óptica</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              Nº {prescription.numeroFormatado || `REC-${prescription.id}`}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Emissão: {formatDateBR(prescription.date)}
            </p>
          </div>
        </div>

        {/* Dados do Paciente (Snapshot congelado) */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paciente</span>
              <span className="font-bold text-slate-900 text-sm">{paciente.nome || prescription.patientName}</span>
            </div>
            <div className="sm:col-span-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPF</span>
              <span className="font-mono text-slate-800">{paciente.cpf || 'Não informado'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-200/60">
            <div className="sm:col-span-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</span>
              <span className="text-slate-700">{paciente.dataNascimento ? formatDateBR(paciente.dataNascimento) : 'Não informada'}</span>
            </div>
            <div className="sm:col-span-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone / WhatsApp</span>
              <span className="font-mono text-slate-700">{paciente.telefone || 'Não informado'}</span>
            </div>
            <div className="sm:col-span-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade / UF</span>
              <span className="text-slate-700">{paciente.endereco?.cidade || 'São Paulo'} - {paciente.endereco?.uf || 'SP'}</span>
            </div>
          </div>
        </div>

        {/* TABELA REFRATIVA OFICIAL (OD / OE) */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-300">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left">Olho</th>
                <th className="py-2.5 px-3">Esférico</th>
                <th className="py-2.5 px-3">Cilíndrico</th>
                <th className="py-2.5 px-3">Eixo</th>
                <th className="py-2.5 px-3">Adição</th>
                <th className="py-2.5 px-3">DNP</th>
                <th className="py-2.5 px-3">Acuidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-slate-800 font-medium">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-3 text-left font-sans font-bold text-slate-900">
                  OD <span className="text-[10px] text-slate-500 font-normal">(Direito)</span>
                </td>
                <td className="py-3 px-3 text-teal-900 font-bold">
                  {prescription.od.spherical !== undefined && prescription.od.spherical !== null
                    ? (prescription.od.spherical > 0 ? `+${prescription.od.spherical.toFixed(2)}` : prescription.od.spherical.toFixed(2))
                    : '—'}
                </td>
                <td className="py-3 px-3 text-indigo-900 font-bold">
                  {prescription.od.cylindrical !== undefined && prescription.od.cylindrical !== null && prescription.od.cylindrical !== 0
                    ? prescription.od.cylindrical.toFixed(2)
                    : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.od.axis ? `${prescription.od.axis}°` : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.od.addition ? `+${prescription.od.addition.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.od.dnp ? `${prescription.od.dnp} mm` : '—'}
                </td>
                <td className="py-3 px-3 font-sans">
                  {prescription.od.visualAcuity || '20/20'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 bg-slate-50/40">
                <td className="py-3 px-3 text-left font-sans font-bold text-slate-900">
                  OE <span className="text-[10px] text-slate-500 font-normal">(Esquerdo)</span>
                </td>
                <td className="py-3 px-3 text-teal-900 font-bold">
                  {prescription.oe.spherical !== undefined && prescription.oe.spherical !== null
                    ? (prescription.oe.spherical > 0 ? `+${prescription.oe.spherical.toFixed(2)}` : prescription.oe.spherical.toFixed(2))
                    : '—'}
                </td>
                <td className="py-3 px-3 text-indigo-900 font-bold">
                  {prescription.oe.cylindrical !== undefined && prescription.oe.cylindrical !== null && prescription.oe.cylindrical !== 0
                    ? prescription.oe.cylindrical.toFixed(2)
                    : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.oe.axis ? `${prescription.oe.axis}°` : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.oe.addition ? `+${prescription.oe.addition.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 px-3">
                  {prescription.oe.dnp ? `${prescription.oe.dnp} mm` : '—'}
                </td>
                <td className="py-3 px-3 font-sans">
                  {prescription.oe.visualAcuity || '20/20'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DP Total e Especificações da Lente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tipo de Lente Sugerida
            </span>
            <p className="font-bold text-slate-800">{prescription.lensType || 'Monofocal Digital'}</p>
            {prescription.dpTotal && (
              <p className="text-[11px] text-slate-600 mt-1">
                Distância Pupilar Total (DP): <strong>{prescription.dpTotal} mm</strong>
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tratamentos e Filtros Recomendados
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {prescription.coatings && prescription.coatings.length > 0 ? (
                prescription.coatings.map((c, i) => (
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

        {/* Observações Clínicas e Recomendações */}
        {(prescription.observacoes || prescription.recommendations) && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Orientações de Uso & Observações
            </span>
            {prescription.observacoes && (
              <p className="text-slate-700 leading-relaxed">{prescription.observacoes}</p>
            )}
            {prescription.recommendations && (
              <p className="text-slate-700 leading-relaxed font-medium">{prescription.recommendations}</p>
            )}
          </div>
        )}

        {/* Prazo de Validade da Receita */}
        <div className="mb-8 p-3 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-700" />
            <span className="font-semibold">
              Validade da Prescrição: <strong>{formatDateBR(prescription.expirationDate)}</strong> ({prescription.validadeDias || 365} dias)
            </span>
          </div>
          <span className="text-[10px] text-teal-800">Uso estritamente óptico</span>
        </div>

        {/* Assinatura e Carimbo do Profissional Responsável */}
        <div className="pt-6 border-t border-slate-200 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-[10px] text-slate-500 max-w-xs text-center sm:text-left">
            <p className="leading-relaxed">
              {consultorio.textoRodape ||
                'Prescrição óptica emitida conforme as competências profissionais da Optometria Clínica (CBO 3223-05). Válida para aviar em óticas de livre escolha do paciente.'}
            </p>
          </div>

          <div className="text-center min-w-[240px]">
            {consultorio.assinaturaUrl ? (
              <img src={consultorio.assinaturaUrl} alt="Assinatura" className="h-12 mx-auto mb-1 object-contain" />
            ) : (
              <div className="h-12 flex items-center justify-center">
                <span className="font-serif italic text-lg text-slate-700">
                  {profissional.nome || prescription.optometristName}
                </span>
              </div>
            )}
            <div className="border-t border-slate-900 pt-1.5">
              <p className="font-bold text-xs text-slate-900">
                {profissional.nome || prescription.optometristName}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                {profissional.registroProfissional || prescription.registerNumber}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Optometrista Responsável Técnico</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
