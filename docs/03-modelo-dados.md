# Modelo de Dados (Firestore)

Valores monetários em centavos. Todos os documentos têm `criadoEm`, `atualizadoEm`, `criadoPor`.

## empresa/config (documento único)
razaoSocial, nomeFantasia, cnpj, registroProfissional (texto livre), responsavelTecnico, telefone, whatsapp, email, endereco{cep,logradouro,numero,complemento,bairro,cidade,uf}, logoUrl, carimboUrl, assinaturaUrl, horariosAtendimento[{diaSemana,inicio,fim,intervaloInicio,intervaloFim}], duracaoPadraoMin, servicos[{id,nome,duracaoMin,precoCentavos,ativo}], validadeReceitaDias, camposObrigatoriosReceita[], textoRodapeRelatorio, redesSociais{}

## papeis
id, nome, descricao, permissoes{modulo.acao: boolean}, sistema(boolean, papéis padrão não podem ser excluídos), ativo

## usuarios
uid, nome, email, telefone, papelId, ativo, ultimoAcesso, registroProfissional (opcional)

## pacientes
nome, cpf, dataNascimento, sexo, telefone, email, endereco{}, observacoes, consentimentoLgpd{aceito,data,origem}, ativo

## agendamentos
pacienteId (opcional até confirmar), nomeContato, telefone, email, servicoId, inicio(timestamp), fim(timestamp), status(pendente|confirmado|cancelado|remarcado|atendido|faltou), origem(site|interno), observacoes

## atendimentos
agendamentoId, pacienteId, profissionalUid, anamnese, acuidade{od,oe}, refracao{od{esf,cil,eixo,add,dnp},oe{...}}, observacoes, status

## receitas
numero (sequencial), atendimentoId, pacienteId, profissionalUid, refracao{}, validadeAte, observacoes, pdfUrl, emitidaEm, status(emitida|cancelada)

## contasReceber
descricao, pacienteId, atendimentoId, valorCentavos, vencimento, formaPagamento, status(pendente|pago|cancelado), pagoEm

## contasPagar
descricao, fornecedor, categoria, valorCentavos, vencimento, recorrencia{tipo,ate}, status(pendente|pago|cancelado), pagoEm

## auditoria
usuarioUid, acao, colecao, docId, data, resumo (escrita só por Functions/serviço; leitura só admin)

## Índices sugeridos
agendamentos(inicio, status); contasPagar(vencimento, status); contasReceber(vencimento, status); receitas(pacienteId, emitidaEm)
