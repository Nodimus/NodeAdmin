Implemente `/admin/empresa` conforme docs/modulos/empresa.md, editando o registro único do consultório. Abas:
1. **Identificação**: razão social, nome fantasia, CNPJ, responsável técnico, registro profissional.
2. **Contato e endereço**: telefone, WhatsApp, e-mail, endereço com busca por CEP, redes sociais.
3. **Marca**: upload de logotipo, carimbo e assinatura, com pré-visualização.
4. **Atendimento**: horários por dia da semana, intervalo, duração padrão, antecedência mínima de agendamento e **bloqueios de agenda** (feriados, férias, folgas, com período e motivo).
5. **Serviços**: CRUD (nome, descrição curta, duração, preço, ativo, ordem).
6. **Receita e relatórios**: validade da receita (dias), campos obrigatórios, texto de rodapé dos relatórios.
7. **Cadastros auxiliares** (listas editáveis, com ativo/inativo): formas de pagamento, categorias de despesa, motivos de cancelamento e mensagens-padrão de WhatsApp com variáveis (`{nome}`, `{data}`, `{hora}`, `{servico}`).

Regras: validar CNPJ, CEP e telefone; imagens até 2 MB, só tipos de imagem; apenas `empresa.editar` salva; a leitura pública expõe só os campos de divulgação. Itens inativos somem das telas de uso, mas continuam nos registros antigos. A landing, o agendamento, as receitas e o cabeçalho dos relatórios devem ler esses dados. Não duplique valores no código.
