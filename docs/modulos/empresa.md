# Módulo: Dados da Empresa (CRUD)

## Tela `/admin/empresa` (abas)
1. **Identificação**: razão social, nome fantasia, CNPJ, responsável técnico, registro profissional.
2. **Contato e endereço**: telefone, WhatsApp, e-mail, endereço com busca por CEP, redes sociais.
3. **Marca**: logotipo, carimbo e assinatura (upload no Storage, pré-visualização).
4. **Atendimento**: horários por dia da semana, intervalo, duração padrão.
5. **Serviços**: CRUD de serviços (nome, duração, preço, ativo).
6. **Receita e relatórios**: validade da receita (dias), campos obrigatórios, texto de rodapé dos relatórios.

## Regras
- Documento único `empresa/config`; serviços como lista interna.
- Mudanças refletem na landing page, no agendamento, nas receitas e no cabeçalho dos relatórios.
- Validar CNPJ, CEP e telefone; imagens até 2 MB.
- Somente `empresa.editar` salva; leitura pública apenas de campos de divulgação.

## Aceite
- Alterar telefone no admin atualiza o botão de WhatsApp da landing.
- Desativar um serviço o remove do formulário de agendamento.
