# Módulo: Relatórios Impressos

## Tela `/admin/relatorios`
Seleção de relatório, filtros (período, profissional, status, paciente), pré-visualização e botão **Imprimir** (`window.print()`) com opção de salvar em PDF.

## Relatórios
| Relatório | Permissão | Filtros |
|---|---|---|
| Agenda do dia/semana | agenda.ler | data, profissional |
| Atendimentos por período | atendimento.ler | período, profissional |
| Receitas emitidas | receitas.ler | período, paciente, status |
| Lista de pacientes | pacientes.ler | status, cidade |
| Aniversariantes do mês | pacientes.ler | mês |
| Contas a receber | financeiro.ler | período, status |
| Contas a pagar | financeiro.ler | período, status, categoria |
| Fluxo de caixa mensal | financeiro.ler | mês/ano |
| Usuários e papéis | usuarios.ler | status |
| Auditoria | auditoria.ler | período, usuário |

## Layout de impressão
- A4, margens 15 mm, `@media print` esconde menu, botões e filtros.
- Cabeçalho: logo, nome fantasia, CNPJ, endereço, telefone (de `empresa/config`).
- Título, filtros aplicados, data/hora de emissão e usuário emissor.
- Tabelas com cabeçalho repetido a cada página, `page-break-inside: avoid` nas linhas.
- Rodapé: `textoRodapeRelatorio` e "Página X de Y".
- Totais ao final; valores em R$ (pt-BR), datas dd/mm/aaaa.
- Relatórios com dados de pacientes registram emissão em `auditoria`.

## Aceite
- Imprimir em A4 não corta colunas nem exibe elementos de navegação.
- Recepção não vê relatórios financeiros.
