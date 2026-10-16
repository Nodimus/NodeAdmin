Na home, adicione o formulário de agendamento (regras em docs/modulos/agenda-e-agendamento.md): nome, telefone, e-mail, serviço, data, horário e consentimento LGPD (checkbox + link da política de privacidade).

Regras:
- Os horários livres são **calculados no servidor**: horários de atendimento, intervalos, duração do serviço, antecedência mínima e bloqueios de agenda (feriados, férias) menos os agendamentos existentes. Não mostre horário passado nem fora do expediente. Serviços inativos não aparecem.
- Evite duplicidade com **transação e restrição de unicidade no banco**: dois visitantes simultâneos não podem reservar o mesmo horário; quem perder vê uma mensagem pedindo outro horário.
- Salve com status `pendente` e origem `site`; registre o consentimento (aceite, data/hora e versão do texto).
- Valide tudo no servidor; proteja contra spam (campo honeypot e limite de tentativas por IP).
- Exiba tela de confirmação com data, horário e serviço, e envie e-mail de confirmação de recebimento (se o envio de e-mail estiver configurado).
- Colete somente nome, telefone e e-mail.
