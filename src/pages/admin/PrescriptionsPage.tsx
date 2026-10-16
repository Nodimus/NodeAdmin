import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Search,
  Glasses,
  CheckCircle,
  Eye,
  Calendar,
} from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Prescription } from '../../types';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { formatDateBR } from '../../utils/formatters';

export const PrescriptionsPage: React.FC = () => {
  const { consultorio } = useConsultorio();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState<Prescription | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  async function loadPrescriptions() {
    setLoading(true);
    try {
      const data = await prescriptionsService.getAll();
      setPrescriptions(data);
      if (data.length > 0 && !selectedForPrint) {
        setSelectedForPrint(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const filtered = prescriptions.filter((p) =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-teal-600" />
            <span>Receituário Óptico Digital</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Prescrições ópticas formatadas para entrega e impressão imediata
          </p>
        </div>

        {selectedForPrint && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Receita Selecionada</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista Lateral de Prescrições */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filtered.map((prx) => (
                <button
                  key={prx.id}
                  onClick={() => setSelectedForPrint(prx)}
                  className={`w-full p-3 rounded-xl text-left transition-colors flex flex-col gap-1 cursor-pointer ${
                    selectedForPrint?.id === prx.id
                      ? 'bg-teal-50 border border-teal-200 text-teal-950 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{prx.patientName}</span>
                    <span className="text-[10px] text-slate-700">{formatDateBR(prx.date)}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 truncate">{prx.lensType}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pré-visualização da Folha de Receituário Oficial */}
        <div className="lg:col-span-8">
          {selectedForPrint ? (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-8 sm:p-12 relative print:m-0 print:p-6 print:border-none print:shadow-none">
              {/* Cabeçalho do Consultório (Dados do Registro Único) */}
              <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0">
                    <Glasses className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {consultorio.nomeFantasia}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {consultorio.endereco.logradouro}, {consultorio.endereco.numero}
                      {consultorio.endereco.complemento ? ` - ${consultorio.endereco.complemento}` : ''} • {consultorio.endereco.cidade}/{consultorio.endereco.uf}
                    </p>
                    <p className="text-xs text-teal-700 font-medium">
                      Tel: {consultorio.telefone} • WhatsApp: {consultorio.whatsapp}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="inline-block px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-800 uppercase tracking-wider">
                    Receituário Óptico
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-slate-700">
                    Nº {selectedForPrint.id.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Dados do Paciente */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-700 uppercase font-semibold text-[10px]">Paciente:</span>
                  <p className="text-sm font-bold text-slate-900">{selectedForPrint.patientName}</p>
                </div>
                <div>
                  <span className="text-slate-700 uppercase font-semibold text-[10px]">Data da Emissão:</span>
                  <p className="font-medium text-slate-800">{formatDateBR(selectedForPrint.date)}</p>
                </div>
                <div>
                  <span className="text-slate-700 uppercase font-semibold text-[10px]">Validade Sugerida:</span>
                  <p className="font-medium text-teal-800">{formatDateBR(selectedForPrint.expirationDate)} (12 meses)</p>
                </div>
              </div>

              {/* Tabela Óptica OD / OE */}
              <div className="mb-6 overflow-hidden rounded-xl border-2 border-slate-800">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-900 text-white font-semibold font-sans uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Olho</th>
                      <th className="py-2.5 px-3">Esférico (D)</th>
                      <th className="py-2.5 px-3">Cilíndrico (D)</th>
                      <th className="py-2.5 px-3">Eixo (°)</th>
                      <th className="py-2.5 px-3">DNP (mm)</th>
                      <th className="py-2.5 px-3">Adição (D)</th>
                      <th className="py-2.5 px-3">Acuidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    <tr>
                      <td className="py-3 px-3 text-left font-bold font-sans text-teal-800 bg-slate-50">
                        OD (Direito)
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.od.spherical >= 0 ? '+' : ''}
                        {selectedForPrint.od.spherical.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.od.cylindrical.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.od.axis}°
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {selectedForPrint.od.dnp?.toFixed(1) || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {selectedForPrint.od.addition
                          ? `+${selectedForPrint.od.addition.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {selectedForPrint.od.visualAcuity || '20/20'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 text-left font-bold font-sans text-teal-800 bg-slate-50">
                        OE (Esquerdo)
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.oe.spherical >= 0 ? '+' : ''}
                        {selectedForPrint.oe.spherical.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.oe.cylindrical.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {selectedForPrint.oe.axis}°
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {selectedForPrint.oe.dnp?.toFixed(1) || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {selectedForPrint.oe.addition
                          ? `+${selectedForPrint.oe.addition.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {selectedForPrint.oe.visualAcuity || '20/20'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informações de Lentes e Recomendações */}
              <div className="space-y-4 mb-10 text-xs text-slate-700">
                <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span>
                    <strong>Design da Lente: </strong>
                    {selectedForPrint.lensType}
                  </span>
                  {selectedForPrint.dpTotal && (
                    <span className="font-mono">
                      <strong>Distância Pupilar Total (DP): </strong>
                      {selectedForPrint.dpTotal} mm
                    </span>
                  )}
                </div>

                {selectedForPrint.coatings && selectedForPrint.coatings.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">
                      Tratamentos Recomendados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedForPrint.coatings.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedForPrint.recommendations && (
                  <p className="text-[11px] text-slate-600 italic">
                    <strong>Orientações de Uso: </strong>
                    {selectedForPrint.recommendations}
                  </p>
                )}
              </div>

              {/* Assinatura do Profissional Optometrista */}
              <div className="pt-8 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6">
                <div>
                  <p className="text-[10px] text-slate-700 uppercase tracking-widest">
                    Responsável Técnico / Optometrista
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {consultorio.responsavelTecnico}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {consultorio.registroResponsavelTecnico}
                  </p>
                </div>

                <div className="w-52 border-t-2 border-slate-800 pt-1 text-[10px] text-slate-700 text-center">
                  Assinatura / Carimbo Profissional
                </div>
              </div>

              {/* Rodapé Legal */}
              <div className="mt-8 pt-4 border-t border-slate-100 text-[9px] text-slate-700 text-center">
                Prescrição óptica formulada de acordo com as prerrogativas do profissional optometrista (CBO 3223-05). Válido por 1 ano a partir da data de emissão.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-700 text-sm">
              Selecione uma receita na lista para visualizar e imprimir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
