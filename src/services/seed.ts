import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const PAPEIS_FILE = path.resolve(rootDir, 'papeis-data.json');
const USUARIOS_FILE = path.resolve(rootDir, 'usuarios-data.json');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function seedDatabase() {
  console.log('--- Iniciando Seed do Banco de Dados ---');

  // 1. Papéis padrão conforme docs/04-seguranca-e-permissoes.md
  const papeisPadrao = [
    {
      id: 'admin',
      nome: 'Admin',
      descricao: 'Acesso total e irrestrito ao sistema, configurações, usuários e dados',
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
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'optometrista',
      nome: 'Optometrista',
      descricao: 'Profissional de saúde visual responsável pelos exames de refração e emissão de receitas',
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
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'recepcao',
      nome: 'Recepção',
      descricao: 'Recepção e atendimento, controle da agenda de consultas e cadastro de pacientes',
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
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      descricao: 'Gestão financeira, fluxo de caixa, contas a pagar e a receber',
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
      criadoEm: new Date().toISOString(),
    },
  ];

  fs.writeFileSync(PAPEIS_FILE, JSON.stringify(papeisPadrao, null, 2), 'utf-8');
  console.log('✓ Papéis padrão criados/atualizados em papeis-data.json');

  // 2. Primeiro Admin e Usuários Padrão
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@consultorio.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const agora = new Date().toISOString();
  const usuarios = [
    {
      uid: 'user-admin-01',
      nome: 'Administrador do Sistema',
      email: adminEmail.toLowerCase().trim(),
      papelId: 'admin',
      ativo: true,
      passwordHash: hashPassword(adminPassword),
      trocarSenhaNoPrimeiroAcesso: true, // Obrigatório no primeiro acesso conforme requisito do prompt 04
      telefone: '(11) 98888-0000',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      uid: 'user-opto-01',
      nome: 'Dr. Roberto Viana',
      email: 'roberto@consultoriorobertoviana.com.br',
      registroProfissional: 'CBOO 14.892-SP | CBO 3223-05',
      papelId: 'optometrista',
      ativo: true,
      passwordHash: hashPassword('Roberto@123'),
      trocarSenhaNoPrimeiroAcesso: false,
      telefone: '(11) 98765-4321',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      uid: 'user-recep-01',
      nome: 'Juliana Paes',
      email: 'recepcao@consultoriorobertoviana.com.br',
      papelId: 'recepcao',
      ativo: true,
      passwordHash: hashPassword('Recepcao@123'),
      trocarSenhaNoPrimeiroAcesso: false,
      telefone: '(11) 97654-1234',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      uid: 'user-fin-01',
      nome: 'Marcos Silva',
      email: 'financeiro@consultoriorobertoviana.com.br',
      papelId: 'financeiro',
      ativo: true,
      passwordHash: hashPassword('Financeiro@123'),
      trocarSenhaNoPrimeiroAcesso: false,
      telefone: '(11) 96543-2109',
      criadoEm: agora,
      atualizadoEm: agora,
    },
  ];

  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2), 'utf-8');
  console.log(`✓ Primeiro Admin gerado (${adminEmail}) com troca de senha obrigatória no primeiro acesso!`);
  console.log('✓ Usuários de equipe cadastrados (Optometrista, Recepção, Financeiro)');
  console.log('--- Seed Concluído com Sucesso ---');
}

// Executa diretamente se invocado por linha de comando
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}
