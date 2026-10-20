# CLAUDE.md — Sistema de Gestão de Consultório de Optometria (Uso Próprio)

## Visão Geral
Aplicação monolítica em **React 19 + TypeScript + Vite + Tailwind CSS v4** integrada ao **Firebase (Authentication, Cloud Firestore e Cloud Storage)**, construída exclusivamente para **UM ÚNICO consultório optométrico particular** de uso próprio.

> **Importante:** Este sistema **NÃO É UM SAAS**. Não possui multi-tenant/multi-clínica, planos, assinaturas, cobrança, período de testes ou cadastro público de consultórios.

## Diretrizes Fundamentais
1. **Registro Único do Consultório (`consultorio/dados_gerais`)**:
   - Nome fantasia, razão social, CNPJ, registro profissional (CBOO), responsável técnico, contatos, endereço e horários vêm deste registro administrável no painel em `/admin/configuracoes`.
   - O código fornece apenas valores iniciais de exemplo (seed), claramente identificados.
2. **Separação de Camadas**:
   - Componentes visuais **nunca** realizam consultas diretas ao banco de dados; todas as operações passam pela camada `src/services/` e pelos contextos (`useConsultorio`, `useAuth`).
3. **Padrões de Dados**:
   - Idioma: Português do Brasil (`pt-BR`).
   - Fuso horário: `America/Sao_Paulo`.
   - Valores monetários: **Centavos inteiros** (`amountInCents`, `costPriceInCents`, `sellingPriceInCents`).
   - Datas: Exibição em `dd/mm/aaaa`.
4. **Segurança no Servidor**:
   - Regras do Firestore (`firestore.rules`) garantem que apenas usuários autenticados da equipe acessem prontuários, exames, receitas e financeiro.
   - O documento do consultório é travado no ID `dados_gerais`, impedindo múltiplos registros.
5. **Exclusividade Clínica e Regra Deontológica (Sem Venda de Óculos / Loja / Comércio)**:
   - Este sistema é **ESTRITAMENTE para Consultório / Clínica de Optometria** (avaliação visual, anamnese, exames de refração, laudos, acuidade visual, motilidade e prescrição óptica).
   - É **expressamente proibida** qualquer iniciativa de venda de óculos, armações, lentes de contato comerciais, loja virtual, balcão óptico ou estoque de produtos no sistema.
   - O consultório atua com independência e isenção: diagnostica e emite o receituário para que o paciente avie em qualquer ótica de sua livre escolha.
   - Não devem existir telas de estoque de armações, venda de produtos, vitrines ou categorias financeiras de venda de óculos. Todas as receitas são honorários de consultas e procedimentos clínicos.
