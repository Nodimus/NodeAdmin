# Módulo: Usuários e Papéis (CRUD)

## Telas
- `/admin/usuarios`: lista com busca, filtro por papel e status, paginação.
- Formulário de usuário (modal/página): nome, e-mail, telefone, papel, registro profissional (opcional), ativo.
- `/admin/papeis`: lista de papéis; editor com matriz de permissões (módulo × ação) em checkboxes.

## Regras
- Criar usuário: Cloud Function `criarUsuario` (Auth + documento + claims + e-mail de redefinição de senha).
- Editar usuário: alterar papel atualiza claims via função `atualizarClaims`; sessão ativa renova o token.
- Excluir = **desativar** (`ativo=false`) via função `desativarUsuario`, que também desabilita no Auth.
- Não permitir desativar ou rebaixar o último admin nem o próprio usuário logado.
- Papéis `sistema=true` (Admin, Optometrista, Recepção, Financeiro) não podem ser excluídos; permissões podem ser ajustadas, exceto as do Admin.
- Papel só pode ser excluído se nenhum usuário o utilizar.
- Toda alteração gera registro em `auditoria`.

## Aceite
- Admin cria usuário e ele recebe e-mail para definir senha.
- Recepção não vê o menu Usuários nem acessa a rota por URL.
- Trocar o papel de um usuário reflete no menu em até um refresh de token.
