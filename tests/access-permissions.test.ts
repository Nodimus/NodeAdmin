import { app } from '../server';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test runner minimalista e autônomo sem dependências externas
let serverInstance: http.Server;
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${detail || ''}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  TESTES AUTOMATIZADOS: SEGURANÇA E CONTROLE DE ACESSO');
  console.log('======================================================\n');

  // Iniciar servidor em porta de teste
  await new Promise<void>((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  try {
    // ------------------------------------------------------------------------
    // 1. Acesso sem autenticação a rotas protegidas (Espera 401)
    // ------------------------------------------------------------------------
    console.log('--- 1. Validação de Rotas Protegidas sem Login (401) ---');
    const semLoginFinanceiro = await request('/api/admin/financeiro');
    assert(semLoginFinanceiro.status === 401, 'Requisição para /api/admin/financeiro sem autenticação deve retornar 401');

    const semLoginAgenda = await request('/api/admin/agenda');
    assert(semLoginAgenda.status === 401, 'Requisição para /api/admin/agenda sem autenticação deve retornar 401');

    const semLoginUsuarios = await request('/api/admin/usuarios');
    assert(semLoginUsuarios.status === 401, 'Requisição para /api/admin/usuarios sem autenticação deve retornar 401');

    // ------------------------------------------------------------------------
    // 2. Login e Permissões do Optometrista
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Acesso e Restrições do Papel Optometrista ---');
    const loginOpto = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'roberto@consultoriorobertoviana.com.br', password: 'Roberto@123' },
    });
    assert(loginOpto.status === 200, 'Login do Optometrista deve ter sucesso (200)');
    const tokenOpto = loginOpto.data.sessionToken;
    const optoHeaders = { Authorization: `Bearer ${tokenOpto}` };

    // Deve ter permissão: agenda, atendimento, receitas
    const optoAgenda = await request('/api/admin/agenda', { headers: optoHeaders });
    assert(optoAgenda.status === 200, 'Optometrista tem permissão para /api/admin/agenda (200)');

    const optoAtendimento = await request('/api/admin/atendimento', { headers: optoHeaders });
    assert(optoAtendimento.status === 200, 'Optometrista tem permissão para /api/admin/atendimento (200)');

    const optoReceitas = await request('/api/admin/receitas', { headers: optoHeaders });
    assert(optoReceitas.status === 200, 'Optometrista tem permissão para /api/admin/receitas (200)');

    // NÃO deve ter permissão (403): financeiro, usuarios, auditoria
    const optoFinanceiro = await request('/api/admin/financeiro', { headers: optoHeaders });
    assert(optoFinanceiro.status === 403, 'Optometrista recebe 403 Forbidden ao acessar /api/admin/financeiro');

    const optoUsuarios = await request('/api/admin/usuarios', { headers: optoHeaders });
    assert(optoUsuarios.status === 403, 'Optometrista recebe 403 Forbidden ao acessar /api/admin/usuarios');

    const optoAuditoria = await request('/api/admin/auditoria', { headers: optoHeaders });
    assert(optoAuditoria.status === 403, 'Optometrista recebe 403 Forbidden ao acessar /api/admin/auditoria');

    // ------------------------------------------------------------------------
    // 3. Login e Permissões da Recepção
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Acesso e Restrições do Papel Recepção ---');
    const loginRecep = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'recepcao@consultoriorobertoviana.com.br', password: 'Recepcao@123' },
    });
    assert(loginRecep.status === 200, 'Login da Recepção deve ter sucesso (200)');
    const tokenRecep = loginRecep.data.sessionToken;
    const recepHeaders = { Authorization: `Bearer ${tokenRecep}` };

    // Deve ter permissão: agenda, pacientes
    const recepAgenda = await request('/api/admin/agenda', { headers: recepHeaders });
    assert(recepAgenda.status === 200, 'Recepção tem permissão para /api/admin/agenda (200)');

    const recepPacientes = await request('/api/admin/pacientes', { headers: recepHeaders });
    assert(recepPacientes.status === 200, 'Recepção tem permissão para /api/admin/pacientes (200)');

    // NÃO deve ter permissão (403): atendimento, receitas, financeiro, usuarios
    const recepAtendimento = await request('/api/admin/atendimento', { headers: recepHeaders });
    assert(recepAtendimento.status === 403, 'Recepção recebe 403 Forbidden ao tentar acessar /api/admin/atendimento');

    const recepReceitas = await request('/api/admin/receitas', { headers: recepHeaders });
    assert(recepReceitas.status === 403, 'Recepção recebe 403 Forbidden ao tentar acessar /api/admin/receitas');

    const recepFinanceiro = await request('/api/admin/financeiro', { headers: recepHeaders });
    assert(recepFinanceiro.status === 403, 'Recepção recebe 403 Forbidden ao tentar acessar /api/admin/financeiro');

    // ------------------------------------------------------------------------
    // 4. Login e Permissões do Financeiro
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Acesso e Restrições do Papel Financeiro ---');
    const loginFin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'financeiro@consultoriorobertoviana.com.br', password: 'Financeiro@123' },
    });
    assert(loginFin.status === 200, 'Login do Financeiro deve ter sucesso (200)');
    const tokenFin = loginFin.data.sessionToken;
    const finHeaders = { Authorization: `Bearer ${tokenFin}` };

    // Deve ter permissão: financeiro, agenda.ler
    const finFinanceiro = await request('/api/admin/financeiro', { headers: finHeaders });
    assert(finFinanceiro.status === 200, 'Financeiro tem permissão para /api/admin/financeiro (200)');

    const finAgenda = await request('/api/admin/agenda', { headers: finHeaders });
    assert(finAgenda.status === 200, 'Financeiro tem permissão de leitura para /api/admin/agenda (200)');

    // NÃO deve ter permissão (403): atendimento, receitas, usuarios
    const finAtendimento = await request('/api/admin/atendimento', { headers: finHeaders });
    assert(finAtendimento.status === 403, 'Financeiro recebe 403 Forbidden ao acessar /api/admin/atendimento');

    const finReceitas = await request('/api/admin/receitas', { headers: finHeaders });
    assert(finReceitas.status === 403, 'Financeiro recebe 403 Forbidden ao acessar /api/admin/receitas');

    const finUsuarios = await request('/api/admin/usuarios', { headers: finHeaders });
    assert(finUsuarios.status === 403, 'Financeiro recebe 403 Forbidden ao acessar /api/admin/usuarios');

    // ------------------------------------------------------------------------
    // 5. Login e Permissões do Admin
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Acesso Total do Administrador ---');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@consultorio.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const loginAdmin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword },
    });
    assert(loginAdmin.status === 200, 'Login do Administrador inicial deve ter sucesso (200)');
    assert(loginAdmin.data.user.trocarSenhaNoPrimeiroAcesso === true, 'Admin inicial deve ter trocarSenhaNoPrimeiroAcesso = true');

    const tokenAdmin = loginAdmin.data.sessionToken;
    const adminHeaders = { Authorization: `Bearer ${tokenAdmin}` };

    const adminUsuarios = await request('/api/admin/usuarios', { headers: adminHeaders });
    assert(adminUsuarios.status === 200, 'Admin pode acessar /api/admin/usuarios (200)');

    const adminPapeis = await request('/api/admin/papeis', { headers: adminHeaders });
    assert(adminPapeis.status === 200, 'Admin pode acessar /api/admin/papeis (200)');

    const adminAuditoria = await request('/api/admin/auditoria', { headers: adminHeaders });
    assert(adminAuditoria.status === 200, 'Admin pode acessar /api/admin/auditoria (200)');

    const adminFinanceiro = await request('/api/admin/financeiro', { headers: adminHeaders });
    assert(adminFinanceiro.status === 200, 'Admin pode acessar /api/admin/financeiro (200)');

    // ------------------------------------------------------------------------
    // 6. Edição Dinâmica de Papéis: Efeito Imediato na Requisição Seguinte
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Teste de Edição Dinâmica de Papel em Tempo Real ---');
    // Obter papel da recepção atual
    const papeisRes = await request('/api/admin/papeis', { headers: adminHeaders });
    const papelRecepcao = papeisRes.data.find((p: any) => p.id === 'recepcao');

    // 6a. Admin concede permissão 'financeiro.ler' à Recepção
    const papelRecepcaoModificado = {
      ...papelRecepcao,
      permissoes: {
        ...papelRecepcao.permissoes,
        'financeiro.ler': true,
      },
    };
    const updateRes = await request('/api/admin/papeis/recepcao', {
      method: 'PUT',
      headers: adminHeaders,
      body: papelRecepcaoModificado,
    });
    assert(updateRes.status === 200, 'Admin atualiza permissões do papel Recepção');

    // 6b. Usuário da recepção faz requisição para /api/admin/financeiro com a MESMA sessão
    const recepAcessaFinanceiroLiberado = await request('/api/admin/financeiro', { headers: recepHeaders });
    assert(
      recepAcessaFinanceiroLiberado.status === 200,
      'Recepção agora acessa /api/admin/financeiro IMEDIATAMENTE sem precisar relogar (200)'
    );

    // 6c. Admin revoga permissão 'financeiro.ler' da Recepção
    const papelRecepcaoRevogado = {
      ...papelRecepcao,
      permissoes: {
        ...papelRecepcao.permissoes,
        'financeiro.ler': false,
      },
    };
    await request('/api/admin/papeis/recepcao', {
      method: 'PUT',
      headers: adminHeaders,
      body: papelRecepcaoRevogado,
    });

    // 6d. Recepção tenta acessar novamente -> Volta imediatamente a 403 Forbidden!
    const recepAcessaFinanceiroRevogado = await request('/api/admin/financeiro', { headers: recepHeaders });
    assert(
      recepAcessaFinanceiroRevogado.status === 403,
      'Recepção volta a receber 403 Forbidden IMEDIATAMENTE após revogação da permissão'
    );

    // ------------------------------------------------------------------------
    // 7. Teste de Recuperação e Troca de Senha
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Teste de Recuperação e Troca de Senha ---');
    const recRes = await request('/api/auth/recuperar-senha', {
      method: 'POST',
      body: { email: 'roberto@consultoriorobertoviana.com.br' },
    });
    assert(recRes.status === 200, 'Solicitação de recuperação de senha retorna 200');
    assert(Boolean(recRes.data.devResetUrl), 'Gera link com token de recuperação de senha');

    const tokenMatch = recRes.data.devResetUrl?.match(/token=([a-f0-9]+)/);
    const resetToken = tokenMatch ? tokenMatch[1] : null;

    if (resetToken) {
      const novaSenhaDefinida = 'Roberto@NovaSenha2026';
      const resetActionRes = await request('/api/auth/redefinir-senha', {
        method: 'POST',
        body: { token: resetToken, novaSenha: novaSenhaDefinida },
      });
      assert(resetActionRes.status === 200, 'Redefinição de senha com token retorna 200');

      // Tenta login com a nova senha
      const loginNovaSenha = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'roberto@consultoriorobertoviana.com.br', password: novaSenhaDefinida },
      });
      assert(loginNovaSenha.status === 200, 'Login com nova senha redefinida tem sucesso (200)');

      // Restaura senha original para manter testes e ambiente previsíveis
      const tokenRecuperado = loginNovaSenha.data.sessionToken;
      await request('/api/auth/trocar-senha', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenRecuperado}` },
        body: { senhaAtual: novaSenhaDefinida, novaSenha: 'Roberto@123' },
      });
    }

    // ------------------------------------------------------------------------
    // 7. MÓDULO USUÁRIOS E PAPÉIS (PROMPT 05)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Validação de Regras do Prompt 05 (Usuários e Papéis) ---');

    // Login com Recepção
    const loginRecepcao = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'recepcao@consultoriorobertoviana.com.br', password: 'Recepcao@123' },
    });
    const tokenRecepcao = loginRecepcao.data.sessionToken;

    // Usar tokenAdmin e adminUid já autenticados anteriormente
    const authTokenAdmin = tokenAdmin;
    const adminUid = loginAdmin.data.user.uid;

    // 7.1 Recepção não vê nem acessa o módulo /api/admin/usuarios (403)
    const recepUsuarios = await request('/api/admin/usuarios', {
      headers: { Authorization: `Bearer ${tokenRecepcao}` },
    });
    assert(recepUsuarios.status === 403, 'Recepção não pode ler lista de usuários (/api/admin/usuarios retorna 403)');

    // 7.2 Admin acessa a lista de usuários com sucesso (200)
    const resUsuariosAdmin = await request('/api/admin/usuarios', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resUsuariosAdmin.status === 200, 'Admin consegue listar usuários (200)');
    assert(Array.isArray(resUsuariosAdmin.data), 'Resposta de usuários é um array');

    // 7.3 Admin cria novo usuário sem senha prévia -> Servidor cria e gera definicaoUrl (201)
    const testUserEmail = `colaborador_${Date.now()}@consultorio.com.br`;
    const criarUsuarioRes = await request('/api/admin/usuarios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nome: 'Dra. Ana Paula Teste',
        email: testUserEmail,
        papelId: 'optometrista',
        telefone: '(11) 91234-5678',
        registroProfissional: 'CBOO 99.999-SP',
      },
    });
    assert(criarUsuarioRes.status === 201, 'Criação de usuário pelo Admin retorna 201');
    assert(Boolean(criarUsuarioRes.data.definicaoUrl), 'Servidor retorna definicaoUrl com link de uso único');
    const createdUid = criarUsuarioRes.data.usuario?.uid;

    // 7.4 Bloqueio: Tentar desativar o próprio usuário logado (400)
    const selfDeactivateRes = await request(`/api/admin/usuarios/${adminUid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { ativo: false },
    });
    assert(selfDeactivateRes.status === 400, 'Bloqueia desativar o próprio usuário logado (400)');

    // 7.5 Bloqueio: Tentar rebaixar o próprio papel de Administrador logado (400)
    const selfDemoteRes = await request(`/api/admin/usuarios/${adminUid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { papelId: 'recepcao' },
    });
    assert(selfDemoteRes.status === 400, 'Bloqueia rebaixar o próprio usuário Administrador logado (400)');

    // 7.6 Bloqueio: Tentar desativar o último Admin ativo (400)
    const lastAdminRes = await request(`/api/admin/usuarios/${adminUid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(lastAdminRes.status === 400, 'DELETE no último Administrador ativo é bloqueado (400)');

    // 7.7 Sessões ativas são revogadas ao desativar usuário
    // Criamos uma sessão para um usuário temporário e depois desativamos ele
    const tempUserEmail = `temp_${Date.now()}@consultorio.com.br`;
    const tempUserRes = await request('/api/admin/usuarios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nome: 'Usuario Temporario',
        email: tempUserEmail,
        papelId: 'recepcao',
        senhaInicial: 'TempSenha@123',
      },
    });
    const tempUid = tempUserRes.data.usuario?.uid;

    // Login com o usuário temporário
    const tempLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: tempUserEmail, password: 'TempSenha@123' },
    });
    const tempToken = tempLogin.data.sessionToken;
    assert(Boolean(tempToken), 'Usuário temporário realizou login com sucesso');

    // Desativa o usuário temporário via DELETE
    const desativarTempRes = await request(`/api/admin/usuarios/${tempUid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(desativarTempRes.status === 200, 'Desativação de usuário retorna 200');

    // A sessão ativa anterior do usuário temporário deve agora ser inválida (401)
    const requisicaoComSessaoRevogada = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert(requisicaoComSessaoRevogada.status === 401, 'Sessão do usuário desativado foi revogada com sucesso (401)');

    // 7.8 Gestão de Papéis & Matriz de Permissões
    // Admin cria papel customizado
    const novoPapelId = `custom_${Date.now().toString(36)}`;
    const criarPapelRes = await request('/api/admin/papeis', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        id: novoPapelId,
        nome: 'Consultor de Lentes de Contato',
        descricao: 'Atendimento especializado em lentes',
        permissoes: { 'agenda.ler': true, 'pacientes.ler': true, 'atendimento.ler': true },
      },
    });
    assert(criarPapelRes.status === 201, 'Criação de papel personalizado retorna 201');

    // Bloqueio: Permissões do papel Admin não podem ser alteradas (400)
    const alterarAdminRes = await request('/api/admin/papeis/admin', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { permissoes: { 'agenda.ler': true } },
    });
    assert(alterarAdminRes.status === 400, 'Permissões do papel Admin são protegidas contra alteração (400)');

    // Bloqueio: Papéis nativos do sistema não podem ser excluídos (400)
    const excluirPapelSistema = await request('/api/admin/papeis/optometrista', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(excluirPapelSistema.status === 400, 'Papéis do sistema não podem ser excluídos (400)');

    // Bloqueio: Papel em uso não pode ser excluído (400)
    // Atribui o novo papel ao usuário criado anteriormente
    await request(`/api/admin/usuarios/${createdUid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { papelId: novoPapelId },
    });
    const excluirPapelEmUso = await request(`/api/admin/papeis/${novoPapelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(excluirPapelEmUso.status === 400, 'Papel em uso por colaboradores não pode ser excluído (400)');

    // Reatribui o usuário para liberar o papel e então exclui
    await request(`/api/admin/usuarios/${createdUid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { papelId: 'optometrista' },
    });
    const excluirPapelLivre = await request(`/api/admin/papeis/${novoPapelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(excluirPapelLivre.status === 200, 'Papel personalizado sem usuários em uso pode ser excluído (200)');

    // 7.9 Trilha de Auditoria
    // Recepção não pode acessar auditoria (403)
    const recepAuditoria = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${tokenRecepcao}` },
    });
    assert(recepAuditoria.status === 403, 'Recepção não tem permissão para ler auditoria (403)');

    // Admin acessa auditoria (200) e contém registros das ações executadas
    const resAuditoriaAdmin = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resAuditoriaAdmin.status === 200, 'Admin acessa trilha de auditoria com sucesso (200)');
    assert(resAuditoriaAdmin.data.logs?.length > 0, 'Trilha de auditoria contém registros das operações');

    const temRegistroUsuarioCriar = resAuditoriaAdmin.data.logs.some((l: any) => l.acao === 'usuario.criar');
    assert(temRegistroUsuarioCriar, 'Auditoria registrou evento de usuario.criar');

    const temRegistroPapelCriar = resAuditoriaAdmin.data.logs.some((l: any) => l.acao === 'papel.criar');
    assert(temRegistroPapelCriar, 'Auditoria registrou evento de papel.criar');

    const temRegistroUsuarioDesativar = resAuditoriaAdmin.data.logs.some((l: any) => l.acao === 'usuario.desativar');
    assert(temRegistroUsuarioDesativar, 'Auditoria registrou evento de usuario.desativar');

    // ------------------------------------------------------------------------
    // 8. MÓDULO DADOS DA EMPRESA (PROMPT 06)
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Validação de Regras do Prompt 06 (Dados da Empresa) ---');

    // 8.1 Recepção tem empresa.ler mas não tem empresa.editar -> PUT retorna 403
    const recepEditaEmpresa = await request('/api/admin/empresa', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecepcao}` },
      body: { nomeFantasia: 'Tentativa Invalida Recepcao' },
    });
    assert(recepEditaEmpresa.status === 403, 'Recepção não pode editar dados da empresa (PUT retorna 403)');

    // 8.2 Admin tenta salvar com CNPJ inválido -> Retorna 400
    const resCnpjInvalido = await request('/api/admin/empresa', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { cnpj: '11.111.111/1111-11' },
    });
    assert(resCnpjInvalido.status === 400, 'Servidor rejeita CNPJ inválido (400)');

    // 8.3 Admin tenta salvar com CEP inválido -> Retorna 400
    const resCepInvalido = await request('/api/admin/empresa', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { endereco: { cep: '123' } },
    });
    assert(resCepInvalido.status === 400, 'Servidor rejeita CEP com formato incorreto (400)');

    // 8.4 Admin atualiza telefone e whatsapp com sucesso -> Retorna 200
    const novoTelefone = '(11) 3333-4444';
    const novoWhatsapp = '(11) 99999-8888';
    const resAtualizarEmpresa = await request('/api/admin/empresa', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        telefone: novoTelefone,
        whatsapp: novoWhatsapp,
      },
    });
    assert(resAtualizarEmpresa.status === 200, 'Admin atualiza dados da empresa com sucesso (200)');
    assert(resAtualizarEmpresa.data.consultorio?.whatsapp === novoWhatsapp, 'WhatsApp atualizado no consultório');

    // 8.5 Leitura pública expõe dados atualizados e oculta confidenciais
    const resPublico = await request('/api/public/consultorio');
    assert(resPublico.status === 200, 'Endpoint público do consultório acessível sem login (200)');
    assert(resPublico.data.whatsapp === novoWhatsapp, 'Landing page recebe o novo WhatsApp atualizado');
    assert(resPublico.data.carimboUrl === undefined, 'Leitura pública não expõe carimbo confidencial');
    assert(resPublico.data.categoriasDespesa === undefined, 'Leitura pública não expõe categorias de despesa internas');

    // 8.6 Desativar serviço remove do endpoint público
    const dadosEmpresaAtual = await request('/api/admin/empresa', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const servicosAtuais = dadosEmpresaAtual.data.servicos || [];
    if (servicosAtuais.length > 0) {
      const primeiroServicoId = servicosAtuais[0].id;
      const servicosComUmInativo = servicosAtuais.map((s: any) =>
        s.id === primeiroServicoId ? { ...s, ativo: false } : s
      );

      await request('/api/admin/empresa', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authTokenAdmin}` },
        body: { servicos: servicosComUmInativo },
      });

      const resPublicoAposInativar = await request('/api/public/consultorio');
      const existeInativoNoPublico = resPublicoAposInativar.data.servicos?.some(
        (s: any) => s.id === primeiroServicoId
      );
      assert(!existeInativoNoPublico, 'Serviço inativado não aparece no formulário/lista pública de agendamento');

      // Restaura serviço para ativo
      const servicosRestaurados = servicosAtuais.map((s: any) =>
        s.id === primeiroServicoId ? { ...s, ativo: true } : s
      );
      await request('/api/admin/empresa', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authTokenAdmin}` },
        body: { servicos: servicosRestaurados },
      });
    }

    // 8.7 Auditoria registrou evento de empresa.editar
    const auditAposEmpresa = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temRegistroEmpresaEditar = auditAposEmpresa.data.logs?.some((l: any) => l.acao === 'empresa.editar');
    assert(temRegistroEmpresaEditar, 'Auditoria registrou evento de empresa.editar');

    // ------------------------------------------------------------------------
    // 9. MÓDULO CONTEÚDO DA HOME NO PAINEL (PROMPT 06B)
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Validação de Regras do Prompt 06b (Conteúdo da Home) ---');

    // 9.1 Admin obtém conteúdo da home para edição
    const resGetHome = await request('/api/admin/home', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resGetHome.status === 200, 'Admin consegue ler dados da home (/api/admin/home retorna 200)');
    assert(Boolean(resGetHome.data.home?.hero), 'Dados da home incluem bloco hero');
    assert(Array.isArray(resGetHome.data.home?.galeria), 'Dados da home incluem galeria');
    assert(Array.isArray(resGetHome.data.home?.depoimentos), 'Dados da home incluem depoimentos');

    // 9.2 Recepção não pode publicar alterações na home (403)
    const recepPublicaHome = await request('/api/admin/home/publicar', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecepcao}` },
      body: { hero: { titulo: 'Tentativa de publicação indevida' } },
    });
    assert(recepPublicaHome.status === 403, 'Recepção é bloqueada ao tentar publicar na home (403)');

    // 9.3 Validação de tamanho de texto excessivo (400)
    const tituloGigante = 'A'.repeat(250);
    const resTextoGigante = await request('/api/admin/home/publicar', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { hero: { titulo: tituloGigante } },
    });
    assert(resTextoGigante.status === 400, 'Servidor rejeita título com mais de 200 caracteres (400)');

    // 9.4 Publicação com sucesso e sanitização de tags HTML
    const textoComTags = 'Cuidado Visual <script>alert("xss")</script> de Excelência';
    const resPublicarOk = await request('/api/admin/home/publicar', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        hero: {
          titulo: textoComTags,
          subtitulo: 'Exames de refração e cuidados visuais personalizados.',
          textoBotao: 'Agendar Consulta',
        },
      },
    });
    assert(resPublicarOk.status === 200, 'Admin publica alterações da home com sucesso (200)');
    assert(resPublicarOk.data.publicadoPor?.nome, 'Resposta de publicação inclui publicadoPor.nome');
    assert(
      !resPublicarOk.data.consultorio?.hero?.titulo.includes('<script>'),
      'Servidor sanitizou tags HTML do título publicado'
    );

    // 9.5 Endpoint público expõe o novo conteúdo publicado
    const resPublicoHome = await request('/api/public/consultorio');
    assert(resPublicoHome.status === 200, 'Endpoint público do consultório acessível (200)');
    assert(
      resPublicoHome.data.hero?.titulo === 'Cuidado Visual  de Excelência',
      'Landing page exibe o novo título publicado e sanitizado'
    );

    // 9.6 Trilha de auditoria registrou o evento home.publicar
    const auditAposPublicar = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temRegistroHomePublicar = auditAposPublicar.data.logs?.some((l: any) => l.acao === 'home.publicar');
    assert(temRegistroHomePublicar, 'Auditoria registrou evento de home.publicar');

    // ------------------------------------------------------------------------
    // 10. MÓDULO PAINEL & AGENDA (PROMPT 07)
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Validação de Regras do Prompt 07 (Painel, Agenda e Segregação Deontológica) ---');

    // 10.1 Segregação Deontológica: Dashboard não expõe finanças para Recepção e Optometrista
    const dashRecepcao = await request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(dashRecepcao.status === 200, 'Recepção acessa o dashboard geral (/api/admin/dashboard retorna 200)');
    assert(dashRecepcao.data.temPermissaoFinanceiro === false, 'Recepção tem temPermissaoFinanceiro = false');
    assert(dashRecepcao.data.financeiroMes === null, 'Recepção NÃO tem acesso a faturamento/receita do mês (null)');
    assert(typeof dashRecepcao.data.totalConsultasHoje === 'number', 'Dashboard informa total de consultas de hoje');

    const dashOptometrista = await request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${tokenOpto}` },
    });
    assert(dashOptometrista.status === 200, 'Optometrista acessa o dashboard geral (200)');
    assert(dashOptometrista.data.temPermissaoFinanceiro === false, 'Optometrista não tem acesso a finanças no painel');
    assert(dashOptometrista.data.financeiroMes === null, 'Optometrista tem financeiroMes = null');

    const dashAdmin = await request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(dashAdmin.status === 200, 'Admin acessa dashboard completo (200)');
    assert(dashAdmin.data.temPermissaoFinanceiro === true, 'Admin possui permissão para ver dados financeiros');
    assert(dashAdmin.data.financeiroMes !== null, 'Admin visualiza receita e saldo do mês no painel');
    assert(dashAdmin.data.financeiroMes.receitaCentavos > 0, 'Receita do mês calculada em centavos');

    // 10.2 Leitura da agenda respeita permissões
    const resGetAgenda = await request('/api/admin/agenda', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resGetAgenda.status === 200, 'Recepção lê agenda do consultório (200)');
    assert(Array.isArray(resGetAgenda.data.agendamentos), 'Resposta da agenda é um array de agendamentos');
    assert(Array.isArray(resGetAgenda.data.bloqueios), 'Agenda retorna lista de bloqueios (feriados e férias)');

    // 10.3 Financeiro não pode criar agendamentos sem agenda.criar (403)
    const resFinCriarAgenda = await request('/api/admin/agenda', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenFin}` },
      body: {
        nomeContato: 'Teste Sem Permissao',
        data: '2026-10-20',
        horario: '10:00',
      },
    });
    assert(resFinCriarAgenda.status === 403, 'Financeiro recebe 403 ao tentar criar agendamento manual');

    // 10.4 Validação de bloqueio de agenda (Feriado de Natal 2026-12-25)
    const resAgendarBloqueio = await request('/api/admin/agenda', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        nomeContato: 'Paciente Feriado',
        telefone: '(11) 98765-4321',
        data: '2026-12-25',
        horario: '10:00',
      },
    });
    assert(resAgendarBloqueio.status === 400, 'Servidor rejeita agendamento em data de bloqueio/feriado (400)');
    assert(
      resAgendarBloqueio.data.error?.includes('Bloqueio programado'),
      'Mensagem informa bloqueio programado na agenda'
    );

    // 10.5 Criação manual interna com sucesso (origem: interno)
    const resCriarManual = await request('/api/admin/agenda', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        nomeContato: 'Joaquim Silva Manual',
        telefone: '(11) 99887-7665',
        email: 'joaquim.silva@exemplo.com.br',
        data: '2026-10-21',
        horario: '09:00',
        duracaoMin: 40,
        observacoes: 'Paciente com queixa de visão dupla para longe.',
      },
    });
    assert(resCriarManual.status === 201, 'Recepção cria agendamento manual interno com sucesso (201)');
    const idAgendamentoCriado = resCriarManual.data.agendamento.id;
    assert(resCriarManual.data.agendamento.origem === 'interno', 'Origem registrada como "interno"');
    assert(resCriarManual.data.agendamento.protocolo?.startsWith('OPTO-INT-'), 'Protocolo interno gerado');

    // 10.6 Validação de conflito / sem duplicidade de horário
    const resConflitoDuplicidade = await request('/api/admin/agenda', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        nomeContato: 'Outro Paciente Mesmo Horario',
        telefone: '(11) 91234-5678',
        data: '2026-10-21',
        horario: '09:00',
      },
    });
    assert(resConflitoDuplicidade.status === 400, 'Servidor rejeita duplicidade de horário no mesmo slot (400)');
    assert(
      resConflitoDuplicidade.data.error?.includes('Conflito de agenda'),
      'Mensagem informa conflito de horário com agendamento existente'
    );

    // 10.7 Remarcação com validação de duplicidade e bloqueios
    const resRemarcarConflito = await request(`/api/admin/agenda/${idAgendamentoCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        acao: 'remarcar',
        novaData: '2026-12-25', // Bloqueio Natal
        novoHorario: '14:00',
      },
    });
    assert(resRemarcarConflito.status === 400, 'Remarcação para data com bloqueio é rejeitada (400)');

    const resRemarcarOk = await request(`/api/admin/agenda/${idAgendamentoCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        acao: 'remarcar',
        novaData: '2026-10-21',
        novoHorario: '10:30',
      },
    });
    assert(resRemarcarOk.status === 200, 'Remarcação para horário vago tem sucesso (200)');
    assert(resRemarcarOk.data.agendamento.horario === '10:30', 'Horário atualizado na remarcação');
    assert(resRemarcarOk.data.agendamento.status === 'remarcado', 'Status atualizado para remarcado');

    // 10.8 Confirmação gera mensagem e link formatado para WhatsApp com template cadastrado
    const resConfirmar = await request(`/api/admin/agenda/${idAgendamentoCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: { acao: 'confirmar' },
    });
    assert(resConfirmar.status === 200, 'Confirmação de agendamento retorna 200');
    assert(resConfirmar.data.agendamento.status === 'confirmado', 'Status atualizado para confirmado');
    assert(
      resConfirmar.data.mensagemWhatsapp?.includes('Joaquim Silva Manual'),
      'Mensagem de WhatsApp preenchida com o nome do paciente'
    );
    assert(
      resConfirmar.data.mensagemWhatsapp?.includes('10:30'),
      'Mensagem de WhatsApp preenchida com o horário da consulta'
    );
    assert(
      resConfirmar.data.linkWhatsApp?.includes('api.whatsapp.com'),
      'Link gerado para API do WhatsApp'
    );

    // 10.9 Cancelamento exige motivo obrigatório da lista auxiliar
    const resCancelaSemMotivo = await request(`/api/admin/agenda/${idAgendamentoCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: { acao: 'cancelar' },
    });
    assert(resCancelaSemMotivo.status === 400, 'Cancelamento sem motivo é rejeitado (400)');

    const resCancelaOk = await request(`/api/admin/agenda/${idAgendamentoCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        acao: 'cancelar',
        motivoCancelamentoId: 'mc-01',
        motivoCancelamento: 'Desistência expressa do paciente',
      },
    });
    assert(resCancelaOk.status === 200, 'Cancelamento com motivo válido tem sucesso (200)');
    assert(resCancelaOk.data.agendamento.status === 'cancelado', 'Status atualizado para cancelado');
    assert(
      resCancelaOk.data.agendamento.motivoCancelamento === 'Desistência expressa do paciente',
      'Motivo registrado no agendamento cancelado'
    );

    // 10.10 Auditoria registrou eventos da agenda
    const auditAposAgenda = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temRegistroAgendaCriar = auditAposAgenda.data.logs?.some((l: any) => l.acao === 'agenda.criar');
    const temRegistroAgendaRemarcar = auditAposAgenda.data.logs?.some((l: any) => l.acao === 'agenda.remarcar');
    const temRegistroAgendaCancelar = auditAposAgenda.data.logs?.some((l: any) => l.acao === 'agenda.cancelar');

    assert(temRegistroAgendaCriar, 'Auditoria registrou evento de agenda.criar');
    assert(temRegistroAgendaRemarcar, 'Auditoria registrou evento de agenda.remarcar');
    assert(temRegistroAgendaCancelar, 'Auditoria registrou evento de agenda.cancelar');

    // ------------------------------------------------------------------------
    // 11. MÓDULO PACIENTES & LGPD (PROMPT 08)
    // ------------------------------------------------------------------------
    console.log('\n--- 11. Validação de Regras do Prompt 08 (Pacientes, LGPD e Vínculo de Agendamento) ---');

    // 11.1 Leitura da lista de pacientes com permissão pacientes.ler
    const resGetPacientes = await request('/api/admin/pacientes', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resGetPacientes.status === 200, 'Recepção com pacientes.ler lista pacientes (200)');
    assert(Array.isArray(resGetPacientes.data.pacientes), 'Resposta contém array de pacientes');
    assert(resGetPacientes.data.pacientes.length >= 1, 'Existem pacientes cadastrados no sistema');

    // 11.2 Busca de pacientes por nome, CPF e telefone
    const resBuscaNome = await request('/api/admin/pacientes?busca=Ana%20Beatriz', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resBuscaNome.status === 200, 'Busca por nome retorna 200');
    assert(
      resBuscaNome.data.pacientes.some((p: any) => p.name.includes('Ana Beatriz')),
      'Busca localizou paciente por nome'
    );

    const resBuscaCpf = await request('/api/admin/pacientes?busca=32145678901', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resBuscaCpf.status === 200, 'Busca por CPF sem pontuação retorna 200');
    assert(
      resBuscaCpf.data.pacientes.some((p: any) => p.name.includes('Ana Beatriz')),
      'Busca localizou paciente por dígitos do CPF'
    );

    const resBuscaTel = await request('/api/admin/pacientes?busca=991234567', {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resBuscaTel.status === 200, 'Busca por telefone sem formatação retorna 200');
    assert(
      resBuscaTel.data.pacientes.some((p: any) => p.name.includes('Ana Beatriz')),
      'Busca localizou paciente por telefone'
    );

    // 11.3 Validação de CPF: Rejeita CPF inválido com erro 400
    const resCpfInvalido = await request('/api/admin/pacientes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        name: 'Paciente Teste CPF Invalido',
        cpf: '123.456.789-00', // Dígitos verificadores incorretos
        phone: '(11) 98888-7777',
        birthDate: '1995-05-10',
      },
    });
    assert(resCpfInvalido.status === 400, 'Servidor rejeita CPF inválido com status 400');
    assert(resCpfInvalido.data.error?.includes('CPF inválido'), 'Mensagem informa CPF inválido');

    // Função auxiliar para gerar CPF matematicamente válido para os testes
    function gerarCpfValido(): string {
      const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
      let d1 = 0;
      for (let i = 0; i < 9; i++) d1 += n[i] * (10 - i);
      d1 = 11 - (d1 % 11);
      if (d1 >= 10) d1 = 0;
      n.push(d1);
      let d2 = 0;
      for (let i = 0; i < 10; i++) d2 += n[i] * (11 - i);
      d2 = 11 - (d2 % 11);
      if (d2 >= 10) d2 = 0;
      n.push(d2);
      const s = n.join('');
      return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`;
    }

    const cpfValidoNovo = gerarCpfValido();
    const telUnicoNovo = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 11.4 Criação de paciente com CPF válido e consentimento LGPD
    const resCriarPacienteOk = await request('/api/admin/pacientes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        name: 'Clara Meireles Nova',
        cpf: cpfValidoNovo,
        birthDate: '1992-08-15',
        gender: 'F',
        phone: telUnicoNovo,
        email: 'clara.meireles@exemplo.com.br',
        healthInsurance: 'Bradesco Saúde',
        profession: 'Arquiteta',
        address: {
          street: 'Alameda Santos',
          number: '800',
          neighborhood: 'Cerqueira César',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01418-002',
        },
        anamnesis: {
          chiefComplaint: 'Dificuldade de foco no computador ao entardecer.',
          wearsGlasses: true,
          wearsContactLenses: false,
          allergies: 'Rinite',
        },
        consentimentoLgpd: {
          aceito: true,
          versao: '1.0',
          canal: 'presencial',
        },
      },
    });
    assert(resCriarPacienteOk.status === 201, 'Criação de paciente com CPF e LGPD retorna 201');
    const idPacienteCriado = resCriarPacienteOk.data.paciente.id;
    assert(resCriarPacienteOk.data.paciente.consentimentoLgpd?.aceito === true, 'Consentimento LGPD gravado como ativo');
    assert(resCriarPacienteOk.data.paciente.consentimentoLgpd?.versao === '1.0', 'Versão da política LGPD registrada');

    // 11.5 Verificação de duplicados prévia (409 Conflict se tentar mesmo CPF sem ignorarDuplicado)
    const resDuplicadoCpf = await request('/api/admin/pacientes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        name: 'Outro Nome Mesmo Cpf',
        cpf: cpfValidoNovo,
        phone: '(11) 91111-2222',
        birthDate: '1990-01-01',
      },
    });
    assert(resDuplicadoCpf.status === 409, 'Cadastro com CPF duplicado retorna conflito 409');
    assert(resDuplicadoCpf.data.error?.includes('Já existe um paciente cadastrado com este CPF'), 'Mensagem alerta duplicidade de CPF');

    // 11.6 Ficha Completa do Paciente com Histórico (Agendamentos, Atendimentos e Receitas)
    const resFichaPaciente = await request(`/api/admin/pacientes/${idPacienteCriado}`, {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resFichaPaciente.status === 200, 'Visualização da ficha do paciente retorna 200');
    assert(resFichaPaciente.data.paciente.name === 'Clara Meireles Nova', 'Ficha retorna dados cadastrais do paciente');
    assert(Array.isArray(resFichaPaciente.data.historicoAgendamentos), 'Ficha inclui histórico de agendamentos');
    assert(Array.isArray(resFichaPaciente.data.historicoAtendimentos), 'Ficha inclui histórico de atendimentos/exames');
    assert(Array.isArray(resFichaPaciente.data.historicoReceitas), 'Ficha inclui histórico de receitas ópticas');

    // 11.7 Edição de dados cadastrais do paciente
    const resEditarPaciente = await request(`/api/admin/pacientes/${idPacienteCriado}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        profession: 'Arquiteta e Urbanista Sênior',
        notes: 'Paciente muito exigente com nitidez para telas de AutoCAD.',
      },
    });
    assert(resEditarPaciente.status === 200, 'Edição de paciente retorna 200');
    assert(
      resEditarPaciente.data.paciente.profession === 'Arquiteta e Urbanista Sênior',
      'Profissão do paciente atualizada'
    );

    // 11.8 "Desative em vez de excluir" (Soft Delete)
    // Recepção sem pacientes.excluir é bloqueada (403)
    const resDesativarRecep = await request(`/api/admin/pacientes/${idPacienteCriado}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resDesativarRecep.status === 403, 'Recepção sem pacientes.excluir recebe 403 ao tentar desativar paciente');

    // Admin com pacientes.excluir executa a desativação com sucesso
    const resDesativar = await request(`/api/admin/pacientes/${idPacienteCriado}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resDesativar.status === 200, 'Admin desativa paciente com sucesso (200)');
    assert(resDesativar.data.paciente.ativo === false, 'Paciente marcado como inativo (ativo = false)');

    // Confirma que o paciente AINDA EXISTE no sistema quando solicitado com incluirDesativados=true
    const resVerificaInativo = await request(`/api/admin/pacientes?incluirDesativados=true`, {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const achouInativo = resVerificaInativo.data.pacientes?.some((p: any) => p.id === idPacienteCriado && p.ativo === false);
    assert(achouInativo, 'Paciente desativado preservado no sistema para integridade do histórico médico');

    // Reativação
    const resReativar = await request(`/api/admin/pacientes/${idPacienteCriado}/reativar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resReativar.status === 200, 'Reativação de paciente retorna 200');
    assert(resReativar.data.paciente.ativo === true, 'Paciente reativado com ativo = true');

    // 11.9 Ao atender um agendamento, vincule ou crie o paciente automaticamente
    const telPacienteAuto = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;
    const tsOffset = Date.now();
    const dUnique = new Date(Date.now() + (30 + (tsOffset % 150)) * 24 * 60 * 60 * 1000);
    if (dUnique.getDay() === 0) dUnique.setDate(dUnique.getDate() + 1);
    if (dUnique.getDay() === 6) dUnique.setDate(dUnique.getDate() + 2);
    const dataUnica = dUnique.toISOString().split('T')[0];
    const horaUnica = `${15 + (tsOffset % 3)}:${['00', '15', '30'][tsOffset % 3]}`;

    const resAgendamentoParaAtender = await request('/api/admin/agenda', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: {
        nomeContato: 'Mariana Auto Paciente',
        telefone: telPacienteAuto,
        email: 'mariana.auto@exemplo.com.br',
        data: dataUnica,
        horario: horaUnica,
        duracaoMin: 15,
        observacoes: 'Primeira consulta de refração',
      },
    });
    if (resAgendamentoParaAtender.status !== 201) {
      console.error('Falha ao criar agendamento:', resAgendamentoParaAtender.status, resAgendamentoParaAtender.data);
    }
    assert(resAgendamentoParaAtender.status === 201, 'Agendamento sem paciente pré-vinculado criado');
    const idAgendamentoAuto = resAgendamentoParaAtender.data?.agendamento?.id;

    // Atender a consulta -> Deve criar o paciente automaticamente e vincular
    const resAtenderAuto = await request(`/api/admin/agenda/${idAgendamentoAuto}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: { acao: 'atendido' },
    });
    assert(resAtenderAuto.status === 200, 'Atendimento de agendamento retorna 200');
    assert(resAtenderAuto.data.agendamento.status === 'atendido', 'Status do agendamento marcado como atendido');
    assert(resAtenderAuto.data.agendamento.pacienteId, 'Paciente criado e vinculado automaticamente ao agendamento');

    // Vínculo explícito de paciente existente a um agendamento
    const resVincularExplicito = await request(`/api/admin/agenda/${idAgendamentoAuto}/vincular-paciente`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: { pacienteId: idPacienteCriado },
    });
    assert(resVincularExplicito.status === 200, 'Vínculo explícito de paciente ao agendamento retorna 200');
    assert(resVincularExplicito.data.agendamento.pacienteId === idPacienteCriado, 'Agendamento vinculado ao ID do paciente indicado');

    // 11.10 Exportação de dados do paciente: Apenas Administrador
    const resExportRecepcao = await request(`/api/admin/pacientes/${idPacienteCriado}/exportar`, {
      headers: { Authorization: `Bearer ${tokenRecep}` },
    });
    assert(resExportRecepcao.status === 403, 'Recepção é bloqueada ao tentar exportar prontuário LGPD (403)');

    const resExportAdmin = await request(`/api/admin/pacientes/${idPacienteCriado}/exportar`, {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resExportAdmin.status === 200, 'Administrador exporta dossiê completo LGPD com sucesso (200)');
    assert(resExportAdmin.data.dossie?.paciente?.id === idPacienteCriado, 'Dossiê inclui dados do paciente');
    assert(resExportAdmin.data.dossie?.termoResponsabilidade, 'Dossiê inclui termo de responsabilidade da LGPD');

    // 11.11 Anonimização de dados do paciente: Apenas Administrador, com confirmação obrigatória
    const resAnonRecepcao = await request(`/api/admin/pacientes/${idPacienteCriado}/anonimizar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecep}` },
      body: { confirmacao: true },
    });
    assert(resAnonRecepcao.status === 403, 'Recepção é bloqueada ao tentar anonimizar paciente (403)');

    // Admin sem confirmação expressa é rejeitado (400)
    const resAnonSemConfirmacao = await request(`/api/admin/pacientes/${idPacienteCriado}/anonimizar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {},
    });
    assert(resAnonSemConfirmacao.status === 400, 'Anonimização sem confirmação é rejeitada (400)');

    // Admin com confirmação expressa tem sucesso (200)
    const resAnonOk = await request(`/api/admin/pacientes/${idPacienteCriado}/anonimizar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { confirmacao: true },
    });
    assert(resAnonOk.status === 200, 'Administrador anonimiza paciente com confirmação com sucesso (200)');
    assert(resAnonOk.data.paciente.anonimizado === true, 'Paciente marcado como anonimizado');
    assert(resAnonOk.data.paciente.name.includes('Paciente Anonimizado'), 'Nome pessoal substituído por etiqueta anônima');
    assert(resAnonOk.data.paciente.phone === '(00) 00000-0000', 'Telefone pessoal anonimizado');

    // 11.12 Trilha de auditoria registrou todos os eventos do ciclo de vida do paciente
    const auditAposPacientes = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temRegistroPacienteCriar = auditAposPacientes.data.logs?.some((l: any) => l.acao === 'paciente.criar');
    const temRegistroPacienteEditar = auditAposPacientes.data.logs?.some((l: any) => l.acao === 'paciente.editar');
    const temRegistroPacienteDesativar = auditAposPacientes.data.logs?.some((l: any) => l.acao === 'paciente.desativar');
    const temRegistroPacienteExportar = auditAposPacientes.data.logs?.some((l: any) => l.acao === 'paciente.exportar');
    const temRegistroPacienteAnonimizar = auditAposPacientes.data.logs?.some((l: any) => l.acao === 'paciente.anonimizar');

    assert(temRegistroPacienteCriar, 'Auditoria registrou evento de paciente.criar');
    assert(temRegistroPacienteEditar, 'Auditoria registrou evento de paciente.editar');
    assert(temRegistroPacienteDesativar, 'Auditoria registrou evento de paciente.desativar');
    assert(temRegistroPacienteExportar, 'Auditoria registrou evento de paciente.exportar');
    assert(temRegistroPacienteAnonimizar, 'Auditoria registrou evento de paciente.anonimizar');

    // ------------------------------------------------------------------------
    // 12. Validação de Regras do Prompt 09 (Atendimento Clínico & Receitas Ópticas)
    // ------------------------------------------------------------------------
    console.log('\n--- 12. Validação de Regras do Prompt 09 (Atendimento Clínico & Receitas Ópticas) ---');

    // 12.1 Segregação Deontológica: Recepção não pode criar atendimento nem emitir receita
    const resRecepCriarAtendimento = await request('/api/admin/atendimento', {
      method: 'POST',
      headers: recepHeaders,
      body: { pacienteId: 'pat-001' },
    });
    assert(resRecepCriarAtendimento.status === 403, 'Recepção recebe 403 ao tentar criar atendimento clínico');

    const resRecepCriarReceita = await request('/api/admin/receitas', {
      method: 'POST',
      headers: recepHeaders,
      body: { pacienteId: 'pat-001' },
    });
    assert(resRecepCriarReceita.status === 403, 'Recepção recebe 403 ao tentar emitir receita óptica');

    // 12.2 Optometrista lista atendimentos existentes
    const resOptoListarAtendimentos = await request('/api/admin/atendimento', {
      headers: optoHeaders,
    });
    assert(resOptoListarAtendimentos.status === 200, 'Optometrista lista atendimentos clínicos com sucesso (200)');
    assert(Array.isArray(resOptoListarAtendimentos.data.atendimentos), 'Resposta contém array de atendimentos');

    // 12.3 Optometrista cria atendimento clínico completo
    const resCriarAtendimento = await request('/api/admin/atendimento', {
      method: 'POST',
      headers: optoHeaders,
      body: {
        pacienteId: 'pat-001',
        anamnese: {
          motivoConsulta: 'Avaliação de rotina anual',
          queixaPrincipal: 'Cansaço visual ao fim do dia',
          usaOculos: true,
          usaLentesContato: false,
        },
        acuidadeVisual: {
          sc: { od: '20/40', oe: '20/40' },
          cc: { od: '20/20', oe: '20/20' },
        },
        refracao: {
          od: { esferico: -1.75, cilindrico: -0.75, eixo: 180, dnp: 31.0 },
          oe: { esferico: -1.50, cilindrico: -0.50, eixo: 175, dnp: 31.5 },
          dpTotal: 62.5,
        },
        ceratometria: {
          od: { k1: 43.25, k2: 44.00, eixo: 180 },
          oe: { k1: 43.50, k2: 44.25, eixo: 175 },
        },
        pressaoIntraocular: {
          od: 14,
          oe: 15,
          metodo: 'Sopro de ar / Aplanação',
        },
        observacoes: 'Segmento anterior calmo, sem alterações córneo-conjuntivais.',
        condutaDiagnostica: 'Prescrição de lentes oftálmicas monofocais com filtro blue control.',
        concluir: true,
      },
    });
    assert(resCriarAtendimento.status === 201, 'Optometrista registra atendimento clínico completo com sucesso (201)');
    const idAtendimentoCriado = resCriarAtendimento.data.atendimento.id;
    assert(resCriarAtendimento.data.atendimento.status === 'finalizado', 'Atendimento finalizado com status correto');
    assert(resCriarAtendimento.data.atendimento.pacienteNome === 'Ana Beatriz Souza', 'Nome do paciente vinculado ao atendimento');

    // 12.4 Validação de Campos Obrigatórios na Emissão de Receita
    // Eixo obrigatório se cilindro for informado e diferente de zero
    const resReceitaSemEixo = await request('/api/admin/receitas', {
      method: 'POST',
      headers: optoHeaders,
      body: {
        pacienteId: 'pat-001',
        atendimentoId: idAtendimentoCriado,
        tabelaRefracao: {
          od: { esferico: -2.0, cilindrico: -1.0 }, // falta eixo!
          oe: { esferico: -2.0, cilindrico: 0, eixo: 0 },
        },
      },
    });
    assert(resReceitaSemEixo.status === 400, 'Servidor rejeita receita com cilindro preenchido sem o respectivo eixo (400)');
    assert(resReceitaSemEixo.data.error.includes('Eixo'), 'Mensagem alerta sobre campo obrigatório de Eixo');

    // 12.5 Emissão da 1ª Receita Válida com Numeração Sequencial Atômica e Snapshots Congelados
    const resReceita1 = await request('/api/admin/receitas', {
      method: 'POST',
      headers: optoHeaders,
      body: {
        pacienteId: 'pat-001',
        atendimentoId: idAtendimentoCriado,
        tabelaRefracao: {
          od: { esferico: -1.75, cilindrico: -0.75, eixo: 180, dnp: 31.0 },
          oe: { esferico: -1.50, cilindrico: -0.50, eixo: 175, dnp: 31.5 },
        },
        tipoLente: 'Monofocal Digital Blue Control',
        tratamentos: ['Anti-reflexo Premium', 'Filtro Luz Azul UV420'],
        observacoes: 'Uso contínuo para leitura e computador.',
        recomendacoes: 'Revisão óptica preventiva em 12 meses.',
      },
    });
    assert(resReceita1.status === 201, 'Emissão da 1ª receita óptica tem sucesso (201)');
    const idReceita1 = resReceita1.data.receita.id;
    const numSeq1 = resReceita1.data.receita.numeroSequencial;
    const numFormatado1 = resReceita1.data.receita.numeroFormatado;
    assert(typeof numSeq1 === 'number' && numSeq1 >= 1, 'Receita possui número sequencial numérico');
    assert(numFormatado1.includes(String(new Date().getFullYear())), 'Número formatado inclui ano corrente');
    assert(resReceita1.data.receita.status === 'emitida', 'Status inicial é emitida');
    assert(resReceita1.data.receita.snapshotConsultorio.razaoSocial !== undefined, 'Snapshot fiel do consultório congelado na receita');
    assert(resReceita1.data.receita.snapshotProfissional.nome !== undefined, 'Snapshot fiel do profissional congelado na receita');
    assert(resReceita1.data.receita.snapshotPaciente.nome === 'Ana Beatriz Souza', 'Snapshot fiel do paciente congelado na receita');

    // 12.6 Emissão da 2ª Receita: Garantia de numeração sequencial sem lacunas (n + 1)
    const resReceita2 = await request('/api/admin/receitas', {
      method: 'POST',
      headers: optoHeaders,
      body: {
        pacienteId: 'pat-001',
        tabelaRefracao: {
          od: { esferico: -1.0, cilindrico: 0, eixo: 0, dnp: 32.0 },
          oe: { esferico: -1.0, cilindrico: 0, eixo: 0, dnp: 32.0 },
        },
        tipoLente: 'Monofocal Esférica',
      },
    });
    assert(resReceita2.status === 201, 'Emissão da 2ª receita óptica tem sucesso (201)');
    const numSeq2 = resReceita2.data.receita.numeroSequencial;
    assert(numSeq2 === numSeq1 + 1, 'Numeração sequencial atômica sem lacunas garantida (Seq2 = Seq1 + 1)');

    // 12.7 Imutabilidade: Rejeição expressa de PUT e DELETE em receitas já emitidas
    const resTentarEditarReceita = await request(`/api/admin/receitas/${idReceita1}`, {
      method: 'PUT',
      headers: optoHeaders,
      body: { tipoLente: 'Tentativa de alteração pós emissão' },
    });
    assert(resTentarEditarReceita.status === 400, 'Servidor rejeita PUT em receita emitida protegendo a imutabilidade jurídica (400)');
    assert(resTentarEditarReceita.data.error.includes('imutável') || resTentarEditarReceita.data.error.includes('não podem ser editadas'), 'Mensagem informa que receitas emitidas não podem ser alteradas');

    const resTentarDeletarReceita = await request(`/api/admin/receitas/${idReceita1}`, {
      method: 'DELETE',
      headers: optoHeaders,
    });
    assert(resTentarDeletarReceita.status === 400, 'Servidor rejeita exclusão DELETE de receita emitida (400)');
    assert(resTentarDeletarReceita.data.error.includes('cancelamento'), 'Mensagem instrui sobre cancelamento formal');

    // 12.8 Cancelamento com Justificativa Obrigatória e Auditoria
    const resCancelarSemMotivo = await request(`/api/admin/receitas/${idReceita1}/cancelar`, {
      method: 'POST',
      headers: optoHeaders,
      body: { motivo: '' },
    });
    assert(resCancelarSemMotivo.status === 400, 'Cancelamento sem motivo é rejeitado (400)');

    const resCancelarComMotivo = await request(`/api/admin/receitas/${idReceita1}/cancelar`, {
      method: 'POST',
      headers: optoHeaders,
      body: { motivo: 'Ajuste de eixo solicitado pelo paciente após segundo teste refrativo.' },
    });
    assert(resCancelarComMotivo.status === 200, 'Cancelamento de receita com motivo válido tem sucesso (200)');
    assert(resCancelarComMotivo.data.receita.cancelada === true, 'Receita marcada como cancelada');
    assert(resCancelarComMotivo.data.receita.status === 'cancelada', 'Status atualizado para cancelada');
    assert(resCancelarComMotivo.data.receita.motivoCancelamento.includes('Ajuste de eixo'), 'Motivo registrado na receita');

    // Rejeita segundo cancelamento da mesma receita
    const resCancelarNovamente = await request(`/api/admin/receitas/${idReceita1}/cancelar`, {
      method: 'POST',
      headers: optoHeaders,
      body: { motivo: 'Tentando cancelar de novo' },
    });
    assert(resCancelarNovamente.status === 400, 'Servidor rejeita cancelamento repetido de receita já cancelada (400)');

    // 12.9 Reimpressão de Receita (2ª via oficial com incremento e auditoria)
    const idReceita2 = resReceita2.data.receita.id;
    const resReimprimir = await request(`/api/admin/receitas/${idReceita2}/reimprimir`, {
      method: 'POST',
      headers: optoHeaders,
    });
    assert(resReimprimir.status === 200, 'Reimpressão de receita tem sucesso (200)');
    assert(resReimprimir.data.contagemReimpressoes === 1, 'Contador de 2ª via incrementado para 1');

    // 12.10 Envio por WhatsApp / E-mail com Token Temporário Expirável (7 dias)
    const resEnviarWhatsapp = await request(`/api/admin/receitas/${idReceita2}/enviar`, {
      method: 'POST',
      headers: optoHeaders,
      body: { tipo: 'whatsapp', destinatario: '(11) 99123-4567' },
    });
    assert(resEnviarWhatsapp.status === 200, 'Envio por WhatsApp tem sucesso (200)');
    assert(resEnviarWhatsapp.data.linkTemporario !== undefined, 'Link temporário seguro gerado');
    assert(resEnviarWhatsapp.data.tokenAcessoTemporario !== undefined, 'Token de acesso temporário gerado');
    assert(resEnviarWhatsapp.data.textoWhatsapp.includes('link seguro'), 'Texto pré-formatado para WhatsApp inclui link');

    // 12.11 Consulta Pública de Receita Digital via Token Expirável (Sem Autenticação)
    const tokenPublico = resEnviarWhatsapp.data.tokenAcessoTemporario;
    const resPublicaValida = await request(`/api/public/receita-digital/${tokenPublico}`);
    assert(resPublicaValida.status === 200, 'Paciente acessa receita digital pública sem credenciais (200)');
    assert(resPublicaValida.data.receita.numeroFormatado !== undefined, 'Dados oficiais da receita retornados para o paciente');

    const resPublicaInvalida = await request('/api/public/receita-digital/token-falso-inexistente');
    assert(resPublicaInvalida.status === 404, 'Token temporário inexistente retorna 404');

    // 12.12 Histórico Clínico Atualizado na Ficha do Paciente
    const resFichaPacienteAtualizada = await request('/api/admin/pacientes/pat-001', {
      headers: optoHeaders,
    });
    assert(resFichaPacienteAtualizada.status === 200, 'Ficha do paciente obtida com sucesso (200)');
    const temAtendimentoNaLista = resFichaPacienteAtualizada.data.historicoAtendimentos?.some((a: any) => a.id === idAtendimentoCriado);
    assert(temAtendimentoNaLista, 'Novo atendimento consta no prontuário do paciente');
    const temReceitaNaLista = resFichaPacienteAtualizada.data.historicoReceitas?.some((r: any) => r.id === idReceita1 || r.id === idReceita2);
    assert(temReceitaNaLista, 'Novas receitas constam no histórico de receitas do paciente');

    // 12.13 Auditoria Completa dos Eventos de Atendimento e Receitas
    const auditAposReceitas = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temAuditAtendimentoCriar = auditAposReceitas.data.logs?.some((l: any) => l.acao === 'atendimento.criar');
    const temAuditReceitaCriar = auditAposReceitas.data.logs?.some((l: any) => l.acao === 'receita.criar');
    const temAuditReceitaCancelar = auditAposReceitas.data.logs?.some((l: any) => l.acao === 'receita.cancelar');
    const temAuditReceitaReimprimir = auditAposReceitas.data.logs?.some((l: any) => l.acao === 'receita.reimprimir');
    const temAuditReceitaEnviar = auditAposReceitas.data.logs?.some((l: any) => l.acao === 'receita.enviar');

    assert(temAuditAtendimentoCriar, 'Auditoria registrou evento de atendimento.criar');
    assert(temAuditReceitaCriar, 'Auditoria registrou evento de receita.criar');
    assert(temAuditReceitaCancelar, 'Auditoria registrou evento de receita.cancelar');
    assert(temAuditReceitaReimprimir, 'Auditoria registrou evento de receita.reimprimir');
    assert(temAuditReceitaEnviar, 'Auditoria registrou evento de receita.enviar');

    // ------------------------------------------------------------------------
    // 13. Validação de Regras do Prompt 10 (Financeiro & Caixa do Consultório)
    // ------------------------------------------------------------------------
    console.log('\n--- 13. Validação de Regras do Prompt 10 (Módulo Financeiro & Fluxo de Caixa) ---');

    // 13.1 Segregação Deontológica de Acesso ao Financeiro
    const recepAcessoFin = await request('/api/admin/financeiro', { headers: recepHeaders });
    assert(recepAcessoFin.status === 403, 'Recepção não autorizada recebe 403 no financeiro');

    const optoAcessoFin = await request('/api/admin/financeiro', { headers: optoHeaders });
    assert(optoAcessoFin.status === 403, 'Optometrista recebe 403 ao tentar acessar o financeiro');

    const finAcessoOk = await request('/api/admin/financeiro', { headers: finHeaders });
    assert(finAcessoOk.status === 200, 'Operador Financeiro acessa /api/admin/financeiro (200)');
    assert(Array.isArray(finAcessoOk.data.transacoes), 'Resposta contém array de movimentações financeiras');

    // 13.2 Estrutura de Resumo e Valores em Centavos
    const resumoFin = finAcessoOk.data.resumo;
    assert(typeof resumoFin.totalIncomeInCents === 'number', 'Total de receitas retornado em centavos');
    assert(typeof resumoFin.totalExpenseInCents === 'number', 'Total de despesas retornado em centavos');
    assert(typeof resumoFin.balanceInCents === 'number', 'Saldo em caixa calculado em centavos');
    assert(typeof resumoFin.forecastBalanceInCents === 'number', 'Saldo previsto calculado em centavos');

    // 13.3 Alertas de Vencimento (Hoje e Atrasadas)
    assert(finAcessoOk.data.alertas !== undefined, 'Objeto de alertas presente');
    assert(Array.isArray(finAcessoOk.data.alertas.vencendoHoje), 'Lista de contas vencendo hoje retornada');
    assert(Array.isArray(finAcessoOk.data.alertas.atrasadas), 'Lista de contas atrasadas retornada');

    // 13.4 Demonstrativo de Fluxo de Caixa Mensal e Totais por Categoria
    assert(Array.isArray(finAcessoOk.data.fluxoCaixaMensal), 'Array de fluxo de caixa mensal retornado');
    assert(finAcessoOk.data.fluxoCaixaMensal.length > 0, 'Existem meses calculados no fluxo de caixa');
    assert(typeof finAcessoOk.data.fluxoCaixaMensal[0].receitasCentavos === 'number', 'Receitas mensais em centavos');
    assert(typeof finAcessoOk.data.fluxoCaixaMensal[0].despesasCentavos === 'number', 'Despesas mensais em centavos');

    assert(Array.isArray(finAcessoOk.data.totaisPorCategoria), 'Array de totais por categoria retornado');
    assert(finAcessoOk.data.totaisPorCategoria.length > 0, 'Existem categorias totalizadas no financeiro');
    assert(typeof finAcessoOk.data.totaisPorCategoria[0].percentual === 'number', 'Percentual por categoria calculado');

    // 13.5 Conta a Receber Vinculada a Atendimento e Paciente (Prompt 10)
    const resNovaReceita = await request('/api/admin/financeiro', {
      method: 'POST',
      headers: finHeaders,
      body: {
        type: 'receita',
        description: 'Exame de Refração Particular - Paciente Vinculado',
        amountInCents: 18000, // R$ 180,00
        status: 'pendente',
        dueDate: '2027-04-10',
        categoryId: 'srv-01',
        categoryName: 'Exame de Refração Completo',
        paymentMethodId: 'fp-01',
        paymentMethodName: 'Pix (Chave ou QR Code)',
        patientId: 'pat-001',
        patientName: 'Ana Beatriz Souza',
        atendimentoId: idAtendimentoCriado,
        notes: 'Honorário clínico vinculado ao atendimento optométrico.',
      },
    });
    assert(resNovaReceita.status === 201, 'Lançamento de conta a receber vinculada a atendimento criado com sucesso (201)');
    const idContaReceber = resNovaReceita.data.transacao.id;
    assert(resNovaReceita.data.transacao.patientId === 'pat-001', 'Conta a receber possui patientId vinculado');
    assert(resNovaReceita.data.transacao.atendimentoId === idAtendimentoCriado, 'Conta a receber possui atendimentoId vinculado');

    // 13.6 Lançamento de Conta a Pagar com Recorrência Mensal e Anexo de Comprovante
    const comprovanteTesteSvg = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><rect width="100" height="30" fill="#ccc"/><text x="5" y="20">RECIBO</text></svg>').toString('base64')}`;
    const resNovaDespesa = await request('/api/admin/financeiro', {
      method: 'POST',
      headers: finHeaders,
      body: {
        type: 'despesa',
        description: 'Assinatura Mensal de Internet Fibra Óptica',
        amountInCents: 19990, // R$ 199,90
        status: 'pendente',
        dueDate: '2027-04-15',
        categoryId: 'cd-03',
        categoryName: 'Internet & Telefonia',
        paymentMethodId: 'fp-01',
        paymentMethodName: 'Pix (Chave ou QR Code)',
        supplierName: 'Provedor Telecom SP',
        isRecurring: true,
        recurringFrequency: 'mensal',
        receiptUrl: comprovanteTesteSvg,
        receiptName: 'recibo_provedor_teste.svg',
        notes: 'Custo fixo essencial para recepção e emissão de receitas.',
      },
    });
    assert(resNovaDespesa.status === 201, 'Lançamento de conta a pagar recorrente com comprovante criado com sucesso (201)');
    const idContaPagar = resNovaDespesa.data.transacao.id;
    assert(resNovaDespesa.data.transacao.isRecurring === true, 'Despesa registrada com recorrência mensal');
    assert(resNovaDespesa.data.transacao.receiptUrl !== undefined, 'Anexo de comprovante salvo na despesa');

    // 13.7 Parcelamento Simples (Divisão Exata de Centavos em N Parcelas)
    const resParcelamento = await request('/api/admin/financeiro', {
      method: 'POST',
      headers: finHeaders,
      body: {
        type: 'receita',
        description: 'Pacote de Treinamento Visual e Óculos',
        amountInCents: 35000, // R$ 350,00 em 3x (11668 + 11666 + 11666 = 35000)
        status: 'pendente',
        dueDate: '2027-05-01',
        categoryId: 'srv-01',
        categoryName: 'Exame de Refração Completo',
        paymentMethodId: 'fp-05',
        paymentMethodName: 'Cartão de Crédito Parcelado',
        patientId: 'pat-001',
        patientName: 'Ana Beatriz Souza',
        parcelas: 3,
      },
    });
    assert(resParcelamento.status === 201, 'Lançamento parcelado criado com sucesso (201)');
    assert(Array.isArray(resParcelamento.data.transacoes), 'Retornou array de parcelas geradas');
    assert(resParcelamento.data.transacoes.length === 3, 'Gerou exatamente 3 parcelas');
    const somaParcelas = resParcelamento.data.transacoes.reduce((acc: number, p: any) => acc + p.amountInCents, 0);
    assert(somaParcelas === 35000, 'Soma das parcelas é idêntica ao valor total em centavos sem perda de dízima');
    assert(resParcelamento.data.transacoes[0].installmentNumber === 1, 'Primeira parcela identificada como 1');
    assert(resParcelamento.data.transacoes[2].installmentNumber === 3, 'Última parcela identificada como 3');

    // 13.8 Baixa com Data e Registro em Auditoria
    const resBaixa = await request(`/api/admin/financeiro/${idContaReceber}/baixar`, {
      method: 'POST',
      headers: finHeaders,
      body: {
        paymentDate: '2027-04-10',
        paymentMethodId: 'fp-01',
        paymentMethodName: 'Pix (Chave ou QR Code)',
        notes: 'Baixa liquidada pelo paciente via Pix QR Code.',
      },
    });
    assert(resBaixa.status === 200, 'Baixa efetuada com sucesso (200)');
    assert(resBaixa.data.transacao.status === 'pago', 'Status atualizado para pago após baixa');
    assert(resBaixa.data.transacao.paymentDate === '2027-04-10', 'Data da baixa gravada corretamente');
    assert(resBaixa.data.transacao.paidBy !== undefined, 'Usuário responsável pela baixa registrado');

    // 13.9 Cancelamento Formal de Movimentação com Justificativa Obrigatória
    const resCancelarFinSemMotivo = await request(`/api/admin/financeiro/${idContaPagar}/cancelar`, {
      method: 'POST',
      headers: finHeaders,
      body: { motivo: '' },
    });
    assert(resCancelarFinSemMotivo.status === 400, 'Servidor rejeita cancelamento de movimentação sem motivo (400)');

    const resCancelarFinComMotivo = await request(`/api/admin/financeiro/${idContaPagar}/cancelar`, {
      method: 'POST',
      headers: finHeaders,
      body: { motivo: 'Fatura cancelada e substituída pela operadora de telefonia.' },
    });
    assert(resCancelarFinComMotivo.status === 200, 'Cancelamento formal de movimentação tem sucesso (200)');
    assert(resCancelarFinComMotivo.data.transacao.status === 'cancelado', 'Status atualizado para cancelado');
    assert(resCancelarFinComMotivo.data.transacao.canceledReason.includes('substituída'), 'Motivo formal registrado na transação');

    // Rejeição de baixa em conta cancelada
    const resBaixaCancelada = await request(`/api/admin/financeiro/${idContaPagar}/baixar`, {
      method: 'POST',
      headers: finHeaders,
      body: { paymentDate: '2027-04-15' },
    });
    assert(resBaixaCancelada.status === 400, 'Servidor bloqueia baixa em conta cancelada (400)');

    // Rejeição de cancelamento repetido
    const resCancelarRepetido = await request(`/api/admin/financeiro/${idContaPagar}/cancelar`, {
      method: 'POST',
      headers: finHeaders,
      body: { motivo: 'Tentando cancelar de novo' },
    });
    assert(resCancelarRepetido.status === 400, 'Servidor rejeita cancelamento repetido de conta já cancelada (400)');

    // 13.10 Exportação de Relatório Financeiro em CSV (RFC-4180 com UTF-8 BOM)
    const resExportarCsvRecep = await request('/api/admin/financeiro/exportar-csv', { headers: recepHeaders });
    assert(resExportarCsvRecep.status === 403, 'Recepção bloqueada ao tentar exportar CSV financeiro (403)');

    const resExportarCsv = await request('/api/admin/financeiro/exportar-csv', { headers: finHeaders });
    assert(resExportarCsv.status === 200, 'Exportação de CSV financeiro retorna 200 para Financeiro');
    const csvTexto = typeof resExportarCsv.data === 'string' ? resExportarCsv.data : JSON.stringify(resExportarCsv.data);
    assert(csvTexto.includes('Tipo') && csvTexto.includes('Valor (R$)'), 'CSV contém cabeçalhos definidos na RFC-4180');

    // 13.11 Auditoria Completa dos Eventos Financeiros
    const auditAposFin = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const temAuditFinCriar = auditAposFin.data.logs?.some((l: any) => l.acao === 'financeiro.criar');
    const temAuditFinBaixar = auditAposFin.data.logs?.some((l: any) => l.acao === 'financeiro.baixar');
    const temAuditFinCancelar = auditAposFin.data.logs?.some((l: any) => l.acao === 'financeiro.cancelar');

    assert(temAuditFinCriar, 'Auditoria registrou evento de financeiro.criar');
    assert(temAuditFinBaixar, 'Auditoria registrou evento de financeiro.baixar');
    assert(temAuditFinCancelar, 'Auditoria registrou evento de financeiro.cancelar');

    // ------------------------------------------------------------------------
    // 14. Validação de Regras do Prompt 11 (Relatórios Impressos & Conformidade LGPD)
    // ------------------------------------------------------------------------
    console.log('\n--- 14. Validação de Regras do Prompt 11 (Relatórios Impressos & Layout A4) ---');

    // 14.1 Catálogo de Relatórios Filtrado por Papel
    const resCatalogoAdmin = await request('/api/admin/relatorios', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resCatalogoAdmin.status === 200, 'Administrador consulta catálogo de relatórios (200)');
    assert(resCatalogoAdmin.data.relatorios.length === 10, 'Administrador visualiza todos os 10 modelos de relatórios');

    const resCatalogoRecep = await request('/api/admin/relatorios', { headers: recepHeaders });
    assert(resCatalogoRecep.status === 200, 'Recepção acessa catálogo de relatórios (200)');
    const recepTemFin = resCatalogoRecep.data.relatorios.some((r: any) => r.permissao === 'financeiro.ler');
    assert(!recepTemFin, 'Recepção NÃO visualiza relatórios financeiros no catálogo');

    const resCatalogoOpto = await request('/api/admin/relatorios', { headers: optoHeaders });
    assert(resCatalogoOpto.status === 200, 'Optometrista acessa catálogo de relatórios (200)');
    const optoTemFin = resCatalogoOpto.data.relatorios.some((r: any) => r.permissao === 'financeiro.ler');
    assert(!optoTemFin, 'Optometrista NÃO visualiza relatórios financeiros no catálogo');

    // 14.2 Bloqueio no Servidor de Emissão Não Autorizada (403 Forbidden)
    const resRecepEmiteFinanceiro = await request('/api/admin/relatorios/dados?tipo=contas_receber', { headers: recepHeaders });
    assert(resRecepEmiteFinanceiro.status === 403, 'Recepção recebe 403 Forbidden ao tentar emitir Contas a Receber');

    const resRecepEmiteAtendimentos = await request('/api/admin/relatorios/dados?tipo=atendimentos', { headers: recepHeaders });
    assert(resRecepEmiteAtendimentos.status === 403, 'Recepção recebe 403 Forbidden ao tentar emitir Atendimentos Clínicos');

    const resOptoEmiteFinanceiro = await request('/api/admin/relatorios/dados?tipo=fluxo_caixa', { headers: optoHeaders });
    assert(resOptoEmiteFinanceiro.status === 403, 'Optometrista recebe 403 Forbidden ao tentar emitir Fluxo de Caixa');

    // 14.3 Emissão Autorizada de Relatórios Clínicos e Agenda
    const resAgendaRel = await request('/api/admin/relatorios/dados?tipo=agenda', { headers: recepHeaders });
    assert(resAgendaRel.status === 200, 'Recepção emite Relatório de Agenda com sucesso (200)');
    assert(resAgendaRel.data.relatorio.colunas.includes('Paciente'), 'Relatório de Agenda contém coluna Paciente');
    assert(resAgendaRel.data.relatorio.totais.length > 0, 'Relatório de Agenda possui consolidação de totais');
    assert(resAgendaRel.data.relatorio.consultorio.nomeFantasia !== undefined, 'Cabeçalho inclui dados do consultório');

    const resAtendimentosRel = await request('/api/admin/relatorios/dados?tipo=atendimentos', { headers: optoHeaders });
    assert(resAtendimentosRel.status === 200, 'Optometrista emite Relatório de Atendimentos Clínicos (200)');
    assert(resAtendimentosRel.data.relatorio.colunas.includes('Refração OD'), 'Relatório Clínico detalha refração ocular');

    const resReceitasRel = await request('/api/admin/relatorios/dados?tipo=receitas', { headers: optoHeaders });
    assert(resReceitasRel.status === 200, 'Optometrista emite Relatório de Receitas Ópticas (200)');
    assert(resReceitasRel.data.relatorio.colunas.includes('Nº Receita'), 'Relatório inclui numeração oficial das receitas');

    // 14.4 Relatórios de Pacientes e Aniversariantes
    const resPacientesRel = await request('/api/admin/relatorios/dados?tipo=pacientes', { headers: recepHeaders });
    assert(resPacientesRel.status === 200, 'Recepção emite Lista Geral de Pacientes (200)');
    assert(resPacientesRel.data.relatorio.colunas.includes('Status LGPD'), 'Relatório de Pacientes verifica status LGPD');

    const resAniversariantesRel = await request('/api/admin/relatorios/dados?tipo=aniversariantes&mes=10', { headers: recepHeaders });
    assert(resAniversariantesRel.status === 200, 'Recepção emite Aniversariantes do Mês (200)');
    assert(resAniversariantesRel.data.relatorio.filtrosAplicados.some((f: any) => f.valor.includes('Outubro')), 'Filtro de mês aplicado e documentado no cabeçalho');

    // 14.5 Relatórios Financeiros Autorizados
    const resFinReceberRel = await request('/api/admin/relatorios/dados?tipo=contas_receber', { headers: finHeaders });
    assert(resFinReceberRel.status === 200, 'Financeiro emite Contas a Receber (200)');
    assert(resFinReceberRel.data.relatorio.totais.some((t: any) => t.valor.includes('R$')), 'Totais financeiros formatados em moeda pt-BR (R$)');

    const resFinFluxoRel = await request('/api/admin/relatorios/dados?tipo=fluxo_caixa', { headers: finHeaders });
    assert(resFinFluxoRel.status === 200, 'Financeiro emite Demonstrativo de Fluxo de Caixa (200)');
    assert(resFinFluxoRel.data.relatorio.colunas.includes('Resultado Líquido do Mês (R$)'), 'Demonstrativo inclui cálculo líquido');

    // 14.6 Relatório de Auditoria e Usuários pelo Administrador
    const resAuditoriaRel = await request('/api/admin/relatorios/dados?tipo=auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resAuditoriaRel.status === 200, 'Administrador emite Relatório de Auditoria (200)');
    assert(resAuditoriaRel.data.relatorio.colunas.includes('IP de Origem'), 'Auditoria detalha IPs e ações');

    // 14.7 Auditoria Obrigatória da Emissão de Relatórios com Dados de Pacientes
    const auditAposRelatorios = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const logsRelatorioEmitir = auditAposRelatorios.data.logs?.filter((l: any) => l.acao === 'relatorio.emitir');
    assert(logsRelatorioEmitir && logsRelatorioEmitir.length >= 3, 'Auditoria registrou eventos obrigatórios de emissão de relatórios com dados de pacientes');

    // ========================================================================
    // 15. Validação de Regras do Prompt 14 (PWA & Service Worker)
    // ========================================================================
    console.log('\n--- 15. Validação de Regras do Prompt 14 (PWA & Service Worker) ---');

    // 15.1 Endpoint Dinâmico do Manifest
    const resManifest = await request('/manifest.webmanifest');
    assert(resManifest.status === 200, 'Manifest do PWA acessível na rota oficial (200)');
    const contentType = resManifest.headers?.get ? resManifest.headers.get('content-type') : (resManifest.headers as any)?.['content-type'];
    assert(Boolean(contentType && (contentType.includes('application/manifest+json') || contentType.includes('application/json'))), 'Content-Type do manifest é JSON compatível');
    
    const manifestData = resManifest.data;
    assert(manifestData.display === 'standalone', 'PWA configurado com display: standalone');
    assert(manifestData.start_url === '/admin', 'PWA configurado com start_url: /admin');
    assert(manifestData.theme_color === '#0d9488', 'PWA configurado com theme_color oficial');
    assert(typeof manifestData.name === 'string' && manifestData.name.length > 0, 'PWA possui nome completo a partir do consultório');
    assert(typeof manifestData.short_name === 'string' && manifestData.short_name.length <= 12, 'PWA possui short_name conciso (<= 12 caracteres)');
    assert(Array.isArray(manifestData.icons) && manifestData.icons.length >= 3, 'PWA contém array de ícones completo');
    
    const icon192 = manifestData.icons.find((i: any) => i.sizes === '192x192');
    const icon512 = manifestData.icons.find((i: any) => i.sizes === '512x512' && i.purpose === 'any');
    const iconMaskable = manifestData.icons.find((i: any) => i.purpose === 'maskable');
    assert(Boolean(icon192), 'Ícone 192x192 presente no manifest');
    assert(Boolean(icon512), 'Ícone 512x512 presente no manifest');
    assert(Boolean(iconMaskable), 'Ícone maskable presente no manifest');

    // 15.2 Arquivos de Ícones Físicos no Diretório public/
    assert(fs.existsSync(path.resolve(__dirname, '../public/pwa-192x192.png')), 'Arquivo pwa-192x192.png existe');
    assert(fs.existsSync(path.resolve(__dirname, '../public/pwa-512x512.png')), 'Arquivo pwa-512x512.png existe');
    assert(fs.existsSync(path.resolve(__dirname, '../public/pwa-maskable-512x512.png')), 'Arquivo pwa-maskable-512x512.png existe');
    assert(fs.existsSync(path.resolve(__dirname, '../public/apple-touch-icon.png')), 'Arquivo apple-touch-icon.png existe');
    assert(fs.existsSync(path.resolve(__dirname, '../public/icon.svg')), 'Arquivo icon.svg existe');

    // 15.3 Validação de Segurança do Service Worker (Prompt 14)
    // Nunca armazenar dados sensíveis de pacientes ou financeiro no cache do service worker
    const viteConfigContent = fs.readFileSync(path.resolve(__dirname, '../vite.config.ts'), 'utf-8');
    assert(viteConfigContent.includes('NetworkOnly'), 'Regra NetworkOnly configurada no Workbox');
    assert(viteConfigContent.includes('pacientes') && viteConfigContent.includes('financeiro'), 'Bloqueio estrito de cache para endpoints de pacientes e financeiro');
    assert(viteConfigContent.includes('NetworkFirst'), 'Estratégia NetworkFirst configurada para dados gerais da API');

    // 15.4 Tags PWA no index.html
    const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    assert(indexHtmlContent.includes('rel="manifest"'), 'index.html referencia rel="manifest"');
    assert(indexHtmlContent.includes('rel="apple-touch-icon"'), 'index.html referencia rel="apple-touch-icon"');
    assert(indexHtmlContent.includes('apple-mobile-web-app-capable'), 'index.html possui suporte a web app do iOS');

    // ========================================================================
    // 16. Validação de Regras do Prompt 15 (Modo Offline & Web Push API)
    // ========================================================================
    console.log('\n--- 16. Validação de Regras do Prompt 15 (Modo Offline & Web Push API) ---');

    // 16.1 Segurança da Chave Pública VAPID: apenas usuários com 'agenda.ler'
    const vapidSemAuth = await request('/api/admin/push/vapid-public-key');
    assert(vapidSemAuth.status === 401, 'Requisição para chave VAPID sem autenticação retorna 401');

    // Cria um papel e colaborador exclusivo sem permissão de agenda ('agenda.ler': false)
    await request('/api/admin/papeis', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        id: 'papel_sem_agenda',
        nome: 'Apenas Faturamento',
        permissoes: { 'financeiro.ler': true, 'agenda.ler': false },
      },
    });

    const resUserSemAgenda = await request('/api/admin/usuarios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nome: 'Operador Sem Agenda',
        email: `semagenda_${Date.now()}@consultorio.com.br`,
        papelId: 'papel_sem_agenda',
        senha: 'SenhaForte123!',
      },
    });

    const loginSemAgenda = await request('/api/auth/login', {
      method: 'POST',
      body: { email: resUserSemAgenda.data.usuario.email, senha: 'SenhaForte123!' },
    });
    const semAgendaHeaders = { Authorization: `Bearer ${loginSemAgenda.data.token}` };

    const vapidSemPermissao = await request('/api/admin/push/vapid-public-key', { headers: semAgendaHeaders });
    assert(vapidSemPermissao.status === 403, 'Usuário sem permissão agenda.ler é bloqueado com 403 no VAPID push');

    const vapidRecep = await request('/api/admin/push/vapid-public-key', { headers: recepHeaders });
    assert(vapidRecep.status === 200, 'Recepção (com agenda.ler) obtém chave VAPID com sucesso (200)');
    assert(typeof vapidRecep.data.publicKey === 'string' && vapidRecep.data.publicKey.length > 20, 'Chave pública VAPID válida retornada');

    // 16.2 Inscrição Push: apenas usuários com 'agenda.ler'
    const fakeSubscription = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`,
      keys: {
        p256dh: 'BC_fake_key_p256dh_test_1234567890abcdef',
        auth: 'fake_auth_secret_1234',
      },
    };

    const subSemPermissao = await request('/api/admin/push/subscribe', {
      method: 'POST',
      headers: semAgendaHeaders,
      body: { subscription: fakeSubscription, deviceId: 'dev_test_sem_agenda' },
    });
    assert(subSemPermissao.status === 403, 'Usuário sem permissão agenda.ler é bloqueado com 403 ao tentar se inscrever em push');

    const subRecep = await request('/api/admin/push/subscribe', {
      method: 'POST',
      headers: recepHeaders,
      body: { subscription: fakeSubscription, deviceId: 'dev_test_recepcao_pwa' },
    });
    assert(subRecep.status === 201, 'Recepção se inscreve com sucesso em notificações push (201)');
    assert(subRecep.data.sucesso === true, 'Inscrição push confirmada pelo servidor');

    // 16.3 Desinscrição Push do dispositivo
    const unsubRecep = await request('/api/admin/push/unsubscribe', {
      method: 'POST',
      headers: recepHeaders,
      body: { deviceId: 'dev_test_recepcao_pwa' },
    });
    assert(unsubRecep.status === 200, 'Recepção desativa notificações push voluntariamente com sucesso (200)');

    // 16.4 Fila de Sincronização Offline: Validação de Conflito de Horário Ocupado
    // Limpa eventuais agendamentos de testes anteriores para garantir idempotência
    const aptFile = path.resolve(__dirname, '../agendamentos-site.json');
    if (fs.existsSync(aptFile)) {
      try {
        const apts = JSON.parse(fs.readFileSync(aptFile, 'utf-8'));
        const limpos = apts.filter((a: any) => a.data !== '2026-10-26' && a.data !== '2026-10-29');
        fs.writeFileSync(aptFile, JSON.stringify(limpos, null, 2), 'utf-8');
      } catch (err) {
        // ignore
      }
    }

    // Primeiro cria no servidor em um dia útil (2026-10-26, segunda-feira às 10:00) para ocupar o slot
    const resOcuparSlot = await request('/api/admin/agenda', {
      method: 'POST',
      headers: recepHeaders,
      body: {
        nomeContato: 'Paciente que ocupou primeiro',
        telefone: '11988887777',
        data: '2026-10-26',
        horario: '10:00',
        servicoId: 'srv-1',
        tipo: 'consulta_completa',
      },
    });
    assert(resOcuparSlot.status === 201, 'Horário ocupado com sucesso no servidor para teste de conflito');

    // Agora tenta sincronizar a mutação offline no mesmo dia e horário
    const itemComConflitoHorario = {
      id: 'sync_conflito_horario_1',
      entidade: 'agenda',
      tipoOperacao: 'criar',
      timestamp: Date.now(),
      dados: {
        id: 'apt-offline-conflito-1',
        nomeContato: 'Paciente Offline Ocupado',
        telefone: '11999998888',
        data: '2026-10-26',
        horario: '10:00',
        servicoId: 'srv-1',
        servicoNome: 'Exame de Refração Completo',
      },
    };

    const resSyncConflito = await request('/api/admin/sync/process-queue', {
      method: 'POST',
      headers: recepHeaders,
      body: { itens: [itemComConflitoHorario] },
    });
    assert(resSyncConflito.status === 200, 'Endpoint de sincronização responde 200');
    assert(resSyncConflito.data.resultados[0].conflito === true, 'Servidor detectou conflito de concorrência e NÃO sobrescreveu o horário');
    assert(resSyncConflito.data.resultados[0].motivo.includes('já foi ocupado'), 'Aviso detalhado de conflito de horário gerado para o usuário');

    // 16.5 Fila de Sincronização Offline: Sincronização Limpa de Sucesso
    const itemLimpo = {
      id: 'sync_limpo_1',
      entidade: 'agenda',
      tipoOperacao: 'criar',
      timestamp: Date.now(),
      dados: {
        id: `apt-sync-ok-${Date.now()}`,
        nomeContato: 'Paciente Offline Sucesso',
        telefone: '11977776666',
        data: '2026-10-29',
        horario: '16:00',
        servicoId: 'srv-1',
        servicoNome: 'Exame de Refração Completo',
      },
    };

    const resSyncLimpo = await request('/api/admin/sync/process-queue', {
      method: 'POST',
      headers: recepHeaders,
      body: { itens: [itemLimpo] },
    });
    assert(resSyncLimpo.data.resultados[0].sucesso === true, 'Mutação offline sem conflito sincronizada com sucesso');

    // 16.6 Verificação de Isolamento do Cache Offline (LGPD & Prompt 15)
    const offlineStorageCode = fs.readFileSync(path.resolve(__dirname, '../src/services/offline-storage.service.ts'), 'utf-8');
    assert(!offlineStorageCode.includes('receitas_cache'), 'NÃO existe cache offline para receitas ópticas (LGPD)');
    assert(!offlineStorageCode.includes('atendimentos_cache'), 'NÃO existe cache offline para atendimentos clínicos (LGPD)');
    assert(!offlineStorageCode.includes('financeiro_cache'), 'NÃO existe cache offline para dados financeiros (LGPD)');
    assert(offlineStorageCode.includes('limparTudoNoLogout'), 'Método limparTudoNoLogout implementado para expurgo total no logout (LGPD)');

    // 16.7 Verificação de Limpeza no AuthContext
    const authContextCode = fs.readFileSync(path.resolve(__dirname, '../src/contexts/AuthContext.tsx'), 'utf-8');
    assert(authContextCode.includes('limparTudoNoLogout'), 'AuthContext executa limpeza total do cache local/IndexedDB no logout');

    // ========================================================================
    // 17. Validação de Regras do Prompt 16 (Acabamento, Lembretes, Upload & Backup)
    // ========================================================================
    console.log('\n--- 17. Validação de Regras do Prompt 16 (Acabamento, Lembretes, Upload & Backup) ---');

    // 17.1 Lembretes de Consulta por E-mail: Leitura de Status
    const statusLembretes = await request('/api/admin/lembretes/status', { headers: recepHeaders });
    assert(statusLembretes.status === 200, 'Recepção (com agenda.ler) lê status de lembretes (200)');
    assert(statusLembretes.data.statusTarefa === 'ativa', 'Tarefa de lembretes configurada e ativa no backend');
    assert(typeof statusLembretes.data.config?.antecedenciaHoras === 'number', 'Antecedência de lembrete em horas presente na configuração');

    // 17.2 Configuração de Lembretes: Recepção é bloqueada sem 'empresa.editar' (403)
    const resConfigLembreteBloq = await request('/api/admin/configuracoes/lembretes', {
      method: 'PUT',
      headers: recepHeaders,
      body: { antecedenciaHoras: 48 },
    });
    assert(resConfigLembreteBloq.status === 403, 'Recepção é bloqueada ao tentar alterar configuração de lembretes (403)');

    // 17.3 Admin altera configuração de lembretes (200)
    const resConfigLembreteAdmin = await request('/api/admin/configuracoes/lembretes', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        ativo: true,
        antecedenciaHoras: 48,
        assuntoPadrao: 'Lembrete Especial: Sua consulta de {servico} está confirmada',
      },
    });
    assert(resConfigLembreteAdmin.status === 200, 'Admin atualiza configuração de lembretes de consulta com sucesso (200)');
    assert(resConfigLembreteAdmin.data.lembretesEmailConfig.antecedenciaHoras === 48, 'Antecedência configurável salva no servidor');

    // 17.4 Teste Manual de Envio de Lembrete por E-mail
    const resTesteLembrete = await request('/api/admin/lembretes/testar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        emailDestino: 'paciente.teste@exemplo.com.br',
        nomeContato: 'Mariana Teste Lembrete',
      },
    });
    assert(resTesteLembrete.status === 200, 'Disparo de teste de lembrete por e-mail retorna 200');
    assert(resTesteLembrete.data.sucesso === true, 'Confirmação de disparo de e-mail de teste');
    assert(resTesteLembrete.data.destinatario === 'paciente.teste@exemplo.com.br', 'E-mail de destino correto');

    // 17.5 Execução manual de lote de lembretes
    const resExecLote = await request('/api/admin/lembretes/executar-agora', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(resExecLote.status === 200, 'Execução forçada de lote de lembretes retorna 200');
    assert(typeof resExecLote.data.processados === 'number', 'Total de agendamentos processados informado');

    // 17.6 Upload Seguro: Bloqueio sem autenticação (401)
    const resUploadSemAuth = await request('/api/admin/upload', {
      method: 'POST',
      body: { nomeArquivo: 'teste.jpg', mimeType: 'image/jpeg', dadosBase64: 'dGVzdGU=' },
    });
    assert(resUploadSemAuth.status === 401, 'Upload sem autenticação retorna 401');

    // 17.7 Upload Seguro: Rejeição de arquivo com tipo MIME não permitido (400)
    const resUploadExecutavel = await request('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nomeArquivo: 'malware.exe',
        mimeType: 'application/x-msdownload',
        dadosBase64: 'TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      },
    });
    assert(resUploadExecutavel.status === 400, 'Upload rejeita executáveis com 400');
    assert(resUploadExecutavel.data.error.includes('Tipo de arquivo não permitido'), 'Mensagem informativa sobre tipos permitidos');

    // 17.8 Upload Seguro: Rejeição de arquivo que excede 5MB (400)
    // 5.5 MB em base64 (aproximadamente 7.3 milhões de caracteres)
    const base64Gigante = 'A'.repeat(7.5 * 1024 * 1024);
    const resUploadGrande = await request('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nomeArquivo: 'foto_gigante.jpg',
        mimeType: 'image/jpeg',
        dadosBase64: base64Gigante,
      },
    });
    assert(resUploadGrande.status === 400, 'Upload rejeita arquivo maior que 5MB com 400');
    assert(resUploadGrande.data.error.includes('excede o limite máximo'), 'Mensagem informativa sobre limite de tamanho');

    // 17.9 Upload Seguro: Sucesso no upload de imagem válida (201)
    const pngBase64Valido = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resUploadSucesso = await request('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: {
        nomeArquivo: 'logotipo_clinica.png',
        mimeType: 'image/png',
        dadosBase64: pngBase64Valido,
      },
    });
    assert(resUploadSucesso.status === 201, 'Upload de imagem válida retorna 201');
    assert(resUploadSucesso.data.url.startsWith('/uploads/'), 'URL estática segura gerada em /uploads/');
    assert(typeof resUploadSucesso.data.tamanhoBytes === 'number', 'Tamanho do arquivo gravado');

    // 17.10 Backup & Exportação: Bloqueio estrito de papéis não-administradores (403)
    const backupRecep = await request('/api/admin/backup/exportar', { headers: recepHeaders });
    assert(backupRecep.status === 403, 'Recepção recebe 403 Forbidden ao tentar exportar o backup completo');

    const backupOpto = await request('/api/admin/backup/exportar', { headers: optoHeaders });
    assert(backupOpto.status === 403, 'Optometrista recebe 403 Forbidden ao tentar exportar o backup completo');

    const backupFin = await request('/api/admin/backup/exportar', { headers: finHeaders });
    assert(backupFin.status === 403, 'Operador Financeiro recebe 403 Forbidden ao tentar exportar o backup completo');

    // 17.11 Backup & Exportação: Administrador exporta snapshot integral (200)
    const backupAdmin = await request('/api/admin/backup/exportar', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    assert(backupAdmin.status === 200, 'Administrador exporta o backup completo com sucesso (200)');
    assert(backupAdmin.data.banco !== undefined, 'Snapshot contém o nó raiz "banco"');
    assert(Array.isArray(backupAdmin.data.banco.pacientes), 'Backup inclui todos os pacientes');
    assert(Array.isArray(backupAdmin.data.banco.agendamentos), 'Backup inclui todos os agendamentos');
    assert(Array.isArray(backupAdmin.data.banco.receitas), 'Backup inclui todas as receitas ópticas');
    assert(Array.isArray(backupAdmin.data.banco.financeiro), 'Backup inclui lançamentos financeiros');
    assert(Array.isArray(backupAdmin.data.banco.auditoria), 'Backup inclui trilha de auditoria');
    assert(backupAdmin.data.retencaoLegal.includes('20 anos'), 'Backup referencia política de retenção legal CFM/CBOO de 20 anos');
    assert(Boolean(backupAdmin.headers.get('x-backup-checksum-sha256')), 'Cabeçalho com Checksum SHA-256 gerado para validação de integridade');

    // 17.12 Restauração de Backup: Não-administrador bloqueado com 403
    const resRestaurarRecep = await request('/api/admin/backup/restaurar', {
      method: 'POST',
      headers: recepHeaders,
      body: { backup: backupAdmin.data },
    });
    assert(resRestaurarRecep.status === 403, 'Recepção recebe 403 ao tentar restaurar backup');

    // 17.13 Restauração de Backup: Payload corrompido sem banco rejeitado com 400
    const resRestaurarInvalido = await request('/api/admin/backup/restaurar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { backup: { corrompido: true } },
    });
    assert(resRestaurarInvalido.status === 400, 'Tentativa de restaurar backup sem nó banco é rejeitada com 400');

    // 17.14 Restauração de Backup: Administrador restaura snapshot com sucesso (200)
    const resRestaurarAdmin = await request('/api/admin/backup/restaurar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
      body: { backup: backupAdmin.data },
    });
    assert(resRestaurarAdmin.status === 200, 'Administrador restaura backup com sucesso (200)');
    assert(resRestaurarAdmin.data.restaurados >= 7, 'Módulos essenciais restaurados com integridade');

    // 17.15 Trilha de Auditoria: Validação dos novos eventos obrigatórios
    const auditoriaPrompt16 = await request('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${authTokenAdmin}` },
    });
    const acoes16 = auditoriaPrompt16.data.logs.map((l: any) => l.acao);
    assert(acoes16.includes('backup.exportar'), 'Auditoria registrou evento de backup.exportar');
    assert(acoes16.includes('backup.restaurar'), 'Auditoria registrou evento de backup.restaurar');
    assert(acoes16.includes('upload.arquivo'), 'Auditoria registrou evento de upload.arquivo');
    assert(acoes16.includes('lembrete.teste'), 'Auditoria registrou evento de lembrete.teste');
    assert(acoes16.includes('empresa.editar_lembretes'), 'Auditoria registrou evento de empresa.editar_lembretes');

  } finally {
    serverInstance.close();
  }

  console.log('\n======================================================');
  console.log(`  RESUMO DOS TESTES DE ACESSO:`);
  console.log(`  Sucessos: ${passedTests}`);
  console.log(`  Falhas:   ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes:', err);
  process.exit(1);
});
