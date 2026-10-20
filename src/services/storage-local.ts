import {
  Patient,
  Appointment,
  Exam,
  Prescription,
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
  FINANCES: 'consultorio_financas_v1',
  CURRENT_USER: 'consultorio_usuario_sessao_v1',
};

/**
 * Registro Único Inicial do Consultório Particular (Valores de Exemplo)
 * Editável no painel em /admin/configuracoes.
 */
export const INITIAL_CONSULTORIO: Consultorio = {
  id: 'dados_gerais',
  razaoSocial: 'Optoclin Cuidados Visuais & Optometria Ltda',
  nomeFantasia: 'Optoclin',
  cnpj: '12.345.678/0001-90',
  registroProfissional: 'CBO 3223-05 • CBOO',
  responsavelTecnico: 'Optometrista Responsável Técnico',
  registroResponsavelTecnico: 'CBO 3223-05 • CBOO',
  telefone: '(79) 99109-2420',
  whatsapp: '(79) 99109-2420',
  email: 'contato@souoptoclin.com.br',
  endereco: {
    logradouro: 'Rua João Pessoa',
    numero: 'sala 8',
    complemento: 'Galeria Norcon Shopping',
    bairro: 'Centro',
    cidade: 'Aracaju',
    uf: 'SE',
    cep: '49010-130',
  },
  logoUrl: '',
  redesSociais: {
    instagram: '@souoptoclin',
    facebook: 'souoptoclin',
  },
  horarioFuncionamento: 'Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:30 às 13:00',
  horariosAtendimento: [
    { diaSemana: 'Segunda-feira', inicio: '08:00', fim: '18:00', intervaloInicio: '12:00', intervaloFim: '13:30', fechado: false },
    { diaSemana: 'Terça-feira', inicio: '08:00', fim: '18:00', intervaloInicio: '12:00', intervaloFim: '13:30', fechado: false },
    { diaSemana: 'Quarta-feira', inicio: '08:00', fim: '18:00', intervaloInicio: '12:00', intervaloFim: '13:30', fechado: false },
    { diaSemana: 'Quinta-feira', inicio: '08:00', fim: '18:00', intervaloInicio: '12:00', intervaloFim: '13:30', fechado: false },
    { diaSemana: 'Sexta-feira', inicio: '08:00', fim: '18:00', intervaloInicio: '12:00', intervaloFim: '13:30', fechado: false },
    { diaSemana: 'Sábado', inicio: '08:00', fim: '12:00', fechado: false },
    { diaSemana: 'Domingo', inicio: '00:00', fim: '00:00', fechado: true },
  ],
  servicosOferecidos: [
    'Exame de Refração Completo (Longe e Perto)',
    'Acuidade Visual e Avaliação do Alinhamento Binocular',
    'Adaptação Personalizada de Lentes de Contato',
    'Triagem Visual Infantil e Avaliação Escolar',
    'Prescrição Óptica de Óculos com Corredor Visual e Filtro Azul',
  ],
  servicos: [
    {
      id: 'srv-001',
      nome: 'Exame de Refração Completo',
      descricao: 'Avaliação refrativa minuciosa para determinação precisa de miopia, hipermetropia, astigmatismo e presbiopia, com teste subjetivo e prescrição óptica individualizada.',
      duracaoMin: 40,
      precoCentavos: 15000,
      ativo: true,
      destaque: true,
    },
    {
      id: 'srv-002',
      nome: 'Adaptação de Lentes de Contato',
      descricao: 'Avaliação corneana e ceratometria computadorizada para indicação do modelo ideal (gelatinosas, tóricas ou rígidas), incluindo treinamento de assepsia e inserção.',
      duracaoMin: 50,
      precoCentavos: 18000,
      ativo: true,
      destaque: true,
    },
    {
      id: 'srv-003',
      nome: 'Triagem Visual Infantil & Escolar',
      descricao: 'Exame especializado para crianças a partir de 4 anos, focado na prevenção do olho preguiçoso (ambliopia), testes de estereopsia e rendimento escolar.',
      duracaoMin: 30,
      precoCentavos: 12000,
      ativo: true,
      destaque: true,
    },
    {
      id: 'srv-004',
      nome: 'Avaliação de Fadiga Visual (Telas e Escritório)',
      descricao: 'Análise de estresse acomodativo decorrente de uso contínuo de monitores e smartphones, com cálculo de adição ocupacional e filtros antirreflexo.',
      duracaoMin: 35,
      precoCentavos: 13000,
      ativo: true,
      destaque: false,
    },
    {
      id: 'srv-005',
      nome: 'Alinhamento Binocular e Visão de Cores',
      descricao: 'Investigação de forias, estrabismos latentes, teste de Ishihara para discromatopsias e motilidade ocular.',
      duracaoMin: 30,
      precoCentavos: 10000,
      ativo: true,
      destaque: false,
    },
  ],
  sobreOptometrista: {
    nome: 'Dr. Roberto Viana',
    registroProfissional: 'CBO 3223-05 | CBOO 14.892-SP',
    fotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
    biografia: 'Profissional dedicado à atenção primária da saúde visual há mais de 12 anos. Formado em Optometria Clínica e com aperfeiçoamento contínuo em refração ocular computadorizada e contatologia avançada. Nosso atendimento prioriza o diagnóstico preciso de erros refrativos, conforto visual e a escuta cuidadosa das queixas de cada paciente.',
    formacao: [
      'Bacharel em Optometria — Especialização em Refração Clínica',
      'Pós-graduado em Adaptação de Lentes de Contato Especiais e Superfície Ocular',
      'Membro Efetivo do Conselho Brasileiro de Óptica e Optometria (CBOO)',
      'Participante regular de simpósios nacionais de ciências da visão',
    ],
    diferenciais: [
      'Consultas com duração de 40 a 50 minutos para exame calmo e minucioso',
      'Refrator computadorizado e projetor de optotipos calibrados',
      'Explicação didática da receita e orientação sincera sobre o melhor tipo de lente para sua rotina',
      'Gabinete optométrico climatizado com biossegurança e esterilização rigorosa',
    ],
  },
  depoimentos: [
    {
      id: 'dep-001',
      nome: 'Mariana S.',
      texto: 'Sofria com dores de cabeça constantes após o trabalho no computador. O Dr. Roberto fez um exame super detalhado, descobriu um pequeno astigmatismo que nunca ninguém tinha notado e meus novos óculos resolveram tudo!',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      data: 'Fevereiro de 2026',
    },
    {
      id: 'dep-002',
      nome: 'Carlos E. Mendonça',
      texto: 'Atendimento pontual e extremamente cuidadoso. Foi a primeira vez que me explicaram exatamente cada número da minha receita com paciência. O consultório é moderno e acolhedor.',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      data: 'Janeiro de 2026',
    },
    {
      id: 'dep-003',
      nome: 'Juliana F. Alcantara',
      texto: 'Trouxe meu filho de 7 anos que estava com dificuldade de leitura na escola. A abordagem foi muito carinhosa e o teste apontou necessidade de óculos para perto. O desempenho dele melhorou muito!',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      data: 'Dezembro de 2025',
    },
    {
      id: 'dep-004',
      nome: 'Renato M. Silveira',
      texto: 'Adaptação de lentes de contato perfeita. Tinha medo por experiências passadas ruins, mas a orientação e o treino aqui no consultório fizeram toda a diferença no conforto.',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      data: 'Novembro de 2025',
    },
  ],
  galeria: [
    {
      id: 'gal-01',
      url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      legenda: 'Gabinete de Refração Computadorizada e Projetor de Optotipos',
      ordem: 1,
      ativo: true,
    },
    {
      id: 'gal-02',
      url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      legenda: 'Biomicroscópio e Lâmpada de Fenda para Adaptação de Lentes',
      ordem: 2,
      ativo: true,
    },
    {
      id: 'gal-03',
      url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      legenda: 'Recepção e Sala de Espera Climatizada e Confortável',
      ordem: 3,
      ativo: true,
    },
  ],
  hero: {
    titulo: 'Cuidando da sua saúde visual com precisão e atendimento humanizado',
    subtitulo: 'Exames de refração completos para óculos, adaptação especializada de lentes de contato e avaliação visual individualizada para você e sua família.',
    textoBotao: 'Agendar Exame',
    imagemUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  },
  whatsappConfig: {
    numero: '(11) 98765-4321',
    mensagemInicial: 'Olá! Gostaria de agendar um exame de refração no consultório.',
  },
  secoesVisiveis: {
    hero: true,
    servicos: true,
    sobre: true,
    galeria: true,
    depoimentos: true,
    horarios: true,
    agendamento: true,
    contato: true,
  },
  ordemSecoes: ['hero', 'servicos', 'sobre', 'galeria', 'depoimentos', 'horarios', 'agendamento', 'contato'],
  mapaEmbedUrl: '',
  publicadoPor: {
    nome: 'Dr. Roberto Viana (Administrador)',
    data: '2026-01-15T12:00:00.000Z',
  },
  politicaPrivacidadeTexto: 'Este consultório particular de optometria trata seus dados pessoais cadastrais e clínicos estritamente de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e resoluções do conselho profissional de optometria. Seus dados cadastrais (nome, telefone, e-mail) são utilizados exclusivamente para contato, confirmação de agendamentos e emissão de comprovantes. Suas informações de refração, anamnese e acuidade visual compõem seu prontuário optométrico sigiloso, acessível somente pelo profissional responsável pelo seu atendimento e pela recepção estritamente autorizada. Em nenhuma circunstância compartilhamos seus dados com terceiros ou redes de publicidade. Você pode solicitar a qualquer momento a conferência ou atualização dos seus dados cadastrais diretamente na recepção do consultório.',
  versaoPolitica: '1.0',
  textoRodape: 'Atendimento optométrico clínico em estrita conformidade com a Classificação Brasileira de Ocupações (CBO 3223-05) e normas do CBOO. Consultório particular de uso exclusivo.',
  seo: {
    titulo: 'Consultório de Optometria Dr. Roberto Viana | Exames de Vista em São Paulo',
    descricao: 'Exame de refração completo, acuidade visual e adaptação de lentes de contato na Av. Paulista. Atendimento particular de excelência com hora marcada.',
  },
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
    protocolo: 'OPTO-INT-20261017-01',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    patientPhone: '(11) 99123-4567',
    patientEmail: 'ana.souza@gmail.com',
    serviceId: 'srv-001',
    serviceName: 'Exame de Refração Completo',
    servicePriceInCents: 16000,
    date: '2026-10-17',
    time: '09:00',
    durationMinutes: 40,
    type: 'consulta_completa',
    status: 'confirmado',
    origem: 'interno',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Revisão refrativa anual e queixa de cansaço digital.',
    createdAt: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'apt-002',
    protocolo: 'OPTO-WEB-20261017-02',
    patientId: 'pat-002',
    patientName: 'Marcos Vinicius Ribeiro',
    patientPhone: '(11) 98234-5678',
    patientEmail: 'marcos.ribeiro@empresa.com.br',
    serviceId: 'srv-002',
    serviceName: 'Adaptação de Lentes de Contato',
    servicePriceInCents: 20000,
    date: '2026-10-17',
    time: '10:30',
    durationMinutes: 50,
    type: 'adaptacao_lentes',
    status: 'pendente',
    origem: 'site',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Solicitação realizada pelo formulário do site. Aguardando confirmação.',
    createdAt: '2026-10-16T19:30:00.000Z',
  },
  {
    id: 'apt-003',
    protocolo: 'OPTO-INT-20261017-03',
    patientId: 'pat-003',
    patientName: 'Camila Fernandes Lopes',
    patientPhone: '(11) 97345-6789',
    patientEmail: 'camila.lopes@universidade.edu.br',
    serviceId: 'srv-003',
    serviceName: 'Triagem Visual Infantil & Escolar',
    servicePriceInCents: 12000,
    date: '2026-10-17',
    time: '14:00',
    durationMinutes: 30,
    type: 'acuidade_infantil',
    status: 'atendido',
    origem: 'interno',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Paciente atendida pontualmente no gabinete 1.',
    createdAt: '2026-10-12T10:15:00.000Z',
  },
  {
    id: 'apt-004',
    protocolo: 'OPTO-WEB-20261018-04',
    patientId: 'pat-004',
    patientName: 'Eduardo Rocha Lima',
    patientPhone: '(11) 98877-6655',
    patientEmail: 'eduardo.rocha@outlook.com',
    serviceId: 'srv-001',
    serviceName: 'Exame de Refração Completo',
    servicePriceInCents: 16000,
    date: '2026-10-18',
    time: '11:00',
    durationMinutes: 40,
    type: 'consulta_completa',
    status: 'pendente',
    origem: 'site',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Agendamento novo vindo do site.',
    createdAt: '2026-10-17T08:15:00.000Z',
  },
  {
    id: 'apt-005',
    protocolo: 'OPTO-INT-20261018-05',
    patientId: 'pat-005',
    patientName: 'Luciana Silveira',
    patientPhone: '(11) 97766-5544',
    patientEmail: 'luciana.silveira@gmail.com',
    serviceId: 'srv-001',
    serviceName: 'Exame de Refração Completo',
    servicePriceInCents: 16000,
    date: '2026-10-18',
    time: '15:30',
    durationMinutes: 40,
    type: 'consulta_completa',
    status: 'cancelado',
    motivoCancelamentoId: 'mc-01',
    motivoCancelamento: 'Desistência expressa do paciente',
    origem: 'interno',
    optometristName: 'Dr. Roberto Viana',
    notes: 'Cancelado a pedido da paciente por viagem de trabalho.',
    createdAt: '2026-10-14T11:00:00.000Z',
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

export const INITIAL_FINANCIAL: FinancialTransaction[] = [
  {
    id: 'fin-001',
    date: '2026-10-15',
    dueDate: '2026-10-15',
    paymentDate: '2026-10-15',
    description: 'Consulta Optométrica Completa + Refração Computadorizada',
    type: 'receita',
    category: 'consulta',
    categoryName: 'Exame de Refração Completo',
    amountInCents: 18000, // R$ 180,00
    status: 'pago',
    paymentMethod: 'pix',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
  },
  {
    id: 'fin-002',
    date: '2026-10-15',
    dueDate: '2026-10-15',
    paymentDate: '2026-10-15',
    description: 'Exame de Avaliação Binocular e Motilidade Ocular',
    type: 'receita',
    category: 'exame',
    categoryName: 'Avaliação Visual Ocupacional e Cansaço Digital',
    amountInCents: 14000, // R$ 140,00
    status: 'pago',
    paymentMethod: 'cartao_credito',
    paymentMethodName: 'Cartão de Crédito à Vista',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
  },
  {
    id: 'fin-003',
    date: '2026-10-14',
    dueDate: '2026-10-14',
    paymentDate: '2026-10-14',
    description: 'Reposição de Insumos Clínicos (Colírios e Protetores Oculares)',
    type: 'despesa',
    category: 'insumos_clinicos',
    categoryName: 'Insumos Clínicos & Esterilização',
    amountInCents: 32000, // R$ 320,00
    status: 'pago',
    paymentMethod: 'pix',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    supplierName: 'Distribuidora Oftálmica Brasil',
  },
];

const memoryStore: Record<string, string> = {};

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      const mem = memoryStore[key];
      return mem ? JSON.parse(mem) : defaultValue;
    }
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
    const serialized = JSON.stringify(data);
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      memoryStore[key] = serialized;
      return;
    }
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.error(`Erro ao salvar dados na chave ${key}:`, e);
  }
}

export { STORAGE_KEYS };
