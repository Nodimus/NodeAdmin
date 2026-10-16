Implemente login por e-mail e senha, com sessão segura (cookie httpOnly ou equivalente), hash forte de senha, limite de tentativas, logout e recuperação de senha por e-mail.

Permissões (docs/04-seguranca-e-permissoes.md, só as regras de negócio):
- Chaves no formato `modulo.acao` (ler, criar, editar, excluir, imprimir). Papéis e permissões ficam no banco e são **editáveis**; as permissões do usuário são lidas a cada requisição (ou com cache curto), de modo que mudar o papel vale imediatamente.
- Crie os papéis padrão Admin, Optometrista, Recepção e Financeiro (`sistema = true`), conforme a tabela da spec.
- **Toda rota/endpoint do servidor** verifica a permissão; a interface apenas esconde o que o usuário não pode usar. Crie o guard de rota `<RequirePermission perm="...">` (ou equivalente) para as telas.
- Seed/script para criar o primeiro Admin (e-mail e senha temporária informados no ambiente, troca de senha obrigatória no primeiro acesso).
- Escreva testes automatizados de acesso: usuário sem permissão recebe 403 em cada módulo, inclusive acessando a URL direto.
