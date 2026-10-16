import {
  Patient,
  Appointment,
  Exam,
  Prescription,
  InventoryItem,
  FinancialTransaction,
  UserProfile,
  Consultorio,
} from '../types';

const STORAGE_KEYS = {
  CONSULTORIO: 'consultorio_dados_gerais_v1',
  USERS: 'consultorio_equipe_v1',
  PATIENTS: 'consultorio_pacientes_v1',
  APPOINTMENTS: 'consultorio_agenda_v1',
  EXAMS: 'consultorio_exames_v1',
  PRESCRIPTIONS: 'consultorio_prescricoes_v1',
  INVENTORY: 'consultorio_estoque_v1',
  FINANCES: 'consultorio_financas_v1',
  CURRENT_USER: 'consultorio_usuario_sessao_v1',
};

/**
 * Registro Único Inicial do Consultório Particular (Valores de Exemplo)
 * Editável no painel em /admin/configuracoes.
 */
export const INITIAL_CONSULTORIO: Consultorio = {
  id: 'dados_gerais',
  razaoSocial: 'Consultório de Optometria Dr. Roberto Viana Ltda [EXEMPLO]',
  nomeFantasia: 'Consultório de Optometria Dr. Roberto Viana [EXEMPLO]',
  cnpj: '12.345.678/0001-90',
  registroProfissional: 'CBOO 14.892-SP',
  responsavelTecnico: 'Dr. Roberto Viana',
  registroResponsavelTecnico: 'CBO 3223-05 | CBOO 14.892-SP',
  telefone: '(11) 3289-4321',
  whatsapp: '(11) 98765-4321',
  email: 'contato@consultoriorobertoviana.com.br',
  endereco: {
    logradouro: 'Av. Paulista',
    numero: '1200',
    complemento: 'Conjunto 84',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-100',
  },
  logoUrl: '',
  redesSociais: {
    instagram: '@consultorio.optometria',
  },
  horarioFuncionamento: 'Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:00 às 12:00',
  servicosOferecidos: [
    'Exame de Refração Completo (Longe e Perto)',
    'Acuidade Visual e Avaliação do Alinhamento Binocular',
    'Adaptação Personalizada de Lentes de Contato',
    'Triagem Visual Infantil e Avaliação Escolar',
    'Prescrição Óptica de Óculos com Corredor Visual e Filtro Azul',
  ],
  updatedAt: '2026-01-10T10:00:00.000Z',
};

// Equipe interna do consultório particular (não há cadastro público)
export const DEMO_USER_OPTOMETRIST: UserProfile = {
  uid: 'optometrista-01',
  email: 'roberto@consultoriorobertoviana.com.br',
  displayName: 'Dr. Roberto Viana',
  role: 'optometrista',
  registerNumber: 'CBOO 14.892-SP | CBO 3223-05',
  phone: '(11) 98765-4321',
  photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-01-10T10:00:00.000Z',
};

export const DEMO_USER_SECRETARY: UserProfile = {
  uid: 'secretaria-01',
  email: 'recepcao@consultoriorobertoviana.com.br',
  displayName: 'Juliana Paes',
  role: 'secretaria',
  phone: '(11) 97654-1234',
  photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-01-15T09:00:00.000Z',
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    name: 'Ana Beatriz Souza',
    cpf: '321.456.789-01',
    birthDate: '1989-06-14',
    gender: 'F',
    phone: '(11) 99123-4567',
    email: 'ana.souza@gmail.com',
    healthInsurance: 'Unimed Pleno',
    profession: 'Designer Gráfica',
    address: {
      street: 'Av. Paulista',
      number: '1200, Apto 84',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
    anamnesis: {
      chiefComplaint: 'Cefaleia frontal no fim do expediente e cansaço visual ao trabalhar no computador.',
      lastExamDate: '2024-08-10',
      wearsGlasses: true,
      wearsContactLenses: false,
      systemicDiseases: ['Enxaqueca'],
      ocularFamilyHistory: ['Miopia materna', 'Glaucoma avô paterno'],
      currentMedications: 'Dipirona esporádica',
      allergies: 'Nenhuma relatada',
    },
    notes: 'Costuma passar mais de 10 horas diárias em frente a telas digitais.',
    createdAt: '2026-02-01T14:30:00.000Z',
    updatedAt: '2026-02-15T11:20:00.000Z',
  },
  {
    id: 'pat-002',
    name: 'Marcos Vinicius Ribeiro',
    cpf: '456.789.012-34',
    birthDate: '1975-11-22',
    gender: 'M',
    phone: '(11) 98234-5678',
    email: 'marcos.v.ribeiro@outlook.com',
    healthInsurance: 'Particular',
    profession: 'Contador',
    address: {
      street: 'Rua Vergueiro',
      number: '2040',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04102-000',
    },
    anamnesis: {
      chiefComplaint: 'Braço curto para leitura de notas fiscais e celular. Visão embaçada para perto.',
      lastExamDate: '2023-05-18',
      wearsGlasses: true,
      wearsContactLenses: false,
      systemicDiseases: ['Hipertensão controlada'],
      ocularFamilyHistory: ['Presbiopia precoce'],
      currentMedications: 'Losartana 50mg',
      allergies: 'Penicilina',
    },
    notes: 'Interesse em lentes multifocais com corredor amplo e proteção digital.',
    createdAt: '2026-01-20T09:15:00.000Z',
    updatedAt: '2026-02-10T16:45:00.000Z',
  },
  {
    id: 'pat-003',
    name: 'Camila Fernandes Lopes',
    cpf: '567.890.123-45',
    birthDate: '2004-03-30',
    gender: 'F',
    phone: '(11) 97345-6789',
    email: 'camila.lopes@universidade.edu.br',
    healthInsurance: 'Bradesco Saúde',
    profession: 'Estudante de Engenharia',
    address: {
      street: 'Rua Domingos de Morais',
      number: '880',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04010-100',
    },
    anamnesis: {
      chiefComplaint: 'Dificuldade para enxergar lousa e projeções em sala de aula.',
      lastExamDate: '2025-01-10',
      wearsGlasses: true,
      wearsContactLenses: true,
      systemicDiseases: [],
      ocularFamilyHistory: ['Miopia alta familiar'],
      currentMedications: 'Nenhum',
      allergies: 'Rinite alérgica',
    },
    notes: 'Usa lentes de contato gelatinosas descartáveis mensais.',
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    patientPhone: '(11) 99123-4567',
    date: '2026-10-16',
    time: '09:00',
    durationMinutes: 45,
    type: 'consulta_completa',
    status: 'confirmado',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Revisão refrativa anual e queixa de cansaço digital.',
    createdAt: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'apt-002',
    patientId: 'pat-002',
    patientName: 'Marcos Vinicius Ribeiro',
    patientPhone: '(11) 98234-5678',
    date: '2026-10-16',
    time: '10:00',
    durationMinutes: 45,
    type: 'consulta_completa',
    status: 'em_espera',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Avaliação de presbiopia e atualização de receita para perto.',
    createdAt: '2026-10-11T14:20:00.000Z',
  },
  {
    id: 'apt-003',
    patientId: 'pat-003',
    patientName: 'Camila Fernandes Lopes',
    patientPhone: '(11) 97345-6789',
    date: '2026-10-16',
    time: '11:15',
    durationMinutes: 30,
    type: 'adaptacao_lentes',
    status: 'agendado',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Teste de nova marca de lente de contato tórica para astigmatismo.',
    createdAt: '2026-10-12T10:15:00.000Z',
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex-001',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    optometristId: 'optometrista-01',
    optometristName: 'Dr. Roberto Viana',
    date: '2026-10-15',
    visualAcuitySc: {
      od: '20/60',
      oe: '20/50',
      binocular: '20/40',
    },
    visualAcuityCc: {
      od: '20/20',
      oe: '20/20',
      binocular: '20/15',
    },
    subjectiveRefraction: {
      od: {
        spherical: -1.75,
        cylindrical: -0.75,
        axis: 175,
        dnp: 31.0,
        visualAcuity: '20/20',
      },
      oe: {
        spherical: -1.50,
        cylindrical: -0.50,
        axis: 5,
        dnp: 31.5,
        visualAcuity: '20/20',
      },
    },
    pupillaryDistance: {
      dpTotal: 62.5,
      dnpOd: 31.0,
      dnpOe: 31.5,
    },
    keratometry: {
      od: { k1: 43.25, k2: 44.00, axis: 175 },
      oe: { k1: 43.50, k2: 44.25, axis: 5 },
    },
    intraocularPressure: {
      od: 14,
      oe: 15,
      method: 'Tonometria de Aplanação',
    },
    clinicalFindings: 'Meios ópticos transparentes, reflexos pupilares diretos e consensuais preservados.',
    diagnosisNotes: 'Miopia composta com astigmatismo miópico a favor da regra bilateral.',
    lensesRecommendation: {
      type: 'monofocal',
      filters: ['Filtro de Luz Azul (Blue Cut)', 'Tratamento Antirreflexo Premium', 'Proteção UV400'],
      material: 'Resina 1.61 Alto Índice',
    },
    status: 'finalizado',
    createdAt: '2026-10-15T16:00:00.000Z',
  },
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'prx-001',
    examId: 'ex-001',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    optometristName: 'Dr. Roberto Viana',
    registerNumber: 'CBOO 14.892-SP | CBO 3223-05',
    date: '2026-10-15',
    expirationDate: '2027-10-15',
    od: {
      spherical: -1.75,
      cylindrical: -0.75,
      axis: 175,
      dnp: 31.0,
      visualAcuity: '20/20',
    },
    oe: {
      spherical: -1.50,
      cylindrical: -0.50,
      axis: 5,
      dnp: 31.5,
      visualAcuity: '20/20',
    },
    dpTotal: 62.5,
    lensType: 'Monofocal Digital com Filtro Blue Control',
    coatings: ['Antirreflexo Super Hidrofóbico', 'Filtro Luz Azul', 'Proteção UV 400nm'],
    recommendations: 'Uso contínuo para atividades laborais em computador, leitura e condução veicular.',
    createdAt: '2026-10-15T16:10:00.000Z',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Armação Titanium Flex 54-17',
    category: 'armacao',
    brand: 'Coleção Consultório',
    modelCode: 'MOD-8021-TIT',
    quantity: 14,
    minAlertQuantity: 5,
    costPriceInCents: 12000, // R$ 120,00
    sellingPriceInCents: 38000, // R$ 380,00
    status: 'disponivel',
  },
  {
    id: 'inv-002',
    name: 'Armação Acetato Italiano Retrô Tartaruga',
    category: 'armacao',
    brand: 'Ottica Design',
    modelCode: 'MOD-441-TOR',
    quantity: 8,
    minAlertQuantity: 3,
    costPriceInCents: 9500, // R$ 95,00
    sellingPriceInCents: 29000, // R$ 290,00
    status: 'disponivel',
  },
  {
    id: 'inv-003',
    name: 'Lentes de Contato Hidrogel Tórica Mensal (Cx 6)',
    category: 'lente_contato',
    brand: 'BioSoft Vision',
    modelCode: 'BIO-TOR-6P',
    quantity: 4,
    minAlertQuantity: 6,
    costPriceInCents: 11000, // R$ 110,00
    sellingPriceInCents: 24000, // R$ 240,00
    status: 'baixo_estoque',
  },
];

export const INITIAL_FINANCIAL: FinancialTransaction[] = [
  {
    id: 'fin-001',
    date: '2026-10-15',
    description: 'Consulta Optométrica Completa + Refração',
    type: 'receita',
    category: 'consulta',
    amountInCents: 18000, // R$ 180,00
    status: 'pago',
    paymentMethod: 'pix',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
  },
  {
    id: 'fin-002',
    date: '2026-10-15',
    description: 'Venda de Armação Titanium + Lentes Blue Cut',
    type: 'receita',
    category: 'venda_armacao',
    amountInCents: 68000, // R$ 680,00
    status: 'pago',
    paymentMethod: 'cartao_credito',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
  },
  {
    id: 'fin-003',
    date: '2026-10-14',
    description: 'Reposição de Insumos e Colírios Lubrificantes',
    type: 'despesa',
    category: 'insumos',
    amountInCents: 32000, // R$ 320,00
    status: 'pago',
    paymentMethod: 'pix',
  },
];

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar dados na chave ${key}:`, e);
  }
}

export { STORAGE_KEYS };
