export type UserRole = 'optometrista' | 'secretaria' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  registerNumber?: string; // ex: CBO 3223-05 ou CBOO
  phone?: string;
  photoURL?: string;
  createdAt?: string;
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
  redesSociais?: {
    instagram?: string;
    facebook?: string;
  };
  horarioFuncionamento?: string;
  servicosOferecidos?: string[];
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  birthDate: string; // dd/mm/aaaa ou YYYY-MM-DD
  gender?: 'M' | 'F' | 'Outro';
  phone: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_espera'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado';

export type AppointmentType =
  | 'consulta_completa'
  | 'retorno'
  | 'adaptacao_lentes'
  | 'acuidade_infantil'
  | 'urgencia';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // dd/mm/aaaa ou YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  optometristName?: string;
  notes?: string;
  createdAt: string;
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
  clinicalFindings?: string;
  diagnosisNotes?: string;
  lensesRecommendation?: {
    type: 'monofocal' | 'multifocal' | 'bifocal' | 'lente_contato' | 'somente_leitura';
    filters: string[];
    material?: string;
  };
  status: 'rascunho' | 'finalizado';
  createdAt: string;
}

export interface Prescription {
  id: string;
  examId?: string;
  patientId: string;
  patientName: string;
  optometristName: string;
  registerNumber: string;
  date: string;
  expirationDate: string;
  od: EyeRefraction;
  oe: EyeRefraction;
  dpTotal?: number;
  lensType: string;
  coatings: string[];
  recommendations: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'armacao' | 'lente_oftalmica' | 'lente_contato' | 'solucao_limpeza' | 'acessorio';
  brand: string;
  modelCode: string;
  quantity: number;
  minAlertQuantity: number;
  costPriceInCents: number; // Valor em centavos (inteiro)
  sellingPriceInCents: number; // Valor em centavos (inteiro)
  status: 'disponivel' | 'baixo_estoque' | 'esgotado';
}

export interface FinancialTransaction {
  id: string;
  date: string; // dd/mm/aaaa ou YYYY-MM-DD
  description: string;
  type: 'receita' | 'despesa';
  category: 'consulta' | 'exame' | 'venda_armacao' | 'venda_lentes' | 'aluguel' | 'insumos' | 'outros';
  amountInCents: number; // Valor em centavos (inteiro)
  status: 'pago' | 'pendente' | 'cancelado';
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto';
  patientId?: string;
  patientName?: string;
}
