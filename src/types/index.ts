export type UserRole = 'admin' | 'optometrista' | 'recepcao' | 'financeiro' | 'secretaria';

/**
 * Papel e Permissões do Sistema (docs/03-modelo-dados.md e docs/04-seguranca-e-permissoes.md)
 * Chaves no formato modulo.acao (ler, criar, editar, excluir, imprimir)
 */
export interface Papel {
  id: string; // 'admin' | 'optometrista' | 'recepcao' | 'financeiro' | custom
  nome: string;
  descricao: string;
  permissoes: Record<string, boolean>; // ex: { 'agenda.ler': true, ... }
  sistema: boolean; // Papéis padrão do sistema não podem ser excluídos
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

/**
 * Usuário da equipe interna do consultório
 */
export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  papelId: string;
  ativo: boolean;
  ultimoAcesso?: string;
  registroProfissional?: string;
  trocarSenhaNoPrimeiroAcesso?: boolean;
  fotoUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

/**
 * Registro de Auditoria do Sistema (docs/03-modelo-dados.md e docs/modulos/usuarios-e-papeis.md)
 */
export interface AuditoriaLog {
  id: string;
  usuarioUid: string;
  usuarioNome: string;
  usuarioEmail: string;
  acao: string;
  colecao: string;
  docId: string;
  data: string;
  resumo: string;
  valorAnterior?: Record<string, unknown> | null;
  valorNovo?: Record<string, unknown> | null;
  ip?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  papelId?: string;
  papelNome?: string;
  permissoes?: Record<string, boolean>;
  trocarSenhaNoPrimeiroAcesso?: boolean;
  registerNumber?: string; // ex: CBO 3223-05 ou CBOO
  phone?: string;
  photoURL?: string;
  token?: string;
  sessionToken?: string;
  createdAt?: string;
}

export interface ConsultorioHorario {
  diaSemana: string; // Ex: 'Segunda a Sexta', 'Sábado'
  inicio: string; // '08:00'
  fim: string; // '18:00'
  intervaloInicio?: string; // '12:00'
  intervaloFim?: string; // '13:30'
  fechado?: boolean;
}

export interface BloqueioAgenda {
  id?: string;
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  motivo: string;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  ativo: boolean;
  padrao?: boolean;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface MotivoCancelamento {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface MensagemPadraoWhatsapp {
  id: string;
  tipo: 'confirmacao' | 'lembrete' | 'retorno' | 'cancelamento' | 'personalizada';
  titulo: string;
  template: string; // Variáveis suportadas: {nome}, {data}, {hora}, {servico}
  ativo: boolean;
}

export interface LembretesEmailConfig {
  ativo: boolean;
  antecedenciaHoras: number;
  assuntoPadrao: string;
  corpoTemplate: string;
}

export interface ConsultorioServico {
  id: string;
  nome: string;
  descricao?: string;
  duracaoMin: number;
  precoCentavos: number;
  ativo: boolean;
  ordem?: number;
  destaque?: boolean;
}

export interface SobreOptometrista {
  nome: string;
  registroProfissional: string;
  fotoUrl: string;
  biografia: string;
  formacao?: string[];
  diferenciais?: string[];
}

export interface FotoGaleria {
  id: string;
  url: string;
  legenda?: string;
  ordem: number;
  ativo: boolean;
}

export interface Depoimento {
  id: string;
  nome: string; // Ex: 'Mariana S.'
  texto: string;
  nota: number; // 1 a 5 estrelas
  ativo: boolean;
  autorizacaoPaciente: boolean; // Requisito legal de autorização
  ordem?: number;
  data?: string;
}

export interface WhatsAppConfig {
  numero: string;
  mensagemInicial: string;
}

export interface HeroConfig {
  titulo: string;
  subtitulo: string;
  textoBotao: string;
  imagemUrl?: string;
}

export interface SecoesVisiveis {
  hero: boolean;
  servicos: boolean;
  sobre: boolean;
  galeria?: boolean;
  depoimentos: boolean;
  horarios: boolean;
  agendamento?: boolean;
  contato: boolean;
}

export interface SeoConfig {
  titulo: string;
  descricao: string;
}

/**
 * Registro Único do Consultório Optométrico Particular
 * Sistema monolito de consultório único (Não é SaaS).
 */
export interface Consultorio {
  id: 'dados_gerais'; // Identificador fixo que impede criação de um segundo registro
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  registroProfissional: string; // Registro da clínica no conselho/CBOO
  responsavelTecnico: string; // Nome do Optometrista RT
  registroResponsavelTecnico: string; // CBOO / CROO do RT
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  logoUrl?: string;
  carimboUrl?: string;
  assinaturaUrl?: string;
  redesSociais?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  horarioFuncionamento?: string;
  horariosAtendimento?: ConsultorioHorario[];
  intervaloMin?: number;
  duracaoPadraoMin?: number;
  antecedenciaMinimaHoras?: number;
  bloqueiosAgenda?: BloqueioAgenda[];
  servicosOferecidos?: string[];
  servicos?: ConsultorioServico[];
  validadeReceitaDias?: number;
  camposObrigatoriosReceita?: string[];
  textoRodapeRelatorio?: string;
  lembretesEmailConfig?: LembretesEmailConfig;
  formasPagamento?: FormaPagamento[];
  categoriasDespesa?: CategoriaDespesa[];
  motivosCancelamento?: MotivoCancelamento[];
  mensagensPadraoWhatsapp?: MensagemPadraoWhatsapp[];
  sobreOptometrista?: SobreOptometrista;
  depoimentos?: Depoimento[];
  galeria?: FotoGaleria[];
  hero?: HeroConfig;
  whatsappConfig?: WhatsAppConfig;
  secoesVisiveis?: SecoesVisiveis;
  ordemSecoes?: string[];
  mapaEmbedUrl?: string;
  publicadoPor?: {
    uid?: string;
    nome: string;
    email?: string;
    data: string;
  };
  politicaPrivacidadeTexto?: string;
  versaoPolitica?: string;
  textoRodape?: string;
  seo?: SeoConfig;
  updatedAt: string;
}

/**
 * Dados de Divulgação Pública do Consultório
 * Apenas informações institucionais públicas expostas para a landing page.
 */
export type ConsultorioPublicData = Omit<Consultorio, 'updatedAt'>;

/**
 * Registro de Consentimento LGPD no Agendamento
 */
export interface ConsentimentoLgpdRegistro {
  aceito: boolean;
  dataHora: string; // ISO 8601
  versao: string; // Versão da política no momento do aceite
  ip?: string;
  userAgent?: string;
}

/**
 * Agendamento Realizado pelo Site (Origem: site, Status inicial: pendente)
 * Conforme especificação em docs/modulos/agenda-e-agendamento.md e prompts/03-agendamento-na-home.md
 */
export interface AgendamentoSite {
  id: string;
  protocolo: string;
  nomeContato: string;
  telefone: string;
  email: string;
  servicoId: string;
  servicoNome: string;
  servicoPrecoCentavos: number;
  duracaoMin: number;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  inicio: string; // ISO
  fim: string; // ISO
  status: 'pendente' | 'confirmado' | 'cancelado' | 'remarcado' | 'atendido' | 'faltou';
  origem: 'site' | 'interno';
  observacoes?: string;
  consentimentoLgpd: ConsentimentoLgpdRegistro;
  criadoEm: string;
  atualizadoEm: string;
}

export interface SolicitacaoAgendamentoInput {
  nome: string;
  telefone: string;
  email: string;
  servicoId: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  consentimentoLgpd: boolean;
  versaoPolitica: string;
  website_hp?: string; // honeypot contra bots de spam
}

export interface HorariosDisponiveisResponse {
  data: string;
  servicoId: string;
  duracaoMin: number;
  horarios: string[];
}

export interface ResultadoAgendamento {
  sucesso: boolean;
  mensagem: string;
  agendamento?: AgendamentoSite;
  emailEnviado?: boolean;
}

export interface PatientConsentimentoLgpd {
  aceito: boolean;
  dataHora: string;
  versao: string;
  ip?: string;
  canal?: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  birthDate: string; // YYYY-MM-DD
  gender?: 'M' | 'F' | 'Outro';
  phone: string;
  email?: string;
  ativo?: boolean; // Desativar em vez de excluir
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  healthInsurance?: string;
  profession?: string;
  anamnesis?: {
    chiefComplaint?: string;
    lastExamDate?: string;
    wearsGlasses?: boolean;
    wearsContactLenses?: boolean;
    systemicDiseases?: string[];
    ocularFamilyHistory?: string[];
    currentMedications?: string;
    allergies?: string;
  };
  consentimentoLgpd?: PatientConsentimentoLgpd;
  anonimizado?: boolean;
  anonimizadoEm?: string;
  anonimizadoPor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'pendente'
  | 'agendado'
  | 'confirmado'
  | 'em_espera'
  | 'em_atendimento'
  | 'atendido'
  | 'concluido'
  | 'cancelado'
  | 'remarcado'
  | 'faltou';

export type AppointmentType =
  | 'consulta_completa'
  | 'retorno'
  | 'adaptacao_lentes'
  | 'acuidade_infantil'
  | 'urgencia';

export interface Appointment {
  id: string;
  protocolo?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  serviceId?: string;
  serviceName?: string;
  servicePriceInCents?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  origem?: 'site' | 'interno';
  optometristName?: string;
  notes?: string;
  motivoCancelamentoId?: string;
  motivoCancelamento?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EyeRefraction {
  spherical: number; // Esférico: -20.00 a +20.00
  cylindrical: number; // Cilíndrico: -10.00 a 0.00
  axis: number; // Eixo: 0 a 180 graus
  dnp?: number; // Distância Naso-Pupilar em mm
  addition?: number; // Adição (para presbiopia): +0.75 a +4.00
  visualAcuity?: string; // ex: 20/20, 20/25, 20/30
}

export interface KeratometryEye {
  k1?: number; // D ou mm
  k2?: number; // D ou mm
  axis?: number; // Eixo
}

export interface Exam {
  id: string;
  patientId: string;
  patientName: string;
  optometristId: string;
  optometristName: string;
  date: string;
  visualAcuitySc: {
    od: string;
    oe: string;
    binocular?: string;
  };
  visualAcuityCc: {
    od: string;
    oe: string;
    binocular?: string;
  };
  subjectiveRefraction: {
    od: EyeRefraction;
    oe: EyeRefraction;
  };
  objectiveRefraction?: {
    od?: EyeRefraction;
    oe?: EyeRefraction;
  };
  pupillaryDistance?: {
    dpTotal?: number;
    dnpOd?: number;
    dnpOe?: number;
  };
  keratometry?: {
    od?: KeratometryEye;
    oe?: KeratometryEye;
  };
  intraocularPressure?: {
    od?: number; // mmHg
    oe?: number;
    method?: string;
  };
  agendamentoId?: string;
  anamnese?: {
    motivoConsulta?: string;
    queixaPrincipal?: string;
    historicoVisual?: string;
    usaOculos?: boolean;
    usaLentesContato?: boolean;
    doencasSistemicas?: string;
    alergias?: string;
    medicamentosUso?: string;
    antecedentesFamiliares?: string;
  };
  clinicalFindings?: string;
  diagnosisNotes?: string;
  lensesRecommendation?: {
    type: 'monofocal' | 'multifocal' | 'bifocal' | 'lente_contato' | 'somente_leitura';
    filters: string[];
    material?: string;
  };
  receitaId?: string;
  status: 'rascunho' | 'em_andamento' | 'finalizado' | 'cancelado';
  createdAt: string;
  finalizadoEm?: string;
}

export interface Prescription {
  id: string;
  numeroSequencial?: number;
  numeroFormatado?: string;
  status?: 'emitida' | 'cancelada';
  examId?: string;
  atendimentoId?: string;
  patientId: string;
  patientName: string;
  optometristName: string;
  registerNumber: string;
  date: string;
  expirationDate: string;
  validadeDias?: number;
  od: EyeRefraction;
  oe: EyeRefraction;
  dpTotal?: number;
  lensType: string;
  coatings: string[];
  recommendations: string;
  observacoes?: string;
  snapshotConsultorio?: any;
  snapshotProfissional?: any;
  snapshotPaciente?: any;
  contagemReimpressoes?: number;
  historicoEnvios?: Array<{
    tipo: 'email' | 'whatsapp';
    destinatario: string;
    data: string;
    usuarioId: string;
    usuarioNome: string;
    linkTemporario?: string;
    expiraEm?: string;
  }>;
  tokenAcessoTemporario?: string;
  tokenExpiraEm?: string;
  cancelada?: boolean;
  motivoCancelamento?: string;
  canceladaEm?: string;
  canceladaPor?: {
    id: string;
    nome: string;
  };
  createdAt: string;
}

/**
 * Transação Financeira do Consultório (Prompt 10)
 * Estritamente Clínico - Sem Comércio de Óculos/Armações
 */
export type FinancialStatus = 'pago' | 'pendente' | 'cancelado';
export type FinancialType = 'receita' | 'despesa';

export interface FinancialTransaction {
  id: string;
  type: FinancialType;
  description: string;
  amountInCents: number; // Centavos: R$ 180,00 = 18000
  status: FinancialStatus;

  // Datas
  date: string; // YYYY-MM-DD (data de competência / emissão)
  dueDate: string; // YYYY-MM-DD (data de vencimento)
  paymentDate?: string; // YYYY-MM-DD (data da baixa / pagamento)

  // Categorias e Formas de Pagamento vindas dos cadastros auxiliares editáveis (Prompt 06)
  category?: string; // legibilidade / compatibilidade
  categoryId?: string;
  categoryName: string;

  paymentMethod?: string; // legibilidade / compatibilidade
  paymentMethodId?: string;
  paymentMethodName: string;

  // Relações Clínicas (Contas a Receber)
  patientId?: string;
  patientName?: string;
  atendimentoId?: string;
  agendamentoId?: string;

  // Fornecedor (Contas a Pagar)
  supplierName?: string;

  // Recorrência Mensal
  isRecurring?: boolean;
  recurringFrequency?: 'mensal';
  recurringParentId?: string;

  // Parcelamento Simples
  installmentNumber?: number; // ex: 1
  installmentTotal?: number; // ex: 3 (exibe 1/3)
  installmentGroupCode?: string;

  // Anexo de Comprovante (Prompt 10)
  receiptUrl?: string; // Data URL ou link seguro do comprovante
  receiptName?: string;

  // Observações e Auditoria
  notes?: string;
  canceledReason?: string;
  canceledAt?: string;
  canceledBy?: { id: string; nome: string };
  paidAt?: string;
  paidBy?: { id: string; nome: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialCategoryTotal {
  categoryId?: string;
  categoryName: string;
  type: FinancialType;
  totalCentavos: number;
  count: number;
  percentual: number;
}

export interface FinancialCashFlowMonth {
  mesAno: string; // '2026-05', etc.
  mesNome: string; // 'Maio/26'
  receitasCentavos: number;
  despesasCentavos: number;
  saldoCentavos: number;
  saldoAcumuladoCentavos: number;
}

export interface FinancialSummary {
  totalIncomeInCents: number; // Receitas pagas
  totalExpenseInCents: number; // Despesas pagas
  balanceInCents: number; // Saldo realizado (receitas - despesas)
  pendingReceivableInCents: number; // A receber pendente
  pendingPayableInCents: number; // A pagar pendente
  forecastBalanceInCents: number; // Saldo previsto (realizado + a receber - a pagar)
  pendingCount: number; // Total de pendências
  vencendoHojeCount: number;
  atrasadasCount: number;
  vencendoHojeList?: FinancialTransaction[];
  atrasadasList?: FinancialTransaction[];
  totaisPorCategoria?: FinancialCategoryTotal[];
  fluxoCaixaMensal?: FinancialCashFlowMonth[];
}

export interface FinancialFilters {
  tipo?: 'todos' | 'receita' | 'despesa';
  status?: 'todos' | 'pago' | 'pendente' | 'cancelado' | 'vence_hoje' | 'atrasadas';
  periodoInicio?: string;
  periodoFim?: string;
  categoria?: string;
  busca?: string;
  pacienteId?: string;
}
