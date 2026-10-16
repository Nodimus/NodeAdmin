Crie `/admin/home` ("Conteúdo da home"), onde a equipe edita no painel tudo que a landing exibe, sem mexer em código. Permissão: `empresa.editar`. A landing (prompt 02) passa a ler esses dados.

Blocos editáveis:
- **Hero**: título, subtítulo, texto do botão e imagem de fundo.
- **Sobre**: texto, foto do profissional, formação e diferenciais (lista).
- **Serviços em destaque**: escolher quais serviços cadastrados aparecem, ordem e descrição curta.
- **Depoimentos**: CRUD (nome ou iniciais, texto, nota opcional, ativo, ordem) com campo obrigatório "autorização do paciente para publicar".
- **Galeria do consultório**: upload de fotos, legenda, ordem.
- **Localização e contato**: link ou embed do mapa, horários exibidos, WhatsApp e mensagem inicial, redes sociais.
- **Rodapé e política de privacidade**: textos editáveis.
- **SEO**: título e descrição da página.

Controles: alternar visibilidade de cada seção; reordenar seções; botão **Pré-visualizar** (abre a home com as alterações ainda não publicadas) e **Publicar**; mostrar quem publicou e quando. Valide tamanhos de texto e imagens (até 2 MB), sanitize qualquer texto formatado e exiba aviso de que a política de privacidade deve ser revisada por profissional jurídico. Registre a publicação em `auditoria`.
