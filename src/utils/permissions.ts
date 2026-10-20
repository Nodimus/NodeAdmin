import { Papel } from '../types';

/**
 * Validador de Permissões baseado na especificação docs/04-seguranca-e-permissoes.md
 * Formato das chaves: modulo.acao (ex: agenda.ler, financeiro.editar)
 */
export function hasPermission(
  permissoes: Record<string, boolean> | undefined | null,
  requiredPerm: string
): boolean {
  if (!permissoes) return false;

  // Acesso total (Super Admin / curinga raiz)
  if (permissoes['*'] === true || permissoes['*.*'] === true) {
    return true;
  }

  // Permissão exata
  if (permissoes[requiredPerm] === true) {
    return true;
  }

  // Curinga de módulo (ex: agenda.* cobre agenda.ler, agenda.criar, agenda.editar, agenda.excluir)
  const [modulo] = requiredPerm.split('.');
  if (modulo && permissoes[`${modulo}.*`] === true) {
    return true;
  }

  // Hierarquia de relatórios da especificação:
  // Admin: todos; Optometrista: clínicos; Recepção: agenda; Financeiro: financeiros
  if (requiredPerm === 'relatorios.ler') {
    return (
      permissoes['relatorios.ler'] === true ||
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.clinicos'] === true ||
      permissoes['relatorios.agenda'] === true ||
      permissoes['relatorios.financeiros'] === true ||
      permissoes['relatorios.*'] === true
    );
  }

  if (requiredPerm === 'relatorios.clinicos') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.clinicos'] === true ||
      permissoes['relatorios.*'] === true
    );
  }

  if (requiredPerm === 'relatorios.agenda') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.agenda'] === true ||
      permissoes['relatorios.*'] === true
    );
  }

  if (requiredPerm === 'relatorios.financeiros') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.financeiros'] === true ||
      permissoes['relatorios.*'] === true
    );
  }

  return false;
}

/**
 * Papéis padrão do sistema conforme tabela da especificação (docs/04-seguranca-e-permissoes.md)
 */
export const PAPEIS_PADRAO: Record<string, Papel> = {
  admin: {
    id: 'admin',
    nome: 'Admin',
    descricao: 'Acesso total e irrestrito a todas as configurações, auditoria, usuários, módulo clínico e financeiro',
    sistema: true,
    ativo: true,
    permissoes: {
      'usuarios.ler': true,
      'usuarios.criar': true,
      'usuarios.editar': true,
      'usuarios.excluir': true,
      'usuarios.*': true,
      'papeis.ler': true,
      'papeis.criar': true,
      'papeis.editar': true,
      'papeis.excluir': true,
      'papeis.*': true,
      'empresa.ler': true,
      'empresa.editar': true,
      'agenda.ler': true,
      'agenda.criar': true,
      'agenda.editar': true,
      'agenda.excluir': true,
      'agenda.*': true,
      'pacientes.ler': true,
      'pacientes.criar': true,
      'pacientes.editar': true,
      'pacientes.excluir': true,
      'pacientes.*': true,
      'atendimento.ler': true,
      'atendimento.criar': true,
      'atendimento.editar': true,
      'atendimento.excluir': true,
      'atendimento.imprimir': true,
      'atendimento.*': true,
      'receitas.ler': true,
      'receitas.criar': true,
      'receitas.editar': true,
      'receitas.excluir': true,
      'receitas.imprimir': true,
      'receitas.*': true,
      'financeiro.ler': true,
      'financeiro.criar': true,
      'financeiro.editar': true,
      'financeiro.excluir': true,
      'financeiro.*': true,
      'relatorios.ler': true,
      'relatorios.todos': true,
      'relatorios.clinicos': true,
      'relatorios.agenda': true,
      'relatorios.financeiros': true,
      'relatorios.*': true,
      'auditoria.ler': true,
    },
  },
  optometrista: {
    id: 'optometrista',
    nome: 'Optometrista',
    descricao: 'Profissional de saúde visual responsável pelos atendimentos clínicos, exames de refração e prescrição óptica',
    sistema: true,
    ativo: true,
    permissoes: {
      'empresa.ler': true,
      'agenda.ler': true,
      'agenda.criar': true,
      'agenda.editar': true,
      'agenda.excluir': true,
      'agenda.*': true,
      'pacientes.ler': true,
      'pacientes.criar': true,
      'pacientes.editar': true,
      'atendimento.ler': true,
      'atendimento.criar': true,
      'atendimento.editar': true,
      'atendimento.excluir': true,
      'atendimento.imprimir': true,
      'atendimento.*': true,
      'receitas.ler': true,
      'receitas.criar': true,
      'receitas.editar': true,
      'receitas.excluir': true,
      'receitas.imprimir': true,
      'receitas.*': true,
      'relatorios.ler': true,
      'relatorios.clinicos': true,
    },
  },
  recepcao: {
    id: 'recepcao',
    nome: 'Recepção',
    descricao: 'Controle de recepção, agenda de consultas e cadastro e atualização de pacientes',
    sistema: true,
    ativo: true,
    permissoes: {
      'empresa.ler': true,
      'agenda.ler': true,
      'agenda.criar': true,
      'agenda.editar': true,
      'agenda.excluir': true,
      'agenda.*': true,
      'pacientes.ler': true,
      'pacientes.criar': true,
      'pacientes.editar': true,
      'relatorios.ler': true,
      'relatorios.agenda': true,
    },
  },
  financeiro: {
    id: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Gestão financeira do consultório: contas a pagar, contas a receber, caixa e faturamento',
    sistema: true,
    ativo: true,
    permissoes: {
      'empresa.ler': true,
      'agenda.ler': true,
      'pacientes.ler': true,
      'financeiro.ler': true,
      'financeiro.criar': true,
      'financeiro.editar': true,
      'financeiro.excluir': true,
      'financeiro.*': true,
      'relatorios.ler': true,
      'relatorios.financeiros': true,
    },
  },
};
