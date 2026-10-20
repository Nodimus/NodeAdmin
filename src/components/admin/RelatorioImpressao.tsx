import React from 'react';
import { RelatorioDados } from '../../services/reports.service';
import { Glasses } from 'lucide-react';

interface RelatorioImpressaoProps {
  dados: RelatorioDados;
}

export const RelatorioImpressao: React.FC<RelatorioImpressaoProps> = ({ dados }) => {
  const { consultorio, filtrosAplicados, colunas, linhas, totais } = dados;
  const end = consultorio.endereco;
  const enderecoFormatado = end
    ? `${end.logradouro}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ''} • ${end.bairro} • ${end.cidade}/${end.uf} • CEP ${end.cep}`
    : 'Av. Paulista, 1578, Conjunto 112 - Bela Vista • São Paulo/SP';

  return (
    <div className="relatorio-impressao bg-white text-slate-900 font-sans text-xs leading-relaxed max-w-[210mm] mx-auto p-8 sm:p-10 shadow-lg print:shadow-none print:p-0 print:max-w-none print:w-full">
      {/* Estilos específicos para Impressão em Folha A4 com margens de 15mm */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .relatorio-impressao {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        .page-counter::after {
          content: "Página 1 de 1";
        }
      `}</style>

      {/* 1. CABEÇALHO OFICIAL DO CONSULTÓRIO */}
      <header className="border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {consultorio.logoUrl ? (
              <img
                src={consultorio.logoUrl}
                alt={consultorio.nomeFantasia}
                className="w-14 h-14 object-contain rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                <Glasses className="w-6 h-6" />
              </div>
            )}

            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-950 uppercase">
                {consultorio.nomeFantasia}
              </h1>
              <p className="text-[11px] font-semibold text-slate-700">
                {consultorio.razaoSocial}
              </p>
              <div className="text-[10px] text-slate-600 mt-0.5 space-x-2">
                {consultorio.cnpj && <span>CNPJ: {consultorio.cnpj}</span>}
                {consultorio.registroProfissional && (
                  <span>• {consultorio.registroProfissional}</span>
                )}
                {consultorio.responsavelTecnico && (
                  <span>• Resp. Técnico: {consultorio.responsavelTecnico}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-600 shrink-0">
            <div>{enderecoFormatado}</div>
            <div className="mt-0.5 space-x-2">
              {consultorio.telefone && <span>Tel: {consultorio.telefone}</span>}
              {consultorio.whatsapp && <span>WhatsApp: {consultorio.whatsapp}</span>}
              {consultorio.email && <span>E-mail: {consultorio.email}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* 2. TÍTULO DO RELATÓRIO E METADADOS DE EMISSÃO */}
      <section className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 print:bg-slate-50/50 print:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">
              Relatório Oficial Interno
            </span>
            <h2 className="text-sm font-bold text-slate-950 tracking-tight mt-0.5">
              {dados.titulo}
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {dados.descricao}
            </p>
          </div>

          <div className="text-right text-[10px] text-slate-600 shrink-0">
            <div>
              <span className="font-semibold text-slate-700">Emissão: </span>
              {dados.dataHoraEmissao}
            </div>
            <div className="mt-0.5">
              <span className="font-semibold text-slate-700">Emissor: </span>
              {dados.usuarioEmissor}
            </div>
          </div>
        </div>

        {/* Filtros Aplicados */}
        {filtrosAplicados && filtrosAplicados.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap text-[10px]">
            <span className="font-bold text-slate-700">Filtros aplicados:</span>
            {filtrosAplicados.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-medium print:border-slate-300"
              >
                <span className="text-slate-500">{f.rotulo}:</span>
                <span className="font-bold">{f.valor}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 3. TABELA DE DADOS COM CABEÇALHO REPETIDO POR PÁGINA */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead className="bg-slate-100 text-slate-900 border-b-2 border-slate-400 print:bg-slate-100">
            <tr>
              <th className="py-2 px-2.5 font-bold uppercase text-[10px] text-slate-700 border-r border-slate-300 w-8 text-center">
                #
              </th>
              {colunas.map((col, idx) => (
                <th
                  key={idx}
                  className="py-2 px-2.5 font-bold uppercase text-[10px] text-slate-700 border-r border-slate-300 last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={colunas.length + 1}
                  className="py-8 text-center text-slate-500 italic"
                >
                  Nenhum registro encontrado para os critérios e filtros selecionados.
                </td>
              </tr>
            ) : (
              linhas.map((linha, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/80 print:hover:bg-transparent transition-colors break-inside-avoid"
                >
                  <td className="py-2 px-2.5 font-semibold text-slate-500 border-r border-slate-200 text-center w-8 text-[10px]">
                    {rowIdx + 1}
                  </td>
                  {linha.map((celula: any, celIdx: number) => (
                    <td
                      key={celIdx}
                      className="py-2 px-2.5 border-r border-slate-200 last:border-r-0 text-slate-900 font-medium"
                    >
                      {celula !== undefined && celula !== null ? String(celula) : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {/* Totais ao final da tabela se aplicável */}
          {totais && totais.length > 0 && (
            <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900 print:bg-slate-100">
              <tr>
                <td
                  colSpan={colunas.length + 1}
                  className="py-2.5 px-3"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
                    <span className="uppercase text-[10px] tracking-wide text-slate-700">
                      Consolidação e Totais:
                    </span>
                    <div className="flex items-center gap-4 flex-wrap">
                      {totais.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-slate-600 text-[11px] font-normal">{t.rotulo}:</span>
                          <span className="font-extrabold text-slate-950">{t.valor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 4. RODAPÉ INSTITUCIONAL E NUMERAÇÃO DE PÁGINA */}
      <footer className="mt-6 pt-4 border-t border-slate-300 text-[10px] text-slate-600 flex items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="leading-normal">
            {consultorio.textoRodapeRelatorio ||
              'Consultório Clínico de Optometria • Dr. Roberto Viana • CBOO 14.892-SP | CBO 3223-05 • Atendimento primário da saúde visual e refrativa individualizada. Exclusividade clínica optométrica sem vínculo comercial com óticas ou venda de lentes.'}
          </p>
        </div>

        <div className="text-right shrink-0 font-medium text-slate-500">
          <div className="page-counter">Página 1 de 1</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Relatório Oficial Auditado</div>
        </div>
      </footer>
    </div>
  );
};
