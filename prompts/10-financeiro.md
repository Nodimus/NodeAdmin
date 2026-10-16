Crie o módulo Financeiro conforme docs/modulos/financeiro.md: Contas a Receber e Contas a Pagar com filtros por período e status, baixa com data, recorrência mensal, parcelamento simples, anexo de comprovante, alertas de vencimento (hoje e atrasadas), fluxo de caixa mensal com gráfico, totais por categoria e exportação CSV.
- Formas de pagamento e categorias vêm dos cadastros auxiliares editáveis (prompt 06), não do código.
- Conta a receber pode vir de um atendimento/paciente.
- Valores em centavos, exibidos em R$ (pt-BR).
- Baixas e cancelamentos registrados em `auditoria`; permissão `financeiro.*` verificada no servidor.
