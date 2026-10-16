Crie o sistema de gestão de UM consultório optométrico particular, como aplicação **monolítica** (interface, regras de negócio e acesso a dados no mesmo projeto, um único deploy). Escolha a stack, o banco de dados e a forma de hospedagem mais simples e estáveis que o AI Studio suportar, e documente a escolha no README.

PREMISSAS (valem para todos os prompts seguintes):
1. **Não é SaaS.** Um único consultório, de uso próprio: sem multi-tenant/multi-clínica (nada de `clinicaId`/`tenantId`), sem planos, assinaturas ou cobrança, sem cadastro público de consultórios, sem "super admin". Nome, logo e textos vêm dos dados do consultório, não do código.
2. **Segurança no servidor.** Toda verificação de login e permissão acontece no servidor; esconder item de menu não basta.
3. **Dados administráveis.** Tudo que aparece ao público ou em documentos (dados do consultório, serviços, horários, textos da home, depoimentos, categorias, formas de pagamento, validade da receita, mensagens-padrão) é editável no painel. O código só traz valores iniciais (seed).
4. Idioma pt-BR; fuso America/Sao_Paulo; valores monetários em centavos (inteiros); datas dd/mm/aaaa.
5. Antes de editar, liste os arquivos que serão alterados; depois, resuma o que mudou. Não renomeie componentes, rotas ou tabelas existentes sem pedido explícito. Se algo for ambíguo, **pergunte antes de assumir**.

Nesta etapa crie: estrutura do projeto; rotas públicas (landing) e privadas `/admin` com tela de login (placeholder); layout base; roteamento; contexto/sessão de autenticação; **camada de acesso a dados separada da interface** (nenhum componente fala direto com o banco); configuração por variáveis de ambiente; migrações/esquema inicial com uma tabela/entidade **única** `consultorio` (um só registro); script de seed com dados fictícios claramente identificados como exemplo; README com instruções para rodar.
