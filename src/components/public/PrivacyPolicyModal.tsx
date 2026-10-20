import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Consultorio } from '../../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultorio: Consultorio;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  consultorio,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="text-lg font-bold">
                Política de Privacidade & Sigilo Optométrico
              </h3>
              <p className="text-xs text-teal-100">
                {consultorio.nomeFantasia} • LGPD (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar política de privacidade"
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Compromisso de Sigilo com a Saúde Visual do Paciente</span>
            </p>
            <p className="text-teal-800">
              Este consultório particular opera sob rígidos protocolos éticos de atenção primária à visão. Seus dados clínicos e de refração jamais serão comercializados ou expostos.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>1. Controlador dos Dados</span>
            </h4>
            <p className="text-xs text-slate-700">
              <strong>{consultorio.razaoSocial}</strong> (Nome Fantasia: {consultorio.nomeFantasia})<br />
              CNPJ: {consultorio.cnpj} | Registro Profissional: {consultorio.registroProfissional}<br />
              Responsável Técnico: {consultorio.responsavelTecnico} ({consultorio.registroResponsavelTecnico})<br />
              Endereço: {consultorio.endereco.logradouro}, {consultorio.endereco.numero} - {consultorio.endereco.bairro}, {consultorio.endereco.cidade}/{consultorio.endereco.uf}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Dados Coletados e Finalidade</h4>
            <p>
              {consultorio.politicaPrivacidadeTexto ||
                'Coletamos dados de identificação (nome, telefone, data de nascimento e e-mail) estritamente para contato, agendamento de consultas e emissão de notas fiscais/recibos. Durante o atendimento clínico, coletamos medições de acuidade visual, refração, ceratometria e histórico ocular para elaboração do prontuário técnico e prescrição de óculos ou lentes de contato.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">3. Guarda e Retenção do Prontuário</h4>
            <p>
              O prontuário optométrico é armazenado em ambiente seguro com controle de acesso exclusivo por credenciais do consultório. Mantemos o histórico refrativo conforme prazos legais de guarda documental de saúde primária, permitindo comparações da evolução da sua visão em retornos futuros.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">4. Direitos do Titular (Você)</h4>
            <ul className="space-y-1.5 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                <span>Confirmar a existência do tratamento dos seus dados.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                <span>Acessar seu histórico e cópia de suas receitas emitidas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                <span>Solicitar correção de dados cadastrais incompletos ou desatualizados.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                <span>Canal direto de atendimento: pelo telefone {consultorio.telefone} ou WhatsApp {consultorio.whatsapp}.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">
            Atualizado em conformidade com o CBO 3223-05 e CBOO
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Entendi e fechar
          </button>
        </div>
      </div>
    </div>
  );
};
