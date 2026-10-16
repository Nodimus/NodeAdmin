Crie o dashboard `/admin` (consultas de hoje, pendentes de confirmação, receita do mês — esta só para quem tem `financeiro.ler`) e a Agenda em calendário (dia/semana), respeitando as permissões.
- Criar agendamento manual (origem `interno`), confirmar, remarcar, cancelar (com motivo da lista de cadastros auxiliares), marcar como atendido ou faltou.
- Toda criação e remarcação passa pela mesma validação do agendamento público: sem duplicidade (restrição no banco), respeitando bloqueios de agenda.
- Mostre os bloqueios (feriados, férias) no calendário.
- Ao confirmar, gere o botão de WhatsApp com a mensagem-padrão cadastrada, preenchida com nome, data, hora e serviço.
- Destaque agendamentos novos vindos do site.
