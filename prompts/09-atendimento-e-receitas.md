Crie a tela de Atendimento e a emissão de receitas conforme docs/modulos/atendimento-e-receitas.md.
- Atendimento: anamnese, acuidade visual (OD/OE), refração (esférico, cilíndrico, eixo, adição, DNP), observações; conclui o atendimento e marca o agendamento como atendido.
- Receita: número **sequencial sem lacunas nem repetição**, gerado de forma atômica no servidor; PDF A4 com cabeçalho do consultório, paciente, tabela OD/OE, observações, validade (configurável), assinatura e carimbo.
- **Congele os dados na emissão** (cópia dos dados do consultório, do profissional e da validade): alterar o cadastro depois não muda uma receita já emitida nem sua reimpressão.
- Receita emitida não é editável (imposto no servidor): cancela-se com motivo e emite-se outra.
- Ações: imprimir, baixar PDF, enviar por e-mail, enviar por WhatsApp (mensagem com link temporário e expirável para o PDF), reimprimir e cancelar.
- Audite emissão, cancelamento, reimpressão e envio.
- Campos obrigatórios conforme a configuração do consultório. Não invente exigências legais.
