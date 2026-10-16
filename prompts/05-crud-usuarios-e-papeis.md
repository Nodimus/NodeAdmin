Implemente o módulo Usuários e Papéis conforme docs/modulos/usuarios-e-papeis.md (ignore menções a Cloud Functions/claims; as operações ficam em endpoints do servidor que exigem `usuarios.editar` ou `papeis.editar`).
- `/admin/usuarios`: lista com busca, filtros por papel e status, paginação; formulário de criar/editar (nome, e-mail, telefone, papel, registro profissional opcional, ativo).
- `/admin/papeis`: lista e editor com **matriz de permissões (módulo × ação)** em checkboxes.
- Criar usuário: o servidor cria o usuário e envia e-mail com link de definição de senha de uso único e com validade. Se o e-mail não estiver configurado, mostre o link ao Admin uma única vez.
- Trocar o papel vale na próxima requisição do usuário, sem novo login.
- "Excluir" = desativar (`ativo = false`), encerrando as sessões do usuário.
- Bloqueie desativar ou rebaixar o **último Admin** e o **próprio usuário logado**.
- Papéis de sistema não podem ser excluídos (as permissões podem ser ajustadas, exceto as do Admin); papel em uso não pode ser excluído.
- Registre toda alteração em `auditoria` (quem, o quê, quando, valor anterior e novo).
Não altere telas existentes além de adicionar os itens de menu.
