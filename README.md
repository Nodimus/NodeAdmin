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

# 3. Iniciar o servidor de desenvolvimento na porta 3000
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

## 6. Segurança e Regras de Dados
- **Rotas Públicas (`/`):** Exibem a apresentação institucional do consultório, serviços ópticos e canais de agendamento via WhatsApp, alimentadas por leitura pública do registro `consultorio/dados_gerais`.
- **Rotas Privadas (`/admin/*`):** Exigem autenticação estrita no servidor (`request.auth != null`). Nenhum visitante público tem acesso aos prontuários, exames refrativos, receitas ou dados financeiros.
- **Registro Único:** O ID do documento é estritamente travado em `dados_gerais`, tornando matematicamente impossível criar múltiplos consultórios no banco.
