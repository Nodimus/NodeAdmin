# Como usar os prompts (v2 — consultório único, sistema monolítico)

## O que mudou em relação à v1
- **Não é SaaS.** É o sistema de **um único consultório optométrico particular**: sem multi-clínica, sem planos/assinaturas, sem cadastro público de consultórios, sem marca de "produto para optometristas".
- **Monolito.** Uma só aplicação (interface + regras + dados), um só deploy. **Stack, banco de dados e hospedagem ficam por conta do AI Studio** — os prompts não os prescrevem. Termos do Firebase foram removidos.
- **Dados administráveis.** Tudo que o público ou os documentos exibem é editável no painel; o código só traz valores iniciais.
- **Novo prompt 06b:** edição do conteúdo da home pelo painel.

## Como usar
1. Envie **um prompt por vez**, na ordem: 01, 02, 03, 04, 05, 06, **06b**, 07 … 16.
2. Teste o resultado antes de avançar.
3. No AI Studio, anexe os arquivos de `docs/` relevantes **apenas como regras de negócio**.
4. **Conflito entre prompt e docs/CLAUDE.md:** os prompts prevalecem. Onde a spec citar Firebase, Firestore, Cloud Functions, custom claims, FCM, Hosting, "dois projetos dev/prod" ou "Vinnes Admin para optometristas", use o equivalente da stack escolhida e ignore o resto.
5. Se algo quebrar: "Corrija o erro X sem alterar o restante."
6. Se o desktop mudar sem querer: "Reverta as mudanças em telas ≥ 1024px para o estado anterior."
7. Se o AI Studio tiver dúvida sobre um requisito, ele deve **perguntar antes de assumir**.

## Checklist adicional (além do CHECKLIST.md)
- [ ] 06b: alterar texto, serviço em destaque, depoimento ou foto no painel e publicar reflete na home; seção oculta some da home.
- [ ] Nenhuma tela, texto ou tabela fala em planos, assinatura, "clínicas", tenant ou super admin.
