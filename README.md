# Consultório de Optometria — Sistema de Gestão Clínica

> **Nota de Arquitetura Importante:** Este sistema é uma aplicação **monolítica** desenvolvida para uso próprio e exclusivo de **UM ÚNICO consultório optométrico particular**. **NÃO é uma plataforma SaaS, multi-tenant ou multi-clínica**. Não existem planos, assinaturas, cobrança, períodos de teste ou cadastro público de novas clínicas. Todo o sistema é parametrizado a partir de um registro único editável da clínica (`consultorio/dados_gerais`).

---

## 1. Stack Tecnológica
- **Frontend / Monolito:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion.
- **Banco de Dados & Autenticação:** Firebase Authentication, Cloud Firestore e Cloud Storage (com camada defensiva e contingência local para desenvolvimento/demonstração).
- **Internacionalização:** Idioma `pt-BR`, fuso horário `America/Sao_Paulo`, valores monetários armazenados em **centavos inteiros** e datas no padrão `dd/mm/aaaa`.

---

## 2. Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+ ou 22+
- npm ou bun

### Instalação e Execução
```bash
# 1. Instalar as dependências
npm install

# 2. Configurar o arquivo de ambiente
cp .env.example .env

# 3. (Opcional) Executar o seed de dados de exemplo
npm run seed

# 4. Iniciar o servidor de desenvolvimento na porta 3000
npm run dev
```

Acesse em seu navegador: `http://localhost:3000`.

---

## 3. Variáveis de Ambiente (`.env`)
Configurações do Firebase obtidas no Firebase Console do consultório:

```bash
# Credenciais do Projeto Firebase do Consultório
VITE_FIREBASE_API_KEY="AIzaSyYourApiKeyHere"
VITE_FIREBASE_AUTH_DOMAIN="consultorio-optometria.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="consultorio-optometria"
VITE_FIREBASE_STORAGE_BUCKET="consultorio-optometria.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

*Nota:* Quando as variáveis de ambiente não estiverem configuradas, o sistema ativa automaticamente a persistência local resiliente pré-alimentada com dados de exemplo, permitindo testar e demonstrar todas as telas imediatamente.

---

## 4. Como Criar o Primeiro Administrador / Usuário da Equipe

1. **Modo Local / Demonstração:**
   - Acesse `/login`.
   - Clique em **"Dr. Roberto (Optometrista RT)"** ou **"Juliana Paes (Recepção)"** para efetuar login imediato com privilégios completos.

2. **No Firebase de Produção:**
   - Acesse o [Firebase Console](https://console.firebase.google.com), selecione seu projeto e navegue até **Authentication > Users**.
   - Crie o e-mail do profissional (ex: `optometrista@seusite.com.br`) e defina a senha inicial, ou autorize o login com Conta Google.
   - Ao fazer o primeiro login, o sistema registrará os dados de perfil da equipe no Firestore na coleção `users`.

---

## 5. Configuração dos Dados do Consultório
Para substituir os dados fictícios iniciais (marcados como `[EXEMPLO]` no seed):
1. Acesse o painel em `/admin` e clique em **Dados do Consultório** (ou acesse `/admin/configuracoes`).
2. Atualize a Razão Social, Nome Fantasia, CNPJ, Registro Profissional (CBOO), Nome do Responsável Técnico, Endereço, WhatsApp e Horários de Atendimento.
3. Clique em **Salvar Dados do Consultório**. Todas as telas institucionais, cabeçalhos de receitas e telas internas passarão a refletir essas informações imediatamente.

---

## 6. Agendamento Online na Home (`/` e `/agendar/confirmacao`)
O sistema conta com fluxo completo de agendamento online público de exames para pacientes particulares:
- **Cálculo de Horários Livres no Servidor:** Os horários disponíveis são calculados estritamente na API backend (`GET /api/public/horarios-disponiveis`), considerando os horários de atendimento do dia da semana, intervalo de almoço/recesso, duração do exame selecionado, antecedência mínima (60 minutos para o dia corrente no fuso `America/Sao_Paulo`) e bloqueios de agenda cadastrados (feriados/férias), subtraindo os agendamentos já existentes. Não são exibidos horários passados nem fora do expediente.
- **Proteção Anti-Spam e Rate Limiting:** O formulário possui campo honeypot oculto contra robôs e limitação de requisições por endereço de IP no servidor.
- **Prevenção de Duplicidade e Transação Atômica:** Quando dois visitantes tentam reservar o mesmo horário simultaneamente, o servidor processa sob bloqueio transacional (`slotKey = data_horario`). Apenas a primeira requisição conclui a reserva; a requisição concorrente recebe HTTP 409 Conflict amigável e atualiza a grade de horários disponíveis.
- **Status Inicial e Origem:** Todo agendamento pelo site é salvo com `status: 'pendente'` e `origem: 'site'`, exigindo confirmação prévia pela recepção do consultório.
- **Consentimento LGPD:** Registra explicitamente o consentimento do paciente com data/hora, versão da política e IP, coletando estritamente Nome, Telefone e E-mail.
- **Tela de Confirmação:** Rota `/agendar/confirmacao` com comprovante amigável, protocolo de agendamento, integração com Google Agenda, canal direto para o WhatsApp do consultório e envio de e-mail de confirmação de recebimento.

---

## 7. Segurança e Regras de Dados
- **Rotas Públicas (`/`, `/agendar/confirmacao`):** Exibem a apresentação institucional do consultório, serviços ópticos e formulário de agendamento online, alimentadas por leitura pública da API e dados do registro `consultorio/dados_gerais`.
- **Rotas Privadas (`/admin/*`):** Exigem autenticação estrita no servidor (`request.auth != null` ou token de sessão HttpOnly com perfil válido). Nenhum visitante público tem acesso aos prontuários, exames refrativos, receitas ou dados financeiros.
- **Registro Único:** O ID do documento do consultório é estritamente travado em `dados_gerais`, tornando matematicamente impossível criar múltiplos consultórios no banco.
- **Proteção de Uploads:** Arquivos anexados são validados em formato MIME estrito (JPEG, PNG, WebP, SVG, PDF), com limite rígido de 5MB por arquivo, sanitização contra directory traversal e registro em auditoria.
- **Proteção contra Força Bruta:** Rate limiting ativado na autenticação de login e no endpoint público de agendamento.

---

## 8. Lembretes de Consulta por E-mail (Serviço Agendado)
O sistema possui rotina interna de lembretes automáticos por e-mail com agendamento em segundo plano:
- **Agendador em Segundo Plano:** Executa periodicamente a cada 5 minutos no servidor Node.js, varrendo as consultas com status `confirmado` ou `agendado` que possuam e-mail de contato cadastrado e que ainda não tenham recebido lembrete (`lembreteEmailEnviadoEm = null`).
- **Antecedência Configurável no Painel:** O Administrador pode selecionar a janela de envio nas configurações da empresa (12h, 24h, 48h ou 72h antes do atendimento).
- **Templates Dinâmicos:** Mensagens parametrizáveis com tags inteligentes: `{nome}`, `{data}`, `{horario}`, `{servico}`, `{profissional}`, `{consultorio}`, `{endereco}`, `{telefone}` e `{whatsapp}`.
- **Disparo de Teste e Lote Manual:** Botões na interface administrativa (`/admin/configuracoes > Lembretes por E-mail`) permitem disparar uma demonstração para um e-mail de teste ou forçar a execução imediata da varredura.
- **Auditoria Deontológica:** Todo disparo é registrado na trilha de auditoria (`lembrete.teste`, `lembrete.executar_lote`).

---

## 9. Backup, Restauração e Política de Retenção de Dados Clínicos

### Política Legal de Retenção (CFM & CBOO / Lei nº 13.787/2018)
- **Prazo Obrigatório de Custódia:** O prontuário clínico optométrico, incluindo as medições refrativas (acuidade, ceratometria, refração subjetiva, retinoscopia, dioptrias e prescrições de lentes), deve ser guardado por **no mínimo 20 (vinte) anos** a partir da data do último registro do paciente.
- **Recomendação de Rotina:** Recomenda-se que o consultório realize o download do backup completo semanalmente ou mensalmente e armazene o arquivo `.json` gerado em mídia externa segura (ou serviço de armazenamento em nuvem criptografado).

### Como Exportar um Backup Completo
1. Acesse o painel como **Administrador** em `/admin/configuracoes`.
2. Clique na aba **9. Backup & Exportação**.
3. Clique em **Baixar Backup Completo (.JSON)**.
4. O sistema gera um arquivo snapshot estruturado contendo todos os módulos (`consultorio`, `agendamentos`, `pacientes`, `atendimentos`, `receitas`, `financeiro`, `usuarios`, `papeis`, `auditoria`), acompanhado de assinatura digital com **Checksum SHA-256** no cabeçalho HTTP `X-Backup-Checksum-Sha256` e registro em auditoria (`backup.exportar`).

### Como Restaurar um Backup
1. Acesse `/admin/configuracoes > 9. Backup & Exportação`.
2. Na seção **Restaurar Base de Dados**, clique em **Selecionar Arquivo de Backup (.json)**.
3. Selecione o arquivo `.json` exportado previamente e confirme a operação no diálogo de segurança.
4. O servidor valida a integridade do nó `banco`, restaura as coleções e reinicia o estado operacional, gerando log auditado (`backup.restaurar`).

---

## 10. Implantação em Produção e Separação de Ambientes

### Requisitos de Hospedagem
- **Runtime:** Node.js 20+ ou 22+ (LTS).
- **Porta:** Padrão 3000 (ou configurada via variável `PORT`).
- **Comando de Inicialização de Produção:**
  ```bash
  npm run build
  npm start # executa: node server.ts em modo NODE_ENV=production
  ```

### Separação entre Ambiente de Teste e Produção
1. **Ambiente de Homologação / Teste:**
   - Execute com `NODE_ENV=development` ou utilize a suíte automatizada `npm test` (que roda em porta isolada `3001` sem interferir na sessão de produção).
   - Dados de exemplo no seed podem ser resetados a qualquer momento com `npm run seed`.
2. **Ambiente de Produção Oficial:**
   - Defina `NODE_ENV=production`.
   - Configure o arquivo `.env` com as chaves reais do Firebase do consultório (ou banco hospedado).
   - O servidor serve os arquivos compilados otimizados em `/dist` com compressão e cabeçalhos de segurança estritos.

### Criação do Primeiro Administrador em Produção
- O sistema já vem provisionado com o usuário administrador padrão (`admin@consultoriorobertoviana.com.br`).
- Para cadastrar novos colaboradores com papéis deontológicos estritos (Optometrista, Recepção, Faturamento/Financeiro), acesse `/admin/usuarios` e clique em **Novo Colaborador**.
- O sistema gera um link criptografado de uso único (`/redefinir-senha?token=...`) com validade de 48 horas, permitindo que o colaborador defina sua própria senha forte em conformidade com as normas de segurança e LGPD.
