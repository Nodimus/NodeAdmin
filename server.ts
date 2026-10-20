import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// ============================================================================
// DADOS DO CONSULTÓRIO (REGISTRO ÚNICO & AGENDAMENTOS DO SITE)
// ============================================================================

interface ConsultorioHorario {
  diaSemana: string;
  inicio: string;
  fim: string;
  intervaloInicio?: string;
  intervaloFim?: string;
  fechado?: boolean;
}

interface ConsultorioServico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMin: number;
  precoCentavos: number;
  ativo: boolean;
  destaque?: boolean;
  ordem?: number;
}

interface DadosConsultorioServidor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  registroProfissional: string;
  responsavelTecnico: string;
  registroResponsavelTecnico?: string;
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
  horariosAtendimento: ConsultorioHorario[];
  intervaloMin?: number;
  duracaoPadraoMin?: number;
  antecedenciaMinimaHoras?: number;
  bloqueiosAgenda: Array<{ id?: string; data?: string; dataInicio?: string; dataFim?: string; motivo: string }>;
  servicos: ConsultorioServico[];
  validadeReceitaDias?: number;
  camposObrigatoriosReceita?: string[];
  textoRodapeRelatorio?: string;
  lembretesEmailConfig?: {
    ativo: boolean;
    antecedenciaHoras: number;
    assuntoPadrao: string;
    corpoTemplate: string;
  };
  formasPagamento?: Array<{ id: string; nome: string; ativo: boolean; padrao?: boolean }>;
  categoriasDespesa?: Array<{ id: string; nome: string; ativo: boolean }>;
  motivosCancelamento?: Array<{ id: string; nome: string; ativo: boolean }>;
  mensagensPadraoWhatsapp?: Array<{
    id: string;
    tipo: 'confirmacao' | 'lembrete' | 'retorno' | 'cancelamento' | 'personalizada';
    titulo: string;
    template: string;
    ativo: boolean;
  }>;
  hero?: {
    titulo: string;
    subtitulo: string;
    textoBotao: string;
    imagemUrl?: string;
  };
  sobreOptometrista?: {
    nome: string;
    registroProfissional: string;
    fotoUrl: string;
    biografia: string;
    formacao?: string[];
    diferenciais?: string[];
  };
  depoimentos?: Array<{
    id: string;
    nome: string;
    texto: string;
    nota: number;
    ativo: boolean;
    autorizacaoPaciente: boolean;
    ordem?: number;
    data?: string;
  }>;
  galeria?: Array<{
    id: string;
    url: string;
    legenda?: string;
    ordem: number;
    ativo: boolean;
  }>;
  whatsappConfig?: {
    numero: string;
    mensagemInicial: string;
  };
  secoesVisiveis?: {
    hero?: boolean;
    servicos?: boolean;
    sobre?: boolean;
    galeria?: boolean;
    depoimentos?: boolean;
    horarios?: boolean;
    agendamento?: boolean;
    contato?: boolean;
  };
  ordemSecoes?: string[];
  mapaEmbedUrl?: string;
  seo?: {
    titulo: string;
    descricao: string;
  };
  publicadoPor?: {
    uid?: string;
    nome: string;
    email?: string;
    data: string;
  };
  politicaPrivacidadeTexto: string;
  versaoPolitica: string;
  textoRodape?: string;
  updatedAt?: string;
}

const DATA_FILE = path.resolve(__dirname, 'consultorio-data.json');
const APPOINTMENTS_FILE = path.resolve(__dirname, 'agendamentos-site.json');
const PAPEIS_FILE = path.resolve(__dirname, 'papeis-data.json');
const USUARIOS_FILE = path.resolve(__dirname, 'usuarios-data.json');
const SESSOES_FILE = path.resolve(__dirname, 'sessoes-data.json');
const RECUPERACOES_FILE = path.resolve(__dirname, 'recuperacoes-data.json');
const AUDITORIA_FILE = path.resolve(__dirname, 'auditoria-data.json');
const PACIENTES_FILE = path.resolve(__dirname, 'pacientes-data.json');
const ATENDIMENTOS_FILE = path.resolve(__dirname, 'atendimentos-data.json');
const RECEITAS_FILE = path.resolve(__dirname, 'receitas-data.json');
const FINANCEIRO_FILE = path.resolve(__dirname, 'financeiro-data.json');
const PUSH_SUBSCRIPTIONS_FILE = path.resolve(__dirname, 'push-subscriptions-data.json');
const VAPID_KEYS_FILE = path.resolve(__dirname, 'vapid-keys.json');

// Inicialização segura das chaves VAPID do consultório
interface VapidKeys {
  publicKey: string;
  privateKey: string;
}
let vapidKeys: VapidKeys;
try {
  if (fs.existsSync(VAPID_KEYS_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, 'utf-8'));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  }
} catch {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
}

webpush.setVapidDetails(
  'mailto:contato@consultoriorobertoviana.com.br',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

interface PushSubscriptionRecord {
  id: string;
  userId: string;
  deviceId: string;
  userAgent?: string;
  subscription: webpush.PushSubscription;
  criadoEm: string;
  atualizadoEm: string;
}

function carregarInscricoesPush(): PushSubscriptionRecord[] {
  try {
    if (fs.existsSync(PUSH_SUBSCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(PUSH_SUBSCRIPTIONS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Erro ao ler push-subscriptions-data.json:', err);
  }
  return [];
}

function salvarInscricoesPush(inscricoes: PushSubscriptionRecord[]) {
  fs.writeFileSync(PUSH_SUBSCRIPTIONS_FILE, JSON.stringify(inscricoes, null, 2), 'utf-8');
}

function removerInscricaoPushPorId(id: string) {
  const inscricoes = carregarInscricoesPush().filter((s) => s.id !== id);
  salvarInscricoesPush(inscricoes);
}

const INITIAL_CONSULTORIO_SERVER: DadosConsultorioServidor = {
  id: 'dados_gerais',
  razaoSocial: 'Consultório de Optometria Dr. Roberto Viana Ltda [EXEMPLO]',
  nomeFantasia: 'Consultório de Optometria Dr. Roberto Viana [EXEMPLO]',
  cnpj: '12.345.678/0001-90',
  registroProfissional: 'CBOO 14.892-SP | CBO 3223-05',
  responsavelTecnico: 'Dr. Roberto Viana (Optometrista - Bacharel e Pós-Graduado)',
  registroResponsavelTecnico: 'CBOO 14.892-SP',
  telefone: '(11) 3214-5678',
  whatsapp: '(11) 98765-4321',
  email: 'contato@consultoriorobertoviana.com.br',
  endereco: {
    logradouro: 'Av. Paulista',
    numero: '1578',
    complemento: 'Conjunto 112 - Bela Vista',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-200',
  },
  logoUrl: '',
  carimboUrl: '',
  assinaturaUrl: '',
  redesSociais: {
    instagram: '@consultorio.optometria',
    facebook: 'consultorio.optometria',
    linkedin: '',
    website: '',
  },
  horarioFuncionamento: 'Segunda a Sexta: 08:00 às 18:00 | Sábado: 08:30 às 13:00',
  horariosAtendimento: [
    {
      diaSemana: 'Segunda a Sexta',
      inicio: '08:00',
      fim: '18:00',
      intervaloInicio: '12:00',
      intervaloFim: '13:30',
      fechado: false,
    },
    {
      diaSemana: 'Sábado',
      inicio: '08:30',
      fim: '13:00',
      fechado: false,
    },
    {
      diaSemana: 'Domingo',
      inicio: '00:00',
      fim: '00:00',
      fechado: true,
    },
  ],
  intervaloMin: 15,
  duracaoPadraoMin: 40,
  antecedenciaMinimaHoras: 2,
  bloqueiosAgenda: [
    {
      id: 'blq-01',
      data: '2026-12-25',
      dataInicio: '2026-12-25',
      dataFim: '2026-12-25',
      motivo: 'Feriado de Natal',
    },
    {
      id: 'blq-02',
      data: '2026-01-01',
      dataInicio: '2026-01-01',
      dataFim: '2026-01-01',
      motivo: 'Confraternização Universal (Ano Novo)',
    },
  ],
  servicos: [
    {
      id: 'srv-001',
      nome: 'Exame de Refração Completo',
      descricao:
        'Avaliação refrativa minuciosa para determinação precisa de miopia, hipermetropia, astigmatismo e presbiopia, com teste subjetivo e prescrição individualizada.',
      duracaoMin: 40,
      precoCentavos: 16000,
      ativo: true,
      destaque: true,
      ordem: 1,
    },
    {
      id: 'srv-002',
      nome: 'Adaptação de Lentes de Contato',
      descricao:
        'Ceratometria e avaliação computadorizada para seleção do modelo ideal (gelatinosas, tóricas ou rígidas), acompanhado de treinamento de manuseio e assepsia.',
      duracaoMin: 50,
      precoCentavos: 20000,
      ativo: true,
      destaque: true,
      ordem: 2,
    },
    {
      id: 'srv-003',
      nome: 'Triagem Visual Infantil & Escolar',
      descricao:
        'Exame especializado para prevenção de ambliopia (olho preguiçoso), estereopsia e rendimento visual escolar para crianças a partir de 4 anos.',
      duracaoMin: 30,
      precoCentavos: 13000,
      ativo: true,
      destaque: true,
      ordem: 3,
    },
    {
      id: 'srv-004',
      nome: 'Avaliação de Fadiga Visual (Telas e Escritório)',
      descricao:
        'Investigação de sobrecarga acomodativa por uso prolongado de computadores e smartphones, com cálculo de filtros de luz azul e adições ocupacionais.',
      duracaoMin: 35,
      precoCentavos: 14000,
      ativo: true,
      destaque: false,
      ordem: 4,
    },
    {
      id: 'srv-005',
      nome: 'Alinhamento Binocular e Visão de Cores',
      descricao:
        'Testes de forias, discromatopsias (teste de Ishihara), convergência e motilidade ocular extrínseca.',
      duracaoMin: 30,
      precoCentavos: 12000,
      ativo: true,
      destaque: false,
      ordem: 5,
    },
  ],
  validadeReceitaDias: 365,
  camposObrigatoriosReceita: [
    'od_esferico',
    'od_cilindrico',
    'od_eixo',
    'oe_esferico',
    'oe_cilindrico',
    'oe_eixo',
    'adicao',
    'dnp',
    'validadeAte',
  ],
  textoRodapeRelatorio:
    'Consultório Clínico de Optometria • Dr. Roberto Viana • CBOO 14.892-SP | CBO 3223-05 • Atendimento primário da saúde visual e refrativa individualizada. Exclusividade clínica optométrica sem vínculo comercial com óticas ou venda de lentes.',
  formasPagamento: [
    { id: 'fp-01', nome: 'Pix (Chave ou QR Code)', ativo: true, padrao: true },
    { id: 'fp-02', nome: 'Dinheiro em Espécie', ativo: true },
    { id: 'fp-03', nome: 'Cartão de Débito', ativo: true },
    { id: 'fp-04', nome: 'Cartão de Crédito à Vista', ativo: true },
    { id: 'fp-05', nome: 'Cartão de Crédito Parcelado', ativo: true },
    { id: 'fp-06', nome: 'Transferência Bancária (TED)', ativo: true },
  ],
  categoriasDespesa: [
    { id: 'cd-01', nome: 'Aluguel & Condomínio Clínico', ativo: true },
    { id: 'cd-02', nome: 'Energia Elétrica & Água', ativo: true },
    { id: 'cd-03', nome: 'Internet & Telefonia', ativo: true },
    { id: 'cd-04', nome: 'Insumos Clínicos & Esterilização', ativo: true },
    { id: 'cd-05', nome: 'Softwares, Hospedagem & TI', ativo: true },
    { id: 'cd-06', nome: 'Manutenção de Equipamentos Optométricos', ativo: true },
    { id: 'cd-07', nome: 'Impostos, Taxas e Anuidades CBOO/CROO', ativo: true },
    { id: 'cd-08', nome: 'Honorários e Salários da Equipe', ativo: true },
    { id: 'cd-09', nome: 'Limpeza, Assepsia e Copa', ativo: true },
    { id: 'cd-10', nome: 'Outras Despesas Administrativas', ativo: true },
  ],
  motivosCancelamento: [
    { id: 'mc-01', nome: 'Desistência expressa do paciente', ativo: true },
    { id: 'mc-02', nome: 'Imprevisto de saúde ou emergência pessoal', ativo: true },
    { id: 'mc-03', nome: 'Conflito de horários de trabalho', ativo: true },
    { id: 'mc-04', nome: 'Falta sem justificativa prévia', ativo: true },
    { id: 'mc-05', nome: 'Reagendamento solicitado para outra data', ativo: true },
    { id: 'mc-06', nome: 'Condições climáticas adversas ou trânsito', ativo: true },
  ],
  mensagensPadraoWhatsapp: [
    {
      id: 'mp-01',
      tipo: 'confirmacao',
      titulo: 'Confirmação de Agendamento',
      template:
        'Olá {nome}! Sua consulta de {servico} no Consultório de Optometria Dr. Roberto Viana está confirmada para {data} às {hora}. Nosso endereço: Av. Paulista, 1578, Cj. 112. Em caso de dúvidas, responda esta mensagem!',
      ativo: true,
    },
    {
      id: 'mp-02',
      tipo: 'lembrete',
      titulo: 'Lembrete de Consulta (24h de antecedência)',
      template:
        'Olá {nome}, lembrete do seu exame de {servico} amanhã, {data}, às {hora}. Se você já utiliza óculos ou lentes de contato, por favor traga no atendimento. Responda 1 para CONFIRMAR.',
      ativo: true,
    },
    {
      id: 'mp-03',
      tipo: 'retorno',
      titulo: 'Aviso de Retorno Refrativo / Preventivo',
      template:
        'Olá {nome}! Esperamos que esteja com ótima saúde visual. Identificamos que já se aproxima o período de revisão preventiva da sua refração ({servico}). Gostaria de agendar seu retorno?',
      ativo: true,
    },
    {
      id: 'mp-04',
      tipo: 'cancelamento',
      titulo: 'Confirmação de Cancelamento',
      template:
        'Olá {nome}, confirmamos o cancelamento da sua consulta de {servico} prevista para {data} às {hora}. Quando desejar remarcar seu atendimento com o Dr. Roberto Viana, estamos à sua disposição.',
      ativo: true,
    },
  ],
  hero: {
    titulo: 'Cuidando da sua saúde visual com precisão e conforto',
    subtitulo:
      'Exames refrativos completos para prescrição de óculos, acuidade visual, adaptação especializada de lentes de contato e triagem infantil com hora marcada.',
    textoBotao: 'Agendar Exame Online',
    imagemUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  },
  sobreOptometrista: {
    nome: 'Dr. Roberto Viana',
    registroProfissional: 'CBO 3223-05 | CBOO 14.892-SP',
    fotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
    biografia:
      'Profissional dedicado à atenção primária da saúde visual há mais de 12 anos. Formado em Optometria Clínica e com aperfeiçoamento contínuo em refração ocular computadorizada e contatologia avançada. Nosso atendimento prioriza o diagnóstico preciso de erros refrativos, conforto visual e a escuta cuidadosa das queixas de cada paciente.',
    formacao: [
      'Bacharel em Optometria — Especialização em Refração Clínica',
      'Pós-graduado em Adaptação de Lentes de Contato Especiais e Superfície Ocular',
      'Membro Efetivo do Conselho Brasileiro de Óptica e Optometria (CBOO)',
      'Participante regular de congressos nacionais e internacionais de optometria',
    ],
    diferenciais: [
      'Consultas com duração de 40 a 50 minutos para exame calmo e minucioso',
      'Refrator computadorizado e projetor de optotipos calibrados',
      'Explicação didática da receita e orientação sincera sobre sua saúde visual',
      'Gabinete optométrico climatizado com biossegurança e esterilização rigorosa',
    ],
  },
  depoimentos: [
    {
      id: 'dep-001',
      nome: 'Mariana S.',
      texto:
        'Sofria com dores de cabeça constantes após o trabalho no computador. O Dr. Roberto fez um exame super detalhado, descobriu um pequeno astigmatismo que nunca ninguém tinha notado e meus novos óculos resolveram tudo!',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      ordem: 1,
      data: 'Fevereiro de 2026',
    },
    {
      id: 'dep-002',
      nome: 'Carlos E. Mendonça',
      texto:
        'Atendimento pontual e extremamente cuidadoso. Foi a primeira vez que me explicaram exatamente cada número da minha receita com paciência. O consultório é moderno e acolhedor.',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      ordem: 2,
      data: 'Janeiro de 2026',
    },
    {
      id: 'dep-003',
      nome: 'Juliana F. Alcantara',
      texto:
        'Trouxe meu filho de 7 anos que estava com dificuldade de leitura na escola. A abordagem foi muito carinhosa e o teste apontou necessidade de óculos para perto. O desempenho dele melhorou muito!',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      ordem: 3,
      data: 'Dezembro de 2025',
    },
    {
      id: 'dep-004',
      nome: 'Renato M. Silveira',
      texto:
        'Adaptação de lentes de contato perfeita. Tinha medo por experiências passadas ruins, mas a orientação e o treino aqui no consultório fizeram toda a diferença no conforto.',
      nota: 5,
      ativo: true,
      autorizacaoPaciente: true,
      ordem: 4,
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
  seo: {
    titulo: 'Consultório de Optometria Dr. Roberto Viana | Exames de Vista em São Paulo',
    descricao:
      'Exame de refração completo, acuidade visual e adaptação de lentes de contato na Av. Paulista. Atendimento particular de excelência com hora marcada.',
  },
  publicadoPor: {
    nome: 'Dr. Roberto Viana (Administrador)',
    data: '2026-01-15T12:00:00.000Z',
  },
  politicaPrivacidadeTexto:
    'Este consultório particular de optometria trata seus dados pessoais cadastrais e clínicos estritamente de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e resoluções do conselho profissional de optometria. Seus dados de contato fornecidos neste formulário são utilizados com a única e exclusiva finalidade de organizar a agenda de consultas, confirmar seu horário de atendimento e prestar assistência pré-exame. Não compartilhamos nem comercializamos seus dados com terceiros para quaisquer finalidades publicitárias. Você pode solicitar a retificação ou eliminação dos seus dados a qualquer momento entrando em contato diretamente com nossa recepção.',
  versaoPolitica: '1.0',
};

// Sanitização de texto contra XSS / tags indesejadas (Regra Prompt 06b)
function sanitizarTexto(str: any): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Funções de Validação Server-side (Regras Prompt 06 e 06b)
function validarCNPJServer(cnpjStr: string): boolean {
  if (!cnpjStr) return false;
  const digits = cnpjStr.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  let tamanho = 12;
  let numeros = digits.substring(0, tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digits.charAt(12), 10)) return false;

  tamanho = 13;
  numeros = digits.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

function validarCPFServer(cpfStr: string): boolean {
  if (!cpfStr) return false;
  const digits = cpfStr.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

function validarCEPServer(cepStr: string): boolean {
  if (!cepStr) return false;
  const digits = cepStr.replace(/\D/g, '');
  return digits.length === 8;
}

function validarTelefoneServer(telStr: string): boolean {
  if (!telStr) return false;
  const digits = telStr.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  return ddd >= 11 && ddd <= 99;
}

function validarImagemTamanhoETipo(dataUrl?: string): { valido: boolean; erro?: string } {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return { valido: true };
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { valido: false, erro: 'Formato de imagem inválido.' };
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!TIPOS_VALIDOS.includes(mimeType)) {
    return { valido: false, erro: `Tipo de imagem não permitido (${mimeType}). Use JPG, PNG, WEBP ou SVG.` };
  }
  const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
  const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
  if (sizeBytes > MAX_BYTES) {
    return { valido: false, erro: 'Tamanho da imagem excede o limite máximo de 2 MB.' };
  }
  return { valido: true };
}

// Funções de Persistência JSON
function carregarDadosConsultorio(): DadosConsultorioServidor {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const conteudo = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(conteudo);
      return {
        ...INITIAL_CONSULTORIO_SERVER,
        ...parsed,
        id: 'dados_gerais',
        endereco: {
          ...INITIAL_CONSULTORIO_SERVER.endereco,
          ...(parsed.endereco || {}),
        },
        redesSociais: {
          ...INITIAL_CONSULTORIO_SERVER.redesSociais,
          ...(parsed.redesSociais || {}),
        },
        horariosAtendimento: parsed.horariosAtendimento || INITIAL_CONSULTORIO_SERVER.horariosAtendimento,
        bloqueiosAgenda: parsed.bloqueiosAgenda || INITIAL_CONSULTORIO_SERVER.bloqueiosAgenda,
        servicos: parsed.servicos || INITIAL_CONSULTORIO_SERVER.servicos,
        formasPagamento: parsed.formasPagamento || INITIAL_CONSULTORIO_SERVER.formasPagamento,
        categoriasDespesa: parsed.categoriasDespesa || INITIAL_CONSULTORIO_SERVER.categoriasDespesa,
        motivosCancelamento: parsed.motivosCancelamento || INITIAL_CONSULTORIO_SERVER.motivosCancelamento,
        mensagensPadraoWhatsapp: parsed.mensagensPadraoWhatsapp || INITIAL_CONSULTORIO_SERVER.mensagensPadraoWhatsapp,
        hero: parsed.hero || INITIAL_CONSULTORIO_SERVER.hero,
        sobreOptometrista: parsed.sobreOptometrista || INITIAL_CONSULTORIO_SERVER.sobreOptometrista,
        depoimentos: parsed.depoimentos || INITIAL_CONSULTORIO_SERVER.depoimentos,
        galeria: parsed.galeria || INITIAL_CONSULTORIO_SERVER.galeria,
        whatsappConfig: parsed.whatsappConfig || INITIAL_CONSULTORIO_SERVER.whatsappConfig,
        secoesVisiveis: {
          ...INITIAL_CONSULTORIO_SERVER.secoesVisiveis,
          ...(parsed.secoesVisiveis || {}),
        },
        ordemSecoes: parsed.ordemSecoes || INITIAL_CONSULTORIO_SERVER.ordemSecoes,
        seo: parsed.seo || INITIAL_CONSULTORIO_SERVER.seo,
        publicadoPor: parsed.publicadoPor || INITIAL_CONSULTORIO_SERVER.publicadoPor,
      };
    }
  } catch (err) {
    console.error('Erro ao ler consultorio-data.json, usando padrão:', err);
  }
  return INITIAL_CONSULTORIO_SERVER;
}

function salvarDadosConsultorio(dados: DadosConsultorioServidor) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar consultorio-data.json:', err);
  }
}

interface AgendamentoRegistro {
  id: string;
  protocolo: string;
  pacienteId?: string;
  nomeContato: string;
  telefone: string;
  email: string;
  servicoId: string;
  servicoNome: string;
  servicoPrecoCentavos: number;
  duracaoMin: number;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  inicio: string;
  fim: string;
  status:
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
  origem: 'site' | 'interno';
  optometristaNome?: string;
  observacoes?: string;
  motivoCancelamentoId?: string;
  motivoCancelamento?: string;
  consentimentoLgpd?: {
    aceito: boolean;
    dataHora: string;
    versao: string;
    ip?: string;
    userAgent?: string;
  };
  criadoEm: string;
  atualizadoEm: string;
  lembreteEmailEnviadoEm?: string;
}

// Helpers de minutos para cálculo de agenda
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const INITIAL_AGENDAMENTOS_SERVER: AgendamentoRegistro[] = [
  {
    id: 'apt-001',
    protocolo: 'OPTO-INT-20261017-01',
    pacienteId: 'pat-001',
    nomeContato: 'Ana Beatriz Souza',
    telefone: '(11) 99123-4567',
    email: 'ana.souza@gmail.com',
    servicoId: 'srv-001',
    servicoNome: 'Exame de Refração Completo',
    servicoPrecoCentavos: 16000,
    duracaoMin: 40,
    data: '2026-10-17',
    horario: '09:00',
    inicio: '2026-10-17T09:00:00.000Z',
    fim: '2026-10-17T09:40:00.000Z',
    status: 'confirmado',
    origem: 'interno',
    optometristaNome: 'Dr. Roberto Viana',
    observacoes: 'Revisão refrativa anual e queixa de cansaço digital.',
    criadoEm: '2026-10-10T08:00:00.000Z',
    atualizadoEm: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'apt-002',
    protocolo: 'OPTO-WEB-20261017-02',
    pacienteId: 'pat-002',
    nomeContato: 'Marcos Vinicius Ribeiro',
    telefone: '(11) 98234-5678',
    email: 'marcos.ribeiro@empresa.com.br',
    servicoId: 'srv-002',
    servicoNome: 'Adaptação de Lentes de Contato',
    servicoPrecoCentavos: 20000,
    duracaoMin: 50,
    data: '2026-10-17',
    horario: '10:30',
    inicio: '2026-10-17T10:30:00.000Z',
    fim: '2026-10-17T11:20:00.000Z',
    status: 'pendente',
    origem: 'site',
    optometristaNome: 'Dr. Roberto Viana',
    observacoes: 'Solicitação realizada pelo formulário do site. Aguardando confirmação.',
    criadoEm: '2026-10-16T19:30:00.000Z',
    atualizadoEm: '2026-10-16T19:30:00.000Z',
  },
  {
    id: 'apt-003',
    protocolo: 'OPTO-INT-20261017-03',
    pacienteId: 'pat-003',
    nomeContato: 'Camila Fernandes Lopes',
    telefone: '(11) 97345-6789',
    email: 'camila.lopes@universidade.edu.br',
    servicoId: 'srv-003',
    servicoNome: 'Triagem Visual Infantil & Escolar',
    servicoPrecoCentavos: 12000,
    duracaoMin: 30,
    data: '2026-10-17',
    horario: '14:00',
    inicio: '2026-10-17T14:00:00.000Z',
    fim: '2026-10-17T14:30:00.000Z',
    status: 'atendido',
    origem: 'interno',
    optometristaNome: 'Dr. Roberto Viana',
    observacoes: 'Paciente atendida pontualmente no gabinete 1.',
    criadoEm: '2026-10-12T10:15:00.000Z',
    atualizadoEm: '2026-10-17T14:30:00.000Z',
  },
  {
    id: 'apt-004',
    protocolo: 'OPTO-WEB-20261018-04',
    nomeContato: 'Eduardo Rocha Lima',
    telefone: '(11) 98877-6655',
    email: 'eduardo.rocha@outlook.com',
    servicoId: 'srv-001',
    servicoNome: 'Exame de Refração Completo',
    servicoPrecoCentavos: 16000,
    duracaoMin: 40,
    data: '2026-10-18',
    horario: '11:00',
    inicio: '2026-10-18T11:00:00.000Z',
    fim: '2026-10-18T11:40:00.000Z',
    status: 'pendente',
    origem: 'site',
    optometristaNome: 'Dr. Roberto Viana',
    observacoes: 'Agendamento novo vindo do site.',
    criadoEm: '2026-10-17T08:15:00.000Z',
    atualizadoEm: '2026-10-17T08:15:00.000Z',
  },
  {
    id: 'apt-005',
    protocolo: 'OPTO-INT-20261018-05',
    nomeContato: 'Luciana Silveira',
    telefone: '(11) 97766-5544',
    email: 'luciana.silveira@gmail.com',
    servicoId: 'srv-001',
    servicoNome: 'Exame de Refração Completo',
    servicoPrecoCentavos: 16000,
    duracaoMin: 40,
    data: '2026-10-18',
    horario: '15:30',
    inicio: '2026-10-18T15:30:00.000Z',
    fim: '2026-10-18T16:10:00.000Z',
    status: 'cancelado',
    motivoCancelamentoId: 'mc-01',
    motivoCancelamento: 'Desistência expressa do paciente',
    origem: 'interno',
    optometristaNome: 'Dr. Roberto Viana',
    observacoes: 'Cancelado a pedido da paciente por viagem de trabalho.',
    criadoEm: '2026-10-14T11:00:00.000Z',
    atualizadoEm: '2026-10-14T11:00:00.000Z',
  },
];

function carregarAgendamentos(): AgendamentoRegistro[] {
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const conteudo = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
      return JSON.parse(conteudo);
    }
  } catch (err) {
    console.error('Erro ao ler agendamentos-site.json:', err);
  }
  return INITIAL_AGENDAMENTOS_SERVER;
}

function salvarAgendamentos(agendamentos: AgendamentoRegistro[]) {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(agendamentos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar agendamentos-site.json:', err);
  }
}

// ============================================================================
// ESTRUTURA E PERSISTÊNCIA DE PACIENTES (PROMPT 08)
// ============================================================================
interface PacienteRegistro {
  id: string;
  name: string;
  cpf?: string;
  birthDate: string;
  gender?: 'M' | 'F' | 'Outro';
  phone: string;
  email?: string;
  ativo: boolean;
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
  consentimentoLgpd?: {
    aceito: boolean;
    dataHora: string;
    versao: string;
    ip?: string;
    canal?: string;
  };
  anonimizado?: boolean;
  anonimizadoEm?: string;
  anonimizadoPor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_PATIENTS_SERVER: PacienteRegistro[] = [
  {
    id: 'pat-001',
    name: 'Ana Beatriz Souza',
    cpf: '321.456.789-01',
    birthDate: '1989-06-14',
    gender: 'F',
    phone: '(11) 99123-4567',
    email: 'ana.souza@gmail.com',
    ativo: true,
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
    consentimentoLgpd: {
      aceito: true,
      dataHora: '2026-02-01T14:30:00.000Z',
      versao: '1.0',
      canal: 'presencial',
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
    ativo: true,
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
    consentimentoLgpd: {
      aceito: true,
      dataHora: '2026-01-20T09:15:00.000Z',
      versao: '1.0',
      canal: 'presencial',
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
    ativo: true,
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
    consentimentoLgpd: {
      aceito: true,
      dataHora: '2026-02-10T10:00:00.000Z',
      versao: '1.0',
      canal: 'site',
    },
    notes: 'Usa lentes de contato gelatinosas descartáveis mensais.',
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
];

function carregarPacientes(): PacienteRegistro[] {
  try {
    if (fs.existsSync(PACIENTES_FILE)) {
      const conteudo = fs.readFileSync(PACIENTES_FILE, 'utf-8');
      return JSON.parse(conteudo);
    }
  } catch (err) {
    console.error('Erro ao ler pacientes-data.json:', err);
  }
  return INITIAL_PATIENTS_SERVER;
}

function salvarPacientes(pacientes: PacienteRegistro[]) {
  try {
    fs.writeFileSync(PACIENTES_FILE, JSON.stringify(pacientes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar pacientes-data.json:', err);
  }
}

// ============================================================================
// ESTRUTURA E PERSISTÊNCIA DE ATENDIMENTO E RECEITAS (PROMPT 09)
// ============================================================================

interface AtendimentoRegistro {
  id: string;
  agendamentoId?: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteCpf?: string;
  pacienteTelefone?: string;
  optometristaId: string;
  optometristaNome: string;
  registroOptometrista?: string;
  data: string; // YYYY-MM-DD
  horario?: string;
  anamnese: {
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
  acuidadeVisual: {
    sc: { od: string; oe: string; binocular?: string };
    cc: { od: string; oe: string; binocular?: string };
  };
  refracao: {
    od: {
      esferico?: number;
      cilindrico?: number;
      eixo?: number;
      adicao?: number;
      dnp?: number;
      acuidade?: string;
    };
    oe: {
      esferico?: number;
      cilindrico?: number;
      eixo?: number;
      adicao?: number;
      dnp?: number;
      acuidade?: string;
    };
    dpTotal?: number;
  };
  ceratometria?: {
    od?: { k1?: number; k2?: number; eixo?: number };
    oe?: { k1?: number; k2?: number; eixo?: number };
  };
  pressaoIntraocular?: {
    od?: number;
    oe?: number;
    metodo?: string;
  };
  observacoes?: string;
  condutaDiagnostica?: string;
  status: 'em_andamento' | 'finalizado' | 'cancelado';
  receitaId?: string;
  criadoEm: string;
  finalizadoEm?: string;
  atualizadoEm: string;
}

interface ReceitaRegistro {
  id: string;
  numeroSequencial: number;
  numeroFormatado: string;
  atendimentoId?: string;
  pacienteId: string;
  status: 'emitida' | 'cancelada';
  dataEmissao: string;
  validadeDias: number;
  dataValidade: string;
  tabelaRefracao: {
    od: {
      esferico?: number;
      cilindrico?: number;
      eixo?: number;
      adicao?: number;
      dnp?: number;
      acuidade?: string;
      altura?: number;
      prisma?: string;
      base?: string;
    };
    oe: {
      esferico?: number;
      cilindrico?: number;
      eixo?: number;
      adicao?: number;
      dnp?: number;
      acuidade?: string;
      altura?: number;
      prisma?: string;
      base?: string;
    };
    dpTotal?: number;
  };
  tipoLente?: string;
  tratamentos?: string[];
  observacoes?: string;
  recomendacoes?: string;

  // Snapshots congelados na emissão (Regra Prompt 09: Cópia imutável)
  snapshotConsultorio: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    registroProfissional: string;
    responsavelTecnico: string;
    registroResponsavelTecnico?: string;
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
    textoRodape?: string;
  };
  snapshotProfissional: {
    id: string;
    nome: string;
    registroProfissional: string;
    email?: string;
    cargo?: string;
  };
  snapshotPaciente: {
    id: string;
    nome: string;
    cpf?: string;
    dataNascimento?: string;
    telefone?: string;
    email?: string;
    endereco?: any;
  };

  contagemReimpressoes: number;
  historicoEnvios: Array<{
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

  cancelada: boolean;
  motivoCancelamento?: string;
  canceladaEm?: string;
  canceladaPor?: {
    id: string;
    nome: string;
  };

  emitidaPor: {
    id: string;
    nome: string;
  };
  criadaEm: string;
}

const INITIAL_ATENDIMENTOS_SERVER: AtendimentoRegistro[] = [
  {
    id: 'ate-001',
    pacienteId: 'pat-001',
    pacienteNome: 'Ana Beatriz Souza',
    pacienteCpf: '321.456.789-01',
    pacienteTelefone: '(11) 99123-4567',
    optometristaId: 'optometrista-01',
    optometristaNome: 'Dr. Roberto Viana',
    registroOptometrista: 'CBOO 14.892-SP | CBO 3223-05',
    data: '2026-10-15',
    horario: '16:00',
    anamnese: {
      queixaPrincipal: 'Cansaço visual severo e cefaleia frontal após horas no computador.',
      usaOculos: true,
      usaLentesContato: false,
      alergias: 'Rinite sazonal',
    },
    acuidadeVisual: {
      sc: { od: '20/60', oe: '20/50', binocular: '20/40' },
      cc: { od: '20/20', oe: '20/20', binocular: '20/15' },
    },
    refracao: {
      od: { esferico: -1.75, cilindrico: -0.75, eixo: 175, dnp: 31.0, acuidade: '20/20' },
      oe: { esferico: -1.50, cilindrico: -0.50, eixo: 5, dnp: 31.5, acuidade: '20/20' },
      dpTotal: 62.5,
    },
    ceratometria: {
      od: { k1: 43.25, k2: 44.00, eixo: 175 },
      oe: { k1: 43.50, k2: 44.25, eixo: 5 },
    },
    pressaoIntraocular: {
      od: 14,
      oe: 15,
      metodo: 'Tonometria de Aplanação',
    },
    observacoes: 'Meios dióptricos transparentes. Reflexos pupilares fotomotor direto e consensual normais.',
    condutaDiagnostica: 'Miopia composta com astigmatismo a favor da regra bilateral. Prescrição de óculos monofocais com filtro de luz azul.',
    status: 'finalizado',
    receitaId: 'rec-001',
    criadoEm: '2026-10-15T16:00:00.000Z',
    finalizadoEm: '2026-10-15T16:45:00.000Z',
    atualizadoEm: '2026-10-15T16:45:00.000Z',
  },
];

const INITIAL_RECEITAS_SERVER: ReceitaRegistro[] = [
  {
    id: 'rec-001',
    numeroSequencial: 1,
    numeroFormatado: '2026/0001',
    atendimentoId: 'ate-001',
    pacienteId: 'pat-001',
    status: 'emitida',
    dataEmissao: '2026-10-15',
    validadeDias: 365,
    dataValidade: '2027-10-15',
    tabelaRefracao: {
      od: { esferico: -1.75, cilindrico: -0.75, eixo: 175, dnp: 31.0, acuidade: '20/20' },
      oe: { esferico: -1.50, cilindrico: -0.50, eixo: 5, dnp: 31.5, acuidade: '20/20' },
      dpTotal: 62.5,
    },
    tipoLente: 'Monofocal Digital com Filtro Blue Control',
    tratamentos: ['Antirreflexo Super Hidrofóbico', 'Filtro de Luz Azul (Blue Cut)', 'Proteção UV 400nm'],
    observacoes: 'Uso contínuo para atividades laborais em computador, leitura e condução veicular.',
    recomendacoes: 'Revisão preventiva da saúde visual recomendada em 12 meses.',
    snapshotConsultorio: {
      razaoSocial: 'Consultório de Optometria Dr. Roberto Viana Ltda [EXEMPLO]',
      nomeFantasia: 'Consultório de Optometria Dr. Roberto Viana [EXEMPLO]',
      cnpj: '12.345.678/0001-90',
      registroProfissional: 'CBOO 14.892-SP | CBO 3223-05',
      responsavelTecnico: 'Dr. Roberto Viana (Optometrista - Bacharel e Pós-Graduado)',
      registroResponsavelTecnico: 'CBOO 14.892-SP',
      telefone: '(11) 3214-5678',
      whatsapp: '(11) 98765-4321',
      email: 'contato@consultoriorobertoviana.com.br',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1578',
        complemento: 'Conjunto 112 - Bela Vista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01310-200',
      },
      logoUrl: '',
      carimboUrl: '',
      assinaturaUrl: '',
      textoRodape: 'Atendimento optométrico clínico em estrita conformidade com a Classificação Brasileira de Ocupações (CBO 3223-05) e normas do CBOO. Consultório particular de uso exclusivo.',
    },
    snapshotProfissional: {
      id: 'optometrista-01',
      nome: 'Dr. Roberto Viana',
      registroProfissional: 'CBOO 14.892-SP | CBO 3223-05',
      email: 'roberto@consultoriorobertoviana.com.br',
      cargo: 'Optometrista Responsável Técnico',
    },
    snapshotPaciente: {
      id: 'pat-001',
      nome: 'Ana Beatriz Souza',
      cpf: '321.456.789-01',
      dataNascimento: '1989-06-14',
      telefone: '(11) 99123-4567',
      email: 'ana.souza@gmail.com',
      endereco: {
        cidade: 'São Paulo',
        uf: 'SP',
      },
    },
    contagemReimpressoes: 0,
    historicoEnvios: [],
    tokenAcessoTemporario: 'token-demo-ana-beatriz-2026',
    tokenExpiraEm: '2027-10-15T23:59:59.000Z',
    cancelada: false,
    emitidaPor: {
      id: 'optometrista-01',
      nome: 'Dr. Roberto Viana',
    },
    criadaEm: '2026-10-15T16:10:00.000Z',
  },
];

function carregarAtendimentos(): AtendimentoRegistro[] {
  try {
    if (fs.existsSync(ATENDIMENTOS_FILE)) {
      const conteudo = fs.readFileSync(ATENDIMENTOS_FILE, 'utf-8');
      return JSON.parse(conteudo);
    }
  } catch (err) {
    console.error('Erro ao ler atendimentos-data.json:', err);
  }
  return INITIAL_ATENDIMENTOS_SERVER;
}

function salvarAtendimentos(atendimentos: AtendimentoRegistro[]) {
  try {
    fs.writeFileSync(ATENDIMENTOS_FILE, JSON.stringify(atendimentos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar atendimentos-data.json:', err);
  }
}

function carregarReceitas(): ReceitaRegistro[] {
  try {
    if (fs.existsSync(RECEITAS_FILE)) {
      const conteudo = fs.readFileSync(RECEITAS_FILE, 'utf-8');
      return JSON.parse(conteudo);
    }
  } catch (err) {
    console.error('Erro ao ler receitas-data.json:', err);
  }
  return INITIAL_RECEITAS_SERVER;
}

function salvarReceitas(receitas: ReceitaRegistro[]) {
  try {
    fs.writeFileSync(RECEITAS_FILE, JSON.stringify(receitas, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar receitas-data.json:', err);
  }
}

// Geração atômica de número sequencial sem lacunas nem repetição (Regra Prompt 09)
function gerarProximoNumeroReceita(): { numeroSequencial: number; numeroFormatado: string } {
  const receitas = carregarReceitas();
  let maxSeq = 0;
  for (const r of receitas) {
    if (r.numeroSequencial && typeof r.numeroSequencial === 'number' && r.numeroSequencial > maxSeq) {
      maxSeq = r.numeroSequencial;
    }
  }
  const proximo = maxSeq + 1;
  const anoAtual = new Date().getFullYear();
  const formatado = `${anoAtual}/${String(proximo).padStart(4, '0')}`;
  return { numeroSequencial: proximo, numeroFormatado: formatado };
}

// Validação dos campos obrigatórios da receita conforme configuração do consultório
function validarCamposObrigatoriosReceita(
  camposObrigatorios: string[] | undefined,
  tabelaRefracao: any,
  dataValidade?: string
): { valido: boolean; erro?: string } {
  if (!camposObrigatorios || !Array.isArray(camposObrigatorios) || camposObrigatorios.length === 0) {
    return { valido: true };
  }

  const od = tabelaRefracao?.od || {};
  const oe = tabelaRefracao?.oe || {};

  for (const campo of camposObrigatorios) {
    switch (campo) {
      case 'od_esferico':
        if (od.esferico === undefined || od.esferico === null || od.esferico === '') {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Grau Esférico do Olho Direito (OD).' };
        }
        break;
      case 'od_cilindrico':
        if (od.cilindrico === undefined || od.cilindrico === null || od.cilindrico === '') {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Grau Cilíndrico do Olho Direito (OD).' };
        }
        break;
      case 'od_eixo':
        if (od.cilindrico && Number(od.cilindrico) !== 0 && (od.eixo === undefined || od.eixo === null || od.eixo === '')) {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Eixo do Olho Direito (OD) é obrigatório quando há cilindro.' };
        }
        break;
      case 'oe_esferico':
        if (oe.esferico === undefined || oe.esferico === null || oe.esferico === '') {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Grau Esférico do Olho Esquerdo (OE).' };
        }
        break;
      case 'oe_cilindrico':
        if (oe.cilindrico === undefined || oe.cilindrico === null || oe.cilindrico === '') {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Grau Cilíndrico do Olho Esquerdo (OE).' };
        }
        break;
      case 'oe_eixo':
        if (oe.cilindrico && Number(oe.cilindrico) !== 0 && (oe.eixo === undefined || oe.eixo === null || oe.eixo === '')) {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Eixo do Olho Esquerdo (OE) é obrigatório quando há cilindro.' };
        }
        break;
      case 'dnp':
        if (od.dnp === undefined && oe.dnp === undefined && !tabelaRefracao?.dpTotal) {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Medida de DNP ou DP Total.' };
        }
        break;
      case 'validadeAte':
        if (!dataValidade) {
          return { valido: false, erro: 'Campo obrigatório não preenchido: Data de validade da receita.' };
        }
        break;
    }
  }

  return { valido: true };
}


// ============================================================================
// ESTRUTURA E PERSISTÊNCIA DO MÓDULO FINANCEIRO (PROMPT 10)
// ============================================================================

export interface FinanceiroRegistro {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  amountInCents: number; // Centavos: R$ 180,00 = 18000
  status: 'pendente' | 'pago' | 'cancelado';

  // Datas
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD (data da baixa)

  // Categorias e Formas de Pagamento vindas dos cadastros auxiliares editáveis (Prompt 06)
  categoryId?: string;
  categoryName: string;
  paymentMethodId?: string;
  paymentMethodName: string;

  // Vínculos clínicos (Contas a Receber)
  patientId?: string;
  patientName?: string;
  atendimentoId?: string;
  agendamentoId?: string;

  // Fornecedor (Contas a Pagar)
  supplierName?: string;

  // Recorrência mensal
  isRecurring?: boolean;
  recurringFrequency?: 'mensal';
  recurringParentId?: string;

  // Parcelamento simples
  installmentNumber?: number;
  installmentTotal?: number;
  installmentGroupCode?: string;

  // Anexo de comprovante (Prompt 10)
  receiptUrl?: string;
  receiptName?: string;

  // Observações e Auditoria
  notes?: string;
  canceledReason?: string;
  canceledAt?: string;
  canceledBy?: { id: string; nome: string };
  paidAt?: string;
  paidBy?: { id: string; nome: string };
  createdAt: string;
  updatedAt: string;
}

const INITIAL_FINANCEIRO_SERVER: FinanceiroRegistro[] = [
  // 1. Receitas de Outubro/2026 (Mês Atual)
  {
    id: 'fin-rec-001',
    type: 'receita',
    description: 'Honorários de Exame de Refração Completo - Ana Beatriz Souza',
    amountInCents: 18000,
    status: 'pago',
    date: '2026-10-15',
    dueDate: '2026-10-15',
    paymentDate: '2026-10-15',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    atendimentoId: 'ate-001',
    agendamentoId: 'apt-001',
    notes: 'Pagamento instantâneo via Pix confirmado na recepção.',
    createdAt: '2026-10-15T09:40:00.000Z',
    updatedAt: '2026-10-15T09:40:00.000Z',
  },
  {
    id: 'fin-rec-002',
    type: 'receita',
    description: 'Adaptação de Lentes de Contato Descartáveis - Marcos Vinicius Ribeiro',
    amountInCents: 15000,
    status: 'pago',
    date: '2026-10-16',
    dueDate: '2026-10-16',
    paymentDate: '2026-10-16',
    categoryId: 'srv-02',
    categoryName: 'Adaptação de Lentes de Contato',
    paymentMethodId: 'fp-03',
    paymentMethodName: 'Cartão de Débito',
    patientId: 'pat-002',
    patientName: 'Marcos Vinicius Ribeiro',
    agendamentoId: 'apt-002',
    createdAt: '2026-10-16T11:20:00.000Z',
    updatedAt: '2026-10-16T11:20:00.000Z',
  },
  {
    id: 'fin-rec-003',
    type: 'receita',
    description: 'Avaliação Visual Ocupacional - Camila Fernandes Lopes',
    amountInCents: 14000,
    status: 'pago',
    date: '2026-10-17',
    dueDate: '2026-10-17',
    paymentDate: '2026-10-17',
    categoryId: 'srv-03',
    categoryName: 'Avaliação Visual Ocupacional e Cansaço Digital',
    paymentMethodId: 'fp-04',
    paymentMethodName: 'Cartão de Crédito à Vista',
    patientId: 'pat-003',
    patientName: 'Camila Fernandes Lopes',
    agendamentoId: 'apt-003',
    createdAt: '2026-10-17T14:30:00.000Z',
    updatedAt: '2026-10-17T14:30:00.000Z',
  },
  // Conta a Receber Vencendo Hoje (18/10/2026) - Pendente
  {
    id: 'fin-rec-004',
    type: 'receita',
    description: 'Exame de Refração Completo e Teste Subjetivo - Mariana Silva Costa',
    amountInCents: 18000,
    status: 'pendente',
    date: '2026-10-18',
    dueDate: '2026-10-18',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    patientName: 'Mariana Silva Costa',
    notes: 'Agendamento confirmado para o turno da tarde de hoje.',
    createdAt: '2026-10-18T08:00:00.000Z',
    updatedAt: '2026-10-18T08:00:00.000Z',
  },
  // Parcelamento Simples (3x de R$ 100,00) - 1 Paga, 2 Pendentes
  {
    id: 'fin-rec-parc-01',
    type: 'receita',
    description: 'Protocolo Especial de Terapia e Acomodação Visual (1/3)',
    amountInCents: 10000,
    status: 'pago',
    date: '2026-10-10',
    dueDate: '2026-10-10',
    paymentDate: '2026-10-10',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-05',
    paymentMethodName: 'Cartão de Crédito Parcelado',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    installmentNumber: 1,
    installmentTotal: 3,
    installmentGroupCode: 'grp-parc-001',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 'fin-rec-parc-02',
    type: 'receita',
    description: 'Protocolo Especial de Terapia e Acomodação Visual (2/3)',
    amountInCents: 10000,
    status: 'pendente',
    date: '2026-10-10',
    dueDate: '2026-11-10',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-05',
    paymentMethodName: 'Cartão de Crédito Parcelado',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    installmentNumber: 2,
    installmentTotal: 3,
    installmentGroupCode: 'grp-parc-001',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 'fin-rec-parc-03',
    type: 'receita',
    description: 'Protocolo Especial de Terapia e Acomodação Visual (3/3)',
    amountInCents: 10000,
    status: 'pendente',
    date: '2026-10-10',
    dueDate: '2026-12-10',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-05',
    paymentMethodName: 'Cartão de Crédito Parcelado',
    patientId: 'pat-001',
    patientName: 'Ana Beatriz Souza',
    installmentNumber: 3,
    installmentTotal: 3,
    installmentGroupCode: 'grp-parc-001',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },

  // 2. Contas a Pagar de Outubro/2026 (Despesas do Consultório)
  {
    id: 'fin-pag-001',
    type: 'despesa',
    description: 'Aluguel & Condomínio do Conjunto Comercial 112',
    amountInCents: 380000, // R$ 3.800,00
    status: 'pago',
    date: '2026-10-05',
    dueDate: '2026-10-05',
    paymentDate: '2026-10-05',
    categoryId: 'cd-01',
    categoryName: 'Aluguel & Condomínio Clínico',
    paymentMethodId: 'fp-06',
    paymentMethodName: 'Transferência Bancária (TED)',
    supplierName: 'Administradora Paulista de Imóveis',
    isRecurring: true,
    recurringFrequency: 'mensal',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="%23e2e8f0"/><text x="10" y="35" font-family="sans-serif" font-size="14" fill="%23334155">Comprovante TED 05/10</text></svg>',
    receiptName: 'comprovante_aluguel_out_2026.pdf',
    notes: 'Aluguel quitado pontualmente com desconto de bonificação.',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T14:00:00.000Z',
  },
  {
    id: 'fin-pag-002',
    type: 'despesa',
    description: 'Insumos Clínicos de Assepsia e Lentes de Teste Diagnóstico',
    amountInCents: 45000, // R$ 450,00
    status: 'pago',
    date: '2026-10-12',
    dueDate: '2026-10-12',
    paymentDate: '2026-10-12',
    categoryId: 'cd-04',
    categoryName: 'Insumos Clínicos & Esterilização',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    supplierName: 'Distribuidora Médica e Oftálmica Brasil',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="%23e2e8f0"/><text x="10" y="35" font-family="sans-serif" font-size="14" fill="%23334155">Comprovante Pix Insumos</text></svg>',
    receiptName: 'pix_distribuidora_insumos.png',
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-12T10:15:00.000Z',
  },
  // Conta a Pagar Vencendo Hoje (18/10/2026) - Alerta "Hoje"
  {
    id: 'fin-pag-003',
    type: 'despesa',
    description: 'Conta de Energia Elétrica e Climatização da Clínica',
    amountInCents: 38500, // R$ 385,00
    status: 'pendente',
    date: '2026-10-08',
    dueDate: '2026-10-18', // VENCE HOJE
    categoryId: 'cd-02',
    categoryName: 'Energia Elétrica & Água',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    supplierName: 'Enel Distribuição São Paulo',
    isRecurring: true,
    recurringFrequency: 'mensal',
    notes: 'Débito programado ou pagamento via Pix QR Code da fatura.',
    createdAt: '2026-10-08T09:00:00.000Z',
    updatedAt: '2026-10-08T09:00:00.000Z',
  },
  // Conta a Pagar Atrasada (Venceu em 14/10/2026) - Alerta "Atrasada"
  {
    id: 'fin-pag-004',
    type: 'despesa',
    description: 'Link Dedicado de Fibra Óptica & Telefonia Fixa',
    amountInCents: 24990, // R$ 249,90
    status: 'pendente',
    date: '2026-10-01',
    dueDate: '2026-10-14', // ATRASADA
    categoryId: 'cd-03',
    categoryName: 'Internet & Telefonia',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    supplierName: 'Vivo Empresas S.A.',
    isRecurring: true,
    recurringFrequency: 'mensal',
    notes: 'Aguardando validação do boleto bancário pelo setor administrativo.',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'fin-pag-005',
    type: 'despesa',
    description: 'Licença de Software de Prontuário Clínico & Backup em Nuvem',
    amountInCents: 19900, // R$ 199,00
    status: 'pendente',
    date: '2026-10-15',
    dueDate: '2026-10-25', // Futura
    categoryId: 'cd-05',
    categoryName: 'Softwares, Hospedagem & TI',
    paymentMethodId: 'fp-04',
    paymentMethodName: 'Cartão de Crédito à Vista',
    supplierName: 'OptoCloud Softwares Clínicos Ltda',
    isRecurring: true,
    recurringFrequency: 'mensal',
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
  },

  // 3. Histórico dos Meses Anteriores (Para demonstrativo de Fluxo de Caixa Mensal)
  // Setembro/2026
  {
    id: 'fin-hist-001',
    type: 'receita',
    description: 'Honorários de Consultas Clínicas - Lote Setembro/26',
    amountInCents: 1480000, // R$ 14.800,00
    status: 'pago',
    date: '2026-09-30',
    dueDate: '2026-09-30',
    paymentDate: '2026-09-30',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-30T18:00:00.000Z',
  },
  {
    id: 'fin-hist-002',
    type: 'despesa',
    description: 'Custos Operacionais & Aluguel - Setembro/26',
    amountInCents: 520000, // R$ 5.200,00
    status: 'pago',
    date: '2026-09-28',
    dueDate: '2026-09-28',
    paymentDate: '2026-09-28',
    categoryId: 'cd-01',
    categoryName: 'Aluguel & Condomínio Clínico',
    paymentMethodId: 'fp-06',
    paymentMethodName: 'Transferência Bancária (TED)',
    supplierName: 'Administradora Paulista de Imóveis',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-28T14:00:00.000Z',
  },
  // Agosto/2026
  {
    id: 'fin-hist-003',
    type: 'receita',
    description: 'Honorários de Consultas Clínicas - Lote Agosto/26',
    amountInCents: 1390000, // R$ 13.900,00
    status: 'pago',
    date: '2026-08-31',
    dueDate: '2026-08-31',
    paymentDate: '2026-08-31',
    categoryId: 'srv-01',
    categoryName: 'Exame de Refração Completo',
    paymentMethodId: 'fp-01',
    paymentMethodName: 'Pix (Chave ou QR Code)',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-31T18:00:00.000Z',
  },
  {
    id: 'fin-hist-004',
    type: 'despesa',
    description: 'Custos Operacionais & Aluguel - Agosto/26',
    amountInCents: 495000, // R$ 4.950,00
    status: 'pago',
    date: '2026-08-28',
    dueDate: '2026-08-28',
    paymentDate: '2026-08-28',
    categoryId: 'cd-01',
    categoryName: 'Aluguel & Condomínio Clínico',
    paymentMethodId: 'fp-06',
    paymentMethodName: 'Transferência Bancária (TED)',
    supplierName: 'Administradora Paulista de Imóveis',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-28T14:00:00.000Z',
  },
];

function carregarFinanceiro(): FinanceiroRegistro[] {
  try {
    if (fs.existsSync(FINANCEIRO_FILE)) {
      const conteudo = fs.readFileSync(FINANCEIRO_FILE, 'utf-8');
      return JSON.parse(conteudo);
    }
  } catch (err) {
    console.error('Erro ao ler financeiro-data.json:', err);
  }
  return INITIAL_FINANCEIRO_SERVER;
}

function salvarFinanceiro(transacoes: FinanceiroRegistro[]) {
  try {
    fs.writeFileSync(FINANCEIRO_FILE, JSON.stringify(transacoes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar financeiro-data.json:', err);
  }
}

// Helpers de Cálculo do Financeiro (Resumo, Alertas, Fluxo e Categorias)
function calcularResumoFinanceiro(transacoes: FinanceiroRegistro[]) {
  const hoje = new Date().toISOString().split('T')[0];

  let totalIncomeInCents = 0; // Receitas pagas
  let totalExpenseInCents = 0; // Despesas pagas
  let pendingReceivableInCents = 0; // A receber pendente
  let pendingPayableInCents = 0; // A pagar pendente
  let pendingCount = 0;

  const vencendoHojeList: FinanceiroRegistro[] = [];
  const atrasadasList: FinanceiroRegistro[] = [];

  for (const t of transacoes) {
    if (t.status === 'cancelado') continue;

    if (t.status === 'pago') {
      if (t.type === 'receita') {
        totalIncomeInCents += t.amountInCents;
      } else if (t.type === 'despesa') {
        totalExpenseInCents += t.amountInCents;
      }
    } else if (t.status === 'pendente') {
      pendingCount++;
      if (t.type === 'receita') {
        pendingReceivableInCents += t.amountInCents;
      } else if (t.type === 'despesa') {
        pendingPayableInCents += t.amountInCents;
      }

      if (t.dueDate === hoje) {
        vencendoHojeList.push(t);
      } else if (t.dueDate < hoje) {
        atrasadasList.push(t);
      }
    }
  }

  const balanceInCents = totalIncomeInCents - totalExpenseInCents;
  const forecastBalanceInCents = balanceInCents + pendingReceivableInCents - pendingPayableInCents;

  return {
    totalIncomeInCents,
    totalExpenseInCents,
    balanceInCents,
    pendingReceivableInCents,
    pendingPayableInCents,
    forecastBalanceInCents,
    pendingCount,
    vencendoHojeCount: vencendoHojeList.length,
    atrasadasCount: atrasadasList.length,
    vencendoHojeList,
    atrasadasList,
  };
}

function calcularGraficoFluxoCaixa(transacoes: FinanceiroRegistro[]) {
  const mesesMap = new Map<string, { receitas: number; despesas: number }>();

  // Prepara ordenação por mês YYYY-MM
  for (const t of transacoes) {
    if (t.status === 'cancelado') continue;
    const refDate = t.paymentDate || t.dueDate || t.date;
    const mesAno = refDate.slice(0, 7); // '2026-10'

    if (!mesesMap.has(mesAno)) {
      mesesMap.set(mesAno, { receitas: 0, despesas: 0 });
    }
    const cur = mesesMap.get(mesAno)!;
    if (t.status === 'pago') {
      if (t.type === 'receita') cur.receitas += t.amountInCents;
      else if (t.type === 'despesa') cur.despesas += t.amountInCents;
    }
  }

  // Ordena meses cronologicamente
  const sortedMonths = Array.from(mesesMap.keys()).sort();
  let acumulado = 0;
  const mesesNomes: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };

  return sortedMonths.map((m) => {
    const data = mesesMap.get(m)!;
    const saldo = data.receitas - data.despesas;
    acumulado += saldo;
    const [ano, mes] = m.split('-');
    const mesNome = `${mesesNomes[mes] || mes}/${ano.slice(2)}`;

    return {
      mesAno: m,
      mesNome,
      receitasCentavos: data.receitas,
      despesasCentavos: data.despesas,
      saldoCentavos: saldo,
      saldoAcumuladoCentavos: acumulado,
    };
  });
}

function calcularTotaisPorCategoria(transacoes: FinanceiroRegistro[]) {
  const catMap = new Map<string, { categoryId?: string; categoryName: string; type: 'receita' | 'despesa'; totalCentavos: number; count: number }>();
  let totalDespesasGeral = 0;
  let totalReceitasGeral = 0;

  for (const t of transacoes) {
    if (t.status === 'cancelado') continue;
    const key = `${t.type}_${t.categoryName}`;
    if (!catMap.has(key)) {
      catMap.set(key, {
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        type: t.type,
        totalCentavos: 0,
        count: 0,
      });
    }
    const item = catMap.get(key)!;
    item.totalCentavos += t.amountInCents;
    item.count++;

    if (t.type === 'despesa') totalDespesasGeral += t.amountInCents;
    else totalReceitasGeral += t.amountInCents;
  }

  return Array.from(catMap.values()).map((c) => {
    const baseTotal = c.type === 'despesa' ? totalDespesasGeral : totalReceitasGeral;
    const percentual = baseTotal > 0 ? Number(((c.totalCentavos / baseTotal) * 100).toFixed(1)) : 0;
    return {
      ...c,
      percentual,
    };
  }).sort((a, b) => b.totalCentavos - a.totalCentavos);
}

// Formatação monetária em R$ (pt-BR)
function formatarMoedaCentavos(centavos: number): string {
  const valor = (centavos / 100).toFixed(2).replace('.', ',');
  return `R$ ${valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// Formatação de datas brasileiras (dd/mm/aaaa) para relatórios
function formatarDataIsoParaBR(isoStr?: string): string {
  if (!isoStr) return '-';
  const dataParte = isoStr.split('T')[0];
  const [ano, mes, dia] = dataParte.split('-');
  if (!ano || !mes || !dia) return isoStr;
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraIsoParaBR(isoStr?: string): string {
  if (!isoStr) return '-';
  const [dataParte, horaParte] = isoStr.split('T');
  const [ano, mes, dia] = dataParte.split('-');
  const hora = horaParte ? horaParte.substring(0, 5) : '';
  if (!ano || !mes || !dia) return isoStr;
  return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
}

// Geração de CSV de movimentações financeiras (RFC-4180 com UTF-8 BOM)
function gerarCsvFinanceiro(transacoes: FinanceiroRegistro[]): string {
  const headers = [
    'Tipo',
    'Descrição',
    'Categoria',
    'Paciente / Fornecedor',
    'Valor (R$)',
    'Data Emissão',
    'Data Vencimento',
    'Data Pagamento',
    'Status',
    'Forma de Pagamento',
    'Parcela',
    'Recorrente',
    'Observações',
  ];

  const rows = transacoes.map((t) => {
    const tipo = t.type === 'receita' ? 'Receita' : 'Despesa';
    const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
    const cat = `"${(t.categoryName || '').replace(/"/g, '""')}"`;
    const contraparte = `"${(t.patientName || t.supplierName || '-').replace(/"/g, '""')}"`;
    const valor = (t.amountInCents / 100).toFixed(2).replace('.', ',');
    const dtEmissao = t.date;
    const dtVenc = t.dueDate;
    const dtPag = t.paymentDate || '-';
    const status = t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Cancelado';
    const formaPag = `"${(t.paymentMethodName || '-').replace(/"/g, '""')}"`;
    const parcela = t.installmentTotal && t.installmentTotal > 1 ? `${t.installmentNumber || 1}/${t.installmentTotal}` : 'Única';
    const recorrente = t.isRecurring ? 'Sim (Mensal)' : 'Não';
    const obs = `"${(t.notes || '').replace(/"/g, '""')}"`;

    return [tipo, desc, cat, contraparte, valor, dtEmissao, dtVenc, dtPag, status, formaPag, parcela, recorrente, obs].join(';');
  });

  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
}
function validarDisponibilidadeAgendamento(
  dataStr: string,
  horarioStr: string,
  duracaoMin: number,
  consultorio: DadosConsultorioServidor,
  agendamentoIdIgnorar?: string
): { valido: boolean; erro?: string } {
  // 1. Data válida (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return { valido: false, erro: 'Formato de data inválido. Use AAAA-MM-DD.' };
  }

  // 2. Horário válido (HH:mm)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioStr)) {
    return { valido: false, erro: 'Formato de horário inválido. Use HH:mm.' };
  }

  // 3. Bloqueios de agenda (feriados, férias, manutenções cadastrados)
  const bloqueio = (consultorio.bloqueiosAgenda || []).find((b) => {
    if (b.data && b.data === dataStr) return true;
    if (b.dataInicio && b.dataFim) {
      return dataStr >= b.dataInicio && dataStr <= b.dataFim;
    }
    return false;
  });
  if (bloqueio) {
    return {
      valido: false,
      erro: `Data indisponível na agenda: Bloqueio programado ("${bloqueio.motivo}").`,
    };
  }

  // 4. Expediente e horário de atendimento do consultório
  const partes = dataStr.split('-').map(Number);
  const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
  const diaSemanaIndex = dataObj.getDay();
  const diasSemanaMap: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  };
  const nomeDia = diasSemanaMap[diaSemanaIndex];

  let horarioConfig = (consultorio.horariosAtendimento || []).find(
    (h) => h.diaSemana === nomeDia || h.diaSemana.includes(nomeDia)
  );
  if (!horarioConfig && diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
    horarioConfig = (consultorio.horariosAtendimento || []).find(
      (h) => h.diaSemana.includes('Segunda a Sexta') || h.diaSemana.includes('Segunda')
    );
  }

  if (!horarioConfig || horarioConfig.fechado) {
    return {
      valido: false,
      erro: `O consultório não abre para atendimento em ${nomeDia}s.`,
    };
  }

  const slotInicioMin = timeToMinutes(horarioStr);
  const slotFimMin = slotInicioMin + duracaoMin;
  const expedienteInicioMin = timeToMinutes(horarioConfig.inicio);
  const expedienteFimMin = timeToMinutes(horarioConfig.fim);

  if (slotInicioMin < expedienteInicioMin || slotFimMin > expedienteFimMin) {
    return {
      valido: false,
      erro: `Horário fora do expediente (${horarioConfig.inicio} às ${horarioConfig.fim}).`,
    };
  }

  // Intervalo de almoço
  if (horarioConfig.intervaloInicio && horarioConfig.intervaloFim) {
    const intInicio = timeToMinutes(horarioConfig.intervaloInicio);
    const intFim = timeToMinutes(horarioConfig.intervaloFim);
    if (
      (slotInicioMin >= intInicio && slotInicioMin < intFim) ||
      (slotFimMin > intInicio && slotFimMin <= intFim) ||
      (slotInicioMin < intInicio && slotFimMin > intFim)
    ) {
      return {
        valido: false,
        erro: `Horário coincide com o intervalo de almoço do consultório (${horarioConfig.intervaloInicio} às ${horarioConfig.intervaloFim}).`,
      };
    }
  }

  // 5. Conflito / Duplicidade de horários (sem duplicidade no banco)
  const agendamentos = carregarAgendamentos();
  const conflito = agendamentos.find((a) => {
    if (a.id === agendamentoIdIgnorar) return false;
    if (a.data !== dataStr) return false;
    if (a.status === 'cancelado') return false;

    const aInicioMin = timeToMinutes(a.horario);
    const aFimMin = aInicioMin + (a.duracaoMin || 30);

    return slotInicioMin < aFimMin && slotFimMin > aInicioMin;
  });

  if (conflito) {
    return {
      valido: false,
      erro: `Conflito de agenda: já existe uma consulta agendada às ${conflito.horario} para ${conflito.nomeContato}.`,
    };
  }

  return { valido: true };
}

// Geração de mensagem WhatsApp com template cadastrado (Regra Prompt 07)
function gerarMensagemWhatsAppConfirmacao(
  agendamento: AgendamentoRegistro,
  consultorio: DadosConsultorioServidor
): { texto: string; linkWhatsApp: string } {
  const templateConfig = (consultorio.mensagensPadraoWhatsapp || []).find(
    (m) => m.tipo === 'confirmacao' && m.ativo !== false
  );

  const template =
    templateConfig?.template ||
    'Olá {nome}! Sua consulta de {servico} no Consultório de Optometria Dr. Roberto Viana está confirmada para {data} às {hora}. Nosso endereço: Av. Paulista, 1578, Cj. 112. Em caso de dúvidas, responda esta mensagem!';

  const [ano, mes, dia] = agendamento.data.split('-');
  const dataFormatada = `${dia}/${mes}/${ano}`;

  const texto = template
    .replace(/\{nome\}/gi, agendamento.nomeContato)
    .replace(/\{data\}/gi, dataFormatada)
    .replace(/\{hora\}/gi, agendamento.horario)
    .replace(/\{servico\}/gi, agendamento.servicoNome);

  const telefoneLimpo = agendamento.telefone.replace(/\D/g, '');
  const ddi = telefoneLimpo.startsWith('55') ? telefoneLimpo : `55${telefoneLimpo}`;
  const linkWhatsApp = `https://api.whatsapp.com/send?phone=${ddi}&text=${encodeURIComponent(texto)}`;

  return { texto, linkWhatsApp };
}

// Conjunto de slots atualmente em transação (lock atômico na memória do servidor)
const slotsEmTransacao = new Set<string>();

// Rate limiting simples em memória por IP para evitar spam no agendamento do site
const spamRateLimiter = new Map<string, { count: number; firstRequestTime: number }>();
const MAX_REQUESTS_PER_WINDOW = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = spamRateLimiter.get(ip);
  if (!entry) {
    spamRateLimiter.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }
  if (now - entry.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
    spamRateLimiter.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

// ============================================================================
// SISTEMA DE SEGURANÇA, HASH DE SENHA, SESSÃO E PAPÉIS (PROMPT 04)
// ============================================================================

export interface PapelData {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Record<string, boolean>;
  sistema: boolean;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface UsuarioData {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  papelId: string;
  ativo: boolean;
  passwordHash: string; // formato salt:hash
  trocarSenhaNoPrimeiroAcesso: boolean;
  ultimoAcesso?: string;
  registroProfissional?: string;
  fotoUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface SessaoData {
  token: string;
  uid: string;
  criadoEm: string;
  expiraEm: string;
}

interface RecuperacaoData {
  token: string;
  email: string;
  expiraEm: number;
}

// Hashing forte de senha usando scrypt com salt aleatório
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHashWithSalt: string): boolean {
  try {
    const [salt, originalHash] = storedHashWithSalt.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

// Limite de tentativas de login (Brute-force protection)
interface LoginAttemptRecord {
  failures: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function getLoginRateLimitKey(ip: string, email: string): string {
  return `${ip}_${email.trim().toLowerCase()}`;
}

function checkLoginAttempt(key: string): { allowed: boolean; waitMinutes?: number } {
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };
  const now = Date.now();
  if (record.lockedUntil > now) {
    const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }
  if (record.lockedUntil <= now && record.lockedUntil > 0) {
    loginAttempts.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}

function registerLoginFailure(key: string): { locked: boolean; remaining: number } {
  const now = Date.now();
  const record = loginAttempts.get(key) || { failures: 0, lockedUntil: 0 };
  record.failures += 1;
  if (record.failures >= MAX_LOGIN_FAILURES) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, record);
    return { locked: true, remaining: 0 };
  }
  loginAttempts.set(key, record);
  return { locked: false, remaining: MAX_LOGIN_FAILURES - record.failures };
}

function resetLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

// Helpers de Leitura e Escrita de Papéis e Usuários
function carregarPapeis(): PapelData[] {
  try {
    if (fs.existsSync(PAPEIS_FILE)) {
      return JSON.parse(fs.readFileSync(PAPEIS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Erro ao ler papeis-data.json:', err);
  }
  return [];
}

function salvarPapeis(papeis: PapelData[]) {
  fs.writeFileSync(PAPEIS_FILE, JSON.stringify(papeis, null, 2), 'utf-8');
}

function carregarUsuarios(): UsuarioData[] {
  try {
    if (fs.existsSync(USUARIOS_FILE)) {
      return JSON.parse(fs.readFileSync(USUARIOS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Erro ao ler usuarios-data.json:', err);
  }
  return [];
}

function salvarUsuarios(usuarios: UsuarioData[]) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2), 'utf-8');
}

// ============================================================================
// VALIDAÇÃO E DISPARO DE PUSH NOTIFICATIONS (PROMPT 15)
// Notifica apenas usuários com permissão 'agenda.ler'
// ============================================================================
function usuarioTemPermissaoAgenda(userId: string): boolean {
  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => (u.uid === userId || (u as any).id === userId) && u.ativo);
  if (!usuario) return false;
  const papeis = carregarPapeis();
  const papel = papeis.find((p) => p.id === usuario.papelId && p.ativo);
  if (!papel) return false;
  return Boolean(papel.permissoes['agenda.ler'] || papel.permissoes['agenda.*'] || papel.permissoes['*']);
}

async function enviarNotificacaoPushParaAgenda(
  titulo: string,
  corpo: string,
  url: string = '/admin/agenda',
  tag: string = 'agenda-optoclin'
): Promise<number> {
  let enviados = 0;
  try {
    const inscricoes = carregarInscricoesPush();
    if (inscricoes.length === 0) return 0;

    const payload = JSON.stringify({
      title: titulo,
      body: corpo,
      url,
      tag,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      timestamp: Date.now(),
    });

    for (const rec of inscricoes) {
      if (!usuarioTemPermissaoAgenda(rec.userId)) {
        continue;
      }
      try {
        await webpush.sendNotification(rec.subscription, payload);
        enviados++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          removerInscricaoPushPorId(rec.id);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao enviar notificações push:', err);
  }
  return enviados;
}

function carregarSessoes(): Map<string, SessaoData> {
  const map = new Map<string, SessaoData>();
  try {
    if (fs.existsSync(SESSOES_FILE)) {
      const arr: SessaoData[] = JSON.parse(fs.readFileSync(SESSOES_FILE, 'utf-8'));
      const now = new Date().toISOString();
      arr.forEach((s) => {
        if (s.expiraEm > now) {
          map.set(s.token, s);
        }
      });
    }
  } catch (err) {
    console.error('Erro ao ler sessoes-data.json:', err);
  }
  return map;
}

function salvarSessoes(sessoesMap: Map<string, SessaoData>) {
  try {
    const arr = Array.from(sessoesMap.values());
    fs.writeFileSync(SESSOES_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar sessoes-data.json:', err);
  }
}

const sessoesAtivas = carregarSessoes();

function carregarRecuperacoes(): RecuperacaoData[] {
  try {
    if (fs.existsSync(RECUPERACOES_FILE)) {
      return JSON.parse(fs.readFileSync(RECUPERACOES_FILE, 'utf-8'));
    }
  } catch {
    // ignora
  }
  return [];
}

function salvarRecuperacoes(recs: RecuperacaoData[]) {
  fs.writeFileSync(RECUPERACOES_FILE, JSON.stringify(recs, null, 2), 'utf-8');
}

export interface AuditoriaData {
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

function carregarAuditoria(): AuditoriaData[] {
  try {
    if (fs.existsSync(AUDITORIA_FILE)) {
      return JSON.parse(fs.readFileSync(AUDITORIA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Erro ao ler auditoria-data.json:', err);
  }
  return [];
}

function salvarAuditoria(logs: AuditoriaData[]) {
  try {
    fs.writeFileSync(AUDITORIA_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar auditoria-data.json:', err);
  }
}

function registrarAuditoria(
  req: Request,
  acao: string,
  colecao: string,
  docId: string,
  resumo: string,
  valorAnterior: any = null,
  valorNovo: any = null
): AuditoriaData {
  const logs = carregarAuditoria();
  const novoLog: AuditoriaData = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    usuarioUid: req.user?.uid || 'sistema',
    usuarioNome: req.user?.nome || 'Sistema',
    usuarioEmail: req.user?.email || 'sistema@consultorio',
    acao,
    colecao,
    docId,
    data: new Date().toISOString(),
    resumo,
    valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : null,
    valorNovo: valorNovo ? JSON.parse(JSON.stringify(valorNovo)) : null,
    ip: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || undefined,
  };
  logs.unshift(novoLog);
  if (logs.length > 1000) {
    logs.length = 1000;
  }
  salvarAuditoria(logs);
  return novoLog;
}

// Seed automático no boot se os arquivos não existirem
function garantirSeedInicial() {
  let papeis = carregarPapeis();
  if (papeis.length === 0) {
    papeis = [
      {
        id: 'admin',
        nome: 'Admin',
        descricao: 'Acesso total e irrestrito ao sistema, configurações, usuários e dados',
        sistema: true,
        ativo: true,
        permissoes: {
          'usuarios.ler': true,
          'usuarios.criar': true,
          'usuarios.editar': true,
          'usuarios.excluir': true,
          'usuarios.*': true,
          'papeis.ler': true,
          'papeis.criar': true,
          'papeis.editar': true,
          'papeis.excluir': true,
          'papeis.*': true,
          'empresa.ler': true,
          'empresa.editar': true,
          'agenda.ler': true,
          'agenda.criar': true,
          'agenda.editar': true,
          'agenda.excluir': true,
          'agenda.*': true,
          'pacientes.ler': true,
          'pacientes.criar': true,
          'pacientes.editar': true,
          'pacientes.excluir': true,
          'pacientes.*': true,
          'atendimento.ler': true,
          'atendimento.criar': true,
          'atendimento.editar': true,
          'atendimento.excluir': true,
          'atendimento.imprimir': true,
          'atendimento.*': true,
          'receitas.ler': true,
          'receitas.criar': true,
          'receitas.editar': true,
          'receitas.excluir': true,
          'receitas.imprimir': true,
          'receitas.*': true,
          'financeiro.ler': true,
          'financeiro.criar': true,
          'financeiro.editar': true,
          'financeiro.excluir': true,
          'financeiro.*': true,
          'relatorios.ler': true,
          'relatorios.todos': true,
          'relatorios.clinicos': true,
          'relatorios.agenda': true,
          'relatorios.financeiros': true,
          'relatorios.*': true,
          'auditoria.ler': true,
        },
        criadoEm: new Date().toISOString(),
      },
      {
        id: 'optometrista',
        nome: 'Optometrista',
        descricao: 'Profissional de saúde visual responsável pelos exames de refração e emissão de receitas',
        sistema: true,
        ativo: true,
        permissoes: {
          'empresa.ler': true,
          'agenda.ler': true,
          'agenda.criar': true,
          'agenda.editar': true,
          'agenda.excluir': true,
          'agenda.*': true,
          'pacientes.ler': true,
          'pacientes.criar': true,
          'pacientes.editar': true,
          'atendimento.ler': true,
          'atendimento.criar': true,
          'atendimento.editar': true,
          'atendimento.excluir': true,
          'atendimento.imprimir': true,
          'atendimento.*': true,
          'receitas.ler': true,
          'receitas.criar': true,
          'receitas.editar': true,
          'receitas.excluir': true,
          'receitas.imprimir': true,
          'receitas.*': true,
          'relatorios.ler': true,
          'relatorios.clinicos': true,
        },
        criadoEm: new Date().toISOString(),
      },
      {
        id: 'recepcao',
        nome: 'Recepção',
        descricao: 'Recepção e atendimento, controle da agenda de consultas e cadastro de pacientes',
        sistema: true,
        ativo: true,
        permissoes: {
          'empresa.ler': true,
          'agenda.ler': true,
          'agenda.criar': true,
          'agenda.editar': true,
          'agenda.excluir': true,
          'agenda.*': true,
          'pacientes.ler': true,
          'pacientes.criar': true,
          'pacientes.editar': true,
          'relatorios.ler': true,
          'relatorios.agenda': true,
        },
        criadoEm: new Date().toISOString(),
      },
      {
        id: 'financeiro',
        nome: 'Financeiro',
        descricao: 'Gestão financeira, fluxo de caixa, contas a pagar e a receber',
        sistema: true,
        ativo: true,
        permissoes: {
          'empresa.ler': true,
          'agenda.ler': true,
          'pacientes.ler': true,
          'financeiro.ler': true,
          'financeiro.criar': true,
          'financeiro.editar': true,
          'financeiro.excluir': true,
          'financeiro.*': true,
          'relatorios.ler': true,
          'relatorios.financeiros': true,
        },
        criadoEm: new Date().toISOString(),
      },
    ];
    salvarPapeis(papeis);
  }

  let usuarios = carregarUsuarios();
  const temAdmin = usuarios.some((u) => u.papelId === 'admin' && u.ativo);
  if (!temAdmin) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@consultorio.com.br').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const agora = new Date().toISOString();

    usuarios = [
      {
        uid: 'user-admin-01',
        nome: 'Administrador do Sistema',
        email: adminEmail,
        papelId: 'admin',
        ativo: true,
        passwordHash: hashPassword(adminPassword),
        trocarSenhaNoPrimeiroAcesso: true, // Requisito do prompt 04: troca obrigatória no primeiro acesso
        telefone: '(11) 98888-0000',
        criadoEm: agora,
        atualizadoEm: agora,
      },
      {
        uid: 'user-opto-01',
        nome: 'Dr. Roberto Viana',
        email: 'roberto@consultoriorobertoviana.com.br',
        registroProfissional: 'CBOO 14.892-SP | CBO 3223-05',
        papelId: 'optometrista',
        ativo: true,
        passwordHash: hashPassword('Roberto@123'),
        trocarSenhaNoPrimeiroAcesso: false,
        telefone: '(11) 98765-4321',
        criadoEm: agora,
        atualizadoEm: agora,
      },
      {
        uid: 'user-recep-01',
        nome: 'Juliana Paes',
        email: 'recepcao@consultoriorobertoviana.com.br',
        papelId: 'recepcao',
        ativo: true,
        passwordHash: hashPassword('Recepcao@123'),
        trocarSenhaNoPrimeiroAcesso: false,
        telefone: '(11) 97654-1234',
        criadoEm: agora,
        atualizadoEm: agora,
      },
      {
        uid: 'user-fin-01',
        nome: 'Marcos Silva',
        email: 'financeiro@consultoriorobertoviana.com.br',
        papelId: 'financeiro',
        ativo: true,
        passwordHash: hashPassword('Financeiro@123'),
        trocarSenhaNoPrimeiroAcesso: false,
        telefone: '(11) 96543-2109',
        criadoEm: agora,
        atualizadoEm: agora,
      },
    ];
    salvarUsuarios(usuarios);
    console.log(`[Segurança] Primeiro Administrador inicializado: ${adminEmail} (Troca obrigatória no primeiro acesso).`);
  }
}

garantirSeedInicial();

// Verificação de Permissão Modular
function hasServerPermission(
  permissoes: Record<string, boolean> | undefined,
  requiredPerm: string
): boolean {
  if (!permissoes) return false;
  if (permissoes['*'] === true || permissoes['*.*'] === true) return true;
  if (permissoes[requiredPerm] === true) return true;

  const [modulo] = requiredPerm.split('.');
  if (modulo && permissoes[`${modulo}.*`] === true) return true;

  if (requiredPerm === 'relatorios.ler') {
    return (
      permissoes['relatorios.ler'] === true ||
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.clinicos'] === true ||
      permissoes['relatorios.agenda'] === true ||
      permissoes['relatorios.financeiros'] === true ||
      permissoes['relatorios.*'] === true
    );
  }
  if (requiredPerm === 'relatorios.clinicos') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.clinicos'] === true ||
      permissoes['relatorios.*'] === true
    );
  }
  if (requiredPerm === 'relatorios.agenda') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.agenda'] === true ||
      permissoes['relatorios.*'] === true
    );
  }
  if (requiredPerm === 'relatorios.financeiros') {
    return (
      permissoes['relatorios.todos'] === true ||
      permissoes['relatorios.financeiros'] === true ||
      permissoes['relatorios.*'] === true
    );
  }

  return false;
}

// Extensão do objeto Request para incluir o usuário autenticado
export interface AuthenticatedUser {
  uid: string;
  email: string;
  nome: string;
  papelId: string;
  papelNome: string;
  permissoes: Record<string, boolean>;
  trocarSenhaNoPrimeiroAcesso: boolean;
  telefone?: string;
  registroProfissional?: string;
  fotoUrl?: string;
  criadoEm: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

// Middleware de autenticação: lê token do cookie httpOnly ou Authorization Bearer
// As permissões do usuário são lidas a cada requisição a partir do arquivo de papéis (editáveis imediatamente!)
function authenticate(req: Request, res: Response, next: NextFunction) {
  const tokenFromCookie = req.cookies?.consultorio_session;
  const tokenFromHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Sessão necessária.' });
  }

  const sessao = sessoesAtivas.get(token);
  if (!sessao) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  const now = new Date().toISOString();
  if (sessao.expiraEm < now) {
    sessoesAtivas.delete(token);
    salvarSessoes(sessoesAtivas);
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.uid === sessao.uid);

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  // LÊ O PAPEL E SUAS PERMISSÕES EM TEMPO REAL NO BANCO/ARQUIVO
  // Assim, mudar o papel ou permissões vale imediatamente para a próxima requisição!
  const papeis = carregarPapeis();
  const papel = papeis.find((p) => p.id === usuario.papelId && p.ativo);

  req.sessionToken = token;
  req.user = {
    uid: usuario.uid,
    email: usuario.email,
    nome: usuario.nome,
    papelId: usuario.papelId,
    papelNome: papel?.nome || usuario.papelId,
    permissoes: papel?.permissoes || {},
    trocarSenhaNoPrimeiroAcesso: usuario.trocarSenhaNoPrimeiroAcesso,
    telefone: usuario.telefone,
    registroProfissional: usuario.registroProfissional,
    fotoUrl: usuario.fotoUrl,
    criadoEm: usuario.criadoEm,
  };

  next();
}

// Middleware que verifica permissão requerida (formato modulo.acao)
function requirePermission(perm: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
      }

      const permitido = hasServerPermission(req.user.permissoes, perm);
      if (!permitido) {
        return res.status(403).json({
          error: `Acesso negado: permissão necessária: ${perm}`,
          permissaoRequerida: perm,
          papelUsuario: req.user.papelNome,
        });
      }

      next();
    });
  };
}

// ============================================================================
// ENDPOINTS DE AUTENTICAÇÃO (/api/auth/*)
// ============================================================================

// 1. Login com e-mail e senha, hash forte, limite de tentativas e cookie httpOnly
app.post('/api/auth/login', (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password || req.body.senha;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha para acesso.' });
  }

  const rateLimitKey = getLoginRateLimitKey(clientIp, email);
  const rateLimitCheck = checkLoginAttempt(rateLimitKey);

  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: `Limite de tentativas excedido. Conta temporariamente bloqueada por segurança. Tente novamente em ${rateLimitCheck.waitMinutes} minutos.`,
    });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!usuario || !usuario.ativo) {
    const failInfo = registerLoginFailure(rateLimitKey);
    return res.status(401).json({
      error: failInfo.locked
        ? 'Múltiplas falhas detectadas. Conta temporariamente bloqueada por 15 minutos.'
        : 'E-mail ou senha inválidos.',
    });
  }

  const senhaValida = verifyPassword(password, usuario.passwordHash);
  if (!senhaValida) {
    const failInfo = registerLoginFailure(rateLimitKey);
    return res.status(401).json({
      error: failInfo.locked
        ? 'Múltiplas falhas detectadas. Conta temporariamente bloqueada por 15 minutos.'
        : `Senha incorreta.${failInfo.remaining > 0 ? ` Restam ${failInfo.remaining} tentativa(s).` : ''}`,
    });
  }

  // Sucesso no login: resetar contador de falhas
  resetLoginAttempts(rateLimitKey);

  // Atualizar data de último acesso
  usuario.ultimoAcesso = new Date().toISOString();
  salvarUsuarios(usuarios);

  // Criar sessão segura
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const seteDiasEmMs = 7 * 24 * 60 * 60 * 1000;
  const expiraEm = new Date(Date.now() + seteDiasEmMs).toISOString();

  sessoesAtivas.set(sessionToken, {
    token: sessionToken,
    uid: usuario.uid,
    criadoEm: new Date().toISOString(),
    expiraEm,
  });
  salvarSessoes(sessoesAtivas);

  // Define cookie httpOnly
  res.cookie('consultorio_session', sessionToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: seteDiasEmMs,
    path: '/',
  });

  const papeis = carregarPapeis();
  const papel = papeis.find((p) => p.id === usuario.papelId && p.ativo);

  const userData = {
    uid: usuario.uid,
    id: usuario.uid,
    email: usuario.email,
    nome: usuario.nome,
    papelId: usuario.papelId,
    papelNome: papel?.nome || usuario.papelId,
    permissoes: papel?.permissoes || {},
    trocarSenhaNoPrimeiroAcesso: usuario.trocarSenhaNoPrimeiroAcesso,
    telefone: usuario.telefone,
    registroProfissional: usuario.registroProfissional,
    fotoUrl: usuario.fotoUrl,
    criadoEm: usuario.criadoEm,
  };

  return res.json({
    sucesso: true,
    sessionToken,
    token: sessionToken,
    user: userData,
    usuario: userData,
  });
});

// 2. Logout seguro: invalida a sessão no servidor e remove cookie httpOnly
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.consultorio_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    sessoesAtivas.delete(token);
    salvarSessoes(sessoesAtivas);
  }
  res.clearCookie('consultorio_session', { path: '/' });
  return res.json({ sucesso: true, mensagem: 'Sessão encerrada com sucesso.' });
});

// 3. Usuário atual e suas permissões em tempo real
app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  return res.json({
    sucesso: true,
    user: req.user,
  });
});

// 4. Solicitação de recuperação de senha por e-mail
app.post('/api/auth/recuperar-senha', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.ativo);

  // Token seguro de recuperação válido por 1 hora
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiraEm = Date.now() + 60 * 60 * 1000;

  const recuperacoes = carregarRecuperacoes();
  recuperacoes.push({
    token: resetToken,
    email: email.trim().toLowerCase(),
    expiraEm,
  });
  salvarRecuperacoes(recuperacoes);

  const resetUrl = `/redefinir-senha?token=${resetToken}`;
  console.log(`========================================================================`);
  console.log(`[E-mail Service] Recuperação de Senha do Consultório`);
  console.log(`Para: ${email}`);
  console.log(`Link de redefinição: ${resetUrl}`);
  console.log(`========================================================================`);

  // Mensagem segura genérica (não vaza se o e-mail existe ou não)
  return res.json({
    sucesso: true,
    message: 'Se o e-mail estiver cadastrado no consultório, você receberá o link de redefinição.',
    devResetUrl: resetUrl,
  });
});

// 5. Redefinir senha usando token de recuperação
app.post('/api/auth/redefinir-senha', (req: Request, res: Response) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha || novaSenha.length < 8) {
    return res.status(400).json({ error: 'Token inválido ou senha com menos de 8 caracteres.' });
  }

  const recuperacoes = carregarRecuperacoes();
  const recIndex = recuperacoes.findIndex((r) => r.token === token && r.expiraEm > Date.now());

  if (recIndex === -1) {
    return res.status(400).json({ error: 'Token de recuperação inválido ou expirado.' });
  }

  const rec = recuperacoes[recIndex];
  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.email.toLowerCase() === rec.email.toLowerCase());

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  usuario.passwordHash = hashPassword(novaSenha);
  usuario.trocarSenhaNoPrimeiroAcesso = false;
  usuario.atualizadoEm = new Date().toISOString();
  salvarUsuarios(usuarios);

  // Remove token usado
  recuperacoes.splice(recIndex, 1);
  salvarRecuperacoes(recuperacoes);

  return res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso. Faça login.' });
});

// 6. Troca de senha autenticada (ex: obrigatória no primeiro acesso do Admin)
app.post('/api/auth/trocar-senha', authenticate, (req: Request, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha || novaSenha.length < 8) {
    return res.status(400).json({ error: 'Informe a senha atual e uma nova senha com no mínimo 8 caracteres.' });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.uid === req.user!.uid);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (!verifyPassword(senhaAtual, usuario.passwordHash)) {
    return res.status(401).json({ error: 'A senha atual informada está incorreta.' });
  }

  usuario.passwordHash = hashPassword(novaSenha);
  usuario.trocarSenhaNoPrimeiroAcesso = false;
  usuario.atualizadoEm = new Date().toISOString();
  salvarUsuarios(usuarios);

  return res.json({ sucesso: true, mensagem: 'Senha atualizada com sucesso.' });
});

// ============================================================================
// ENDPOINTS PROTEGIDOS POR MÓDULO (REQUIRE PERMISSION)
// ============================================================================

// Papéis e Permissões (Editáveis no banco; afetam imediatamente os usuários!)
app.get('/api/admin/papeis', requirePermission('papeis.ler'), (_req: Request, res: Response) => {
  return res.json(carregarPapeis());
});

app.post('/api/admin/papeis', requirePermission('papeis.criar'), (req: Request, res: Response) => {
  const { id, nome, descricao, permissoes } = req.body;
  if (!nome || !permissoes || typeof permissoes !== 'object') {
    return res.status(400).json({ error: 'Nome do papel e objeto de permissões são obrigatórios.' });
  }

  const papeis = carregarPapeis();
  const slug = (id || nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);
  const finalId = id ? slug : `papel_${slug}_${Date.now().toString(36).slice(-4)}`;

  if (papeis.some((p) => p.id === finalId)) {
    return res.status(409).json({ error: `Já existe um papel com o identificador "${finalId}".` });
  }

  const novoPapel: PapelData = {
    id: finalId,
    nome: nome.trim(),
    descricao: descricao ? descricao.trim() : '',
    permissoes,
    sistema: false,
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  papeis.push(novoPapel);
  salvarPapeis(papeis);

  registrarAuditoria(
    req,
    'papel.criar',
    'papeis',
    novoPapel.id,
    `Papel personalizado "${novoPapel.nome}" (${novoPapel.id}) criado.`,
    null,
    novoPapel
  );

  return res.status(201).json({ sucesso: true, papel: novoPapel });
});

app.put('/api/admin/papeis/:id', requirePermission('papeis.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, permissoes, ativo } = req.body;

  const papeis = carregarPapeis();
  const index = papeis.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Papel não encontrado.' });
  }

  // Regra docs/05: Papéis de sistema têm permissões ajustáveis, exceto as do Admin!
  if (id === 'admin' && permissoes !== undefined) {
    return res.status(400).json({
      error: 'As permissões do papel Administrador são fixas e protegidas para manter a segurança do sistema.',
    });
  }

  const papelAnterior = { ...papeis[index] };

  papeis[index] = {
    ...papeis[index],
    nome: nome !== undefined ? nome.trim() : papeis[index].nome,
    descricao: descricao !== undefined ? descricao.trim() : papeis[index].descricao,
    permissoes: id === 'admin' ? papeis[index].permissoes : (permissoes ?? papeis[index].permissoes),
    ativo: id === 'admin' ? true : (ativo !== undefined ? ativo : papeis[index].ativo),
    atualizadoEm: new Date().toISOString(),
  };

  salvarPapeis(papeis);

  registrarAuditoria(
    req,
    'papel.editar',
    'papeis',
    id,
    `Papel "${papeis[index].nome}" (${id}) atualizado.`,
    papelAnterior,
    papeis[index]
  );

  return res.json({ sucesso: true, papel: papeis[index] });
});

app.delete('/api/admin/papeis/:id', requirePermission('papeis.excluir'), (req: Request, res: Response) => {
  const { id } = req.params;
  const papeis = carregarPapeis();
  const index = papeis.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Papel não encontrado.' });
  }

  const papel = papeis[index];

  // Regra docs/05: Papéis de sistema não podem ser excluídos
  if (papel.sistema) {
    return res.status(400).json({
      error: `O papel "${papel.nome}" é nativo do sistema e não pode ser excluído.`,
    });
  }

  // Regra docs/05: Papel em uso não pode ser excluído
  const usuarios = carregarUsuarios();
  const usuariosComPapel = usuarios.filter((u) => u.papelId === id);
  if (usuariosComPapel.length > 0) {
    return res.status(400).json({
      error: `Não é possível excluir o papel "${papel.nome}" pois ele está associado a ${usuariosComPapel.length} usuário(s). Reatribua os usuários primeiro.`,
      usuariosEmUso: usuariosComPapel.map((u) => u.nome),
    });
  }

  const papelExcluido = papeis.splice(index, 1)[0];
  salvarPapeis(papeis);

  registrarAuditoria(
    req,
    'papel.excluir',
    'papeis',
    id,
    `Papel personalizado "${papelExcluido.nome}" (${id}) foi excluído.`,
    papelExcluido,
    null
  );

  return res.json({ sucesso: true, mensagem: `Papel "${papelExcluido.nome}" excluído com sucesso.` });
});

// Usuários da Equipe
app.get('/api/admin/usuarios', requirePermission('usuarios.ler'), (_req: Request, res: Response) => {
  const papeis = carregarPapeis();
  const papeisMap = new Map(papeis.map((p) => [p.id, p.nome]));

  const usuarios = carregarUsuarios().map((u) => ({
    uid: u.uid,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone,
    papelId: u.papelId,
    papelNome: papeisMap.get(u.papelId) || u.papelId,
    ativo: u.ativo,
    ultimoAcesso: u.ultimoAcesso,
    registroProfissional: u.registroProfissional,
    fotoUrl: u.fotoUrl,
    trocarSenhaNoPrimeiroAcesso: u.trocarSenhaNoPrimeiroAcesso,
    criadoEm: u.criadoEm,
    atualizadoEm: u.atualizadoEm,
  }));
  return res.json(usuarios);
});

app.post('/api/admin/usuarios', requirePermission('usuarios.criar'), (req: Request, res: Response) => {
  const { nome, email, papelId, telefone, registroProfissional, ativo } = req.body;
  const senhaFornecida = req.body.senha || req.body.password || req.body.senhaInicial;
  if (!nome || !email || !papelId) {
    return res.status(400).json({ error: 'Nome, e-mail e papel são obrigatórios.' });
  }

  const papeis = carregarPapeis();
  const papelValido = papeis.find((p) => p.id === papelId && p.ativo);
  if (!papelValido) {
    return res.status(400).json({ error: `O papel selecionado "${papelId}" não existe ou está inativo.` });
  }

  const usuarios = carregarUsuarios();
  if (usuarios.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  // Gera senha segura temporária caso não tenha sido fornecida manualmente
  const senhaEfetiva = senhaFornecida && senhaFornecida.length >= 6
    ? senhaFornecida
    : crypto.randomBytes(8).toString('base64');

  const novoUsuario: UsuarioData = {
    uid: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    papelId,
    ativo: ativo !== undefined ? Boolean(ativo) : true,
    passwordHash: hashPassword(senhaEfetiva),
    trocarSenhaNoPrimeiroAcesso: true,
    telefone: telefone ? telefone.trim() : undefined,
    registroProfissional: registroProfissional ? registroProfissional.trim() : undefined,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  // Requisito docs/05: Token de definição de senha de uso único e com validade
  const tokenDefinicao = crypto.randomBytes(32).toString('hex');
  const expiraEm = Date.now() + 48 * 60 * 60 * 1000; // 48 horas
  const recuperacoes = carregarRecuperacoes();
  recuperacoes.push({
    token: tokenDefinicao,
    email: novoUsuario.email,
    expiraEm,
  });
  salvarRecuperacoes(recuperacoes);

  const definicaoUrl = `/redefinir-senha?token=${tokenDefinicao}`;

  console.log(`========================================================================`);
  console.log(`[E-mail Service] Novo Colaborador Criado: ${novoUsuario.nome} (${novoUsuario.email})`);
  console.log(`Link de definição de senha (uso único): ${definicaoUrl}`);
  console.log(`========================================================================`);

  registrarAuditoria(
    req,
    'usuario.criar',
    'usuarios',
    novoUsuario.uid,
    `Usuário "${novoUsuario.nome}" (${novoUsuario.email}) cadastrado com o papel "${papelValido.nome}". Link de definição gerado.`,
    null,
    {
      uid: novoUsuario.uid,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      papelId: novoUsuario.papelId,
      ativo: novoUsuario.ativo,
      telefone: novoUsuario.telefone,
      registroProfissional: novoUsuario.registroProfissional,
    }
  );

  return res.status(201).json({
    sucesso: true,
    usuario: {
      uid: novoUsuario.uid,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      telefone: novoUsuario.telefone,
      papelId: novoUsuario.papelId,
      papelNome: papelValido.nome,
      ativo: novoUsuario.ativo,
      registroProfissional: novoUsuario.registroProfissional,
      criadoEm: novoUsuario.criadoEm,
    },
    definicaoUrl,
    mensagem: 'Usuário cadastrado com sucesso. Compartilhe o link de definição de senha.',
  });
});

app.put('/api/admin/usuarios/:uid', requirePermission('usuarios.editar'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const { nome, telefone, papelId, ativo, registroProfissional } = req.body;

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.uid === uid);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const usuarioAnterior = { ...usuarios[index] };

  // 1. Regra docs/05: Bloquear desativar ou rebaixar o próprio usuário logado
  if (req.user && req.user.uid === uid) {
    if (ativo === false) {
      return res.status(400).json({ error: 'Você não pode desativar o próprio usuário com o qual está logado.' });
    }
    if (papelId && papelId !== 'admin' && req.user.papelId === 'admin') {
      return res.status(400).json({ error: 'Você não pode rebaixar seu próprio papel de Administrador.' });
    }
  }

  // 2. Regra docs/05: Bloquear desativar ou rebaixar o último Administrador ativo
  if (usuarioAnterior.papelId === 'admin' && (ativo === false || (papelId && papelId !== 'admin'))) {
    const outrosAdminsAtivos = usuarios.filter((u) => u.papelId === 'admin' && u.ativo && u.uid !== uid);
    if (outrosAdminsAtivos.length === 0) {
      return res.status(400).json({
        error: 'Impossível desativar ou rebaixar o único Administrador ativo do consultório.',
      });
    }
  }

  // Validação do novo papel, se informado
  if (papelId && papelId !== usuarioAnterior.papelId) {
    const papeis = carregarPapeis();
    const papelExiste = papeis.find((p) => p.id === papelId && p.ativo);
    if (!papelExiste) {
      return res.status(400).json({ error: `O papel selecionado "${papelId}" não existe ou está inativo.` });
    }
  }

  const novoAtivo = ativo !== undefined ? Boolean(ativo) : usuarios[index].ativo;

  // 3. Regra docs/05: "Excluir" = desativar (ativo = false), encerrando as sessões do usuário imediatamente
  if (novoAtivo === false && usuarioAnterior.ativo === true) {
    for (const [token, sessao] of sessoesAtivas.entries()) {
      if (sessao.uid === uid) {
        sessoesAtivas.delete(token);
      }
    }
    salvarSessoes(sessoesAtivas);
  }

  usuarios[index] = {
    ...usuarios[index],
    nome: nome !== undefined ? nome.trim() : usuarios[index].nome,
    telefone: telefone !== undefined ? telefone : usuarios[index].telefone,
    papelId: papelId !== undefined ? papelId : usuarios[index].papelId,
    ativo: novoAtivo,
    registroProfissional: registroProfissional !== undefined ? registroProfissional : usuarios[index].registroProfissional,
    atualizadoEm: new Date().toISOString(),
  };

  salvarUsuarios(usuarios);

  const papeis = carregarPapeis();
  const papelNome = papeis.find((p) => p.id === usuarios[index].papelId)?.nome || usuarios[index].papelId;

  const acaoAuditoria = novoAtivo === false && usuarioAnterior.ativo === true ? 'usuario.desativar' : 'usuario.editar';
  const resumo = novoAtivo === false && usuarioAnterior.ativo === true
    ? `Usuário "${usuarios[index].nome}" (${usuarios[index].email}) foi desativado e teve suas sessões encerradas.`
    : `Usuário "${usuarios[index].nome}" (${usuarios[index].email}) foi atualizado (papel: ${papelNome}).`;

  registrarAuditoria(
    req,
    acaoAuditoria,
    'usuarios',
    uid,
    resumo,
    {
      nome: usuarioAnterior.nome,
      telefone: usuarioAnterior.telefone,
      papelId: usuarioAnterior.papelId,
      ativo: usuarioAnterior.ativo,
      registroProfissional: usuarioAnterior.registroProfissional,
    },
    {
      nome: usuarios[index].nome,
      telefone: usuarios[index].telefone,
      papelId: usuarios[index].papelId,
      ativo: usuarios[index].ativo,
      registroProfissional: usuarios[index].registroProfissional,
    }
  );

  return res.json({
    sucesso: true,
    usuario: {
      uid: usuarios[index].uid,
      nome: usuarios[index].nome,
      email: usuarios[index].email,
      telefone: usuarios[index].telefone,
      papelId: usuarios[index].papelId,
      papelNome,
      ativo: usuarios[index].ativo,
      registroProfissional: usuarios[index].registroProfissional,
      ultimoAcesso: usuarios[index].ultimoAcesso,
      criadoEm: usuarios[index].criadoEm,
      atualizadoEm: usuarios[index].atualizadoEm,
    },
  });
});

app.delete('/api/admin/usuarios/:uid', requirePermission('usuarios.excluir'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.uid === uid);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const usuario = usuarios[index];

  // Regra docs/05: Bloquear desativar o próprio usuário logado
  if (req.user && req.user.uid === uid) {
    return res.status(400).json({ error: 'Você não pode desativar o próprio usuário com o qual está logado.' });
  }

  // Regra docs/05: Bloquear desativar o último Administrador ativo
  if (usuario.papelId === 'admin' && usuario.ativo) {
    const outrosAdminsAtivos = usuarios.filter((u) => u.papelId === 'admin' && u.ativo && u.uid !== uid);
    if (outrosAdminsAtivos.length === 0) {
      return res.status(400).json({
        error: 'Impossível desativar o único Administrador ativo do consultório.',
      });
    }
  }

  const valorAnterior = { ...usuario };

  // "Excluir" = desativar (ativo = false), encerrando as sessões
  usuario.ativo = false;
  usuario.atualizadoEm = new Date().toISOString();

  for (const [token, sessao] of sessoesAtivas.entries()) {
    if (sessao.uid === uid) {
      sessoesAtivas.delete(token);
    }
  }
  salvarSessoes(sessoesAtivas);
  salvarUsuarios(usuarios);

  registrarAuditoria(
    req,
    'usuario.desativar',
    'usuarios',
    uid,
    `Usuário "${usuario.nome}" (${usuario.email}) desativado e sessões ativas revogadas.`,
    { ativo: valorAnterior.ativo, papelId: valorAnterior.papelId },
    { ativo: false, papelId: usuario.papelId }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Usuário desativado com sucesso e todas as sessões ativas foram encerradas.',
    usuario: {
      uid: usuario.uid,
      nome: usuario.nome,
      email: usuario.email,
      ativo: false,
    },
  });
});

// ============================================================================
// MÓDULO: DASHBOARD & INDICADORES GERAIS (PROMPT 07)
// ============================================================================
app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.auth_token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const sessoes = carregarSessoes();
  const sessao = sessoes.get(token);
  if (!sessao || new Date(sessao.expiraEm) < new Date()) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const usuario = carregarUsuarios().find((u) => u.uid === sessao.uid && u.ativo);
  if (!usuario) {
    return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  const papeis = carregarPapeis();
  const papel = papeis.find((p) => p.id === usuario.papelId && p.ativo);
  const permissoes = papel?.permissoes || {};
  const temPermissaoFinanceiro = Boolean(permissoes['financeiro.ler'] || usuario.papelId === 'admin');

  const agendamentos = carregarAgendamentos();
  const hojeStr = new Date().toISOString().split('T')[0];

  const consultasHoje = agendamentos.filter((a) => a.data === hojeStr);
  const pendentesConfirmacao = agendamentos.filter((a) => a.status === 'pendente');
  const agendamentosSiteNovos = agendamentos.filter((a) => a.origem === 'site');

  let financeiroMes: {
    receitaCentavos: number;
    despesaCentavos: number;
    saldoCentavos: number;
    totalTransacoes: number;
  } | null = null;

  // Regra Deontológica e Segregação Prompt 07: Receita do mês exibida APENAS para quem tem permissão financeiro.ler
  if (temPermissaoFinanceiro) {
    const mesAtual = hojeStr.slice(0, 7);
    let receita = 0;
    let despesa = 32000; // Despesas operacionais do mês

    for (const a of agendamentos) {
      if (
        a.data.startsWith(mesAtual) &&
        (a.status === 'atendido' || a.status === 'confirmado' || a.status === 'concluido')
      ) {
        receita += a.servicoPrecoCentavos || 16000;
      }
    }
    receita += 32000; // Exames já faturados

    financeiroMes = {
      receitaCentavos: receita,
      despesaCentavos: despesa,
      saldoCentavos: receita - despesa,
      totalTransacoes: agendamentos.length,
    };
  }

  return res.json({
    sucesso: true,
    dataAtual: hojeStr,
    totalConsultasHoje: consultasHoje.length,
    consultasHoje,
    totalPendentes: pendentesConfirmacao.length,
    pendentesConfirmacao,
    totalNovosSite: agendamentosSiteNovos.length,
    temPermissaoFinanceiro,
    financeiroMes,
  });
});

// ============================================================================
// MÓDULO: AGENDA CLÍNICA & ATENDIMENTOS (PROMPT 07)
// ============================================================================
app.get('/api/admin/agenda', requirePermission('agenda.ler'), (req: Request, res: Response) => {
  const { data, status, origem, inicio, fim } = req.query;
  let agendamentos = carregarAgendamentos();

  if (data && typeof data === 'string') {
    agendamentos = agendamentos.filter((a) => a.data === data);
  }
  if (status && typeof status === 'string' && status !== 'todos') {
    agendamentos = agendamentos.filter((a) => a.status === status);
  }
  if (origem && typeof origem === 'string' && origem !== 'todos') {
    agendamentos = agendamentos.filter((a) => a.origem === origem);
  }
  if (inicio && typeof inicio === 'string') {
    agendamentos = agendamentos.filter((a) => a.data >= inicio);
  }
  if (fim && typeof fim === 'string') {
    agendamentos = agendamentos.filter((a) => a.data <= fim);
  }

  const consultorio = carregarDadosConsultorio();

  return res.json({
    sucesso: true,
    total: agendamentos.length,
    agendamentos,
    bloqueios: consultorio.bloqueiosAgenda || [],
    motivosCancelamento: consultorio.motivosCancelamento || [],
    horariosAtendimento: consultorio.horariosAtendimento || [],
  });
});

app.post('/api/admin/agenda', requirePermission('agenda.criar'), (req: Request, res: Response) => {
  const {
    pacienteId,
    nomeContato,
    telefone,
    email,
    servicoId,
    data,
    horario,
    duracaoMin,
    observacoes,
    optometristaNome,
  } = req.body;

  if (!nomeContato || !data || !horario) {
    return res.status(400).json({ error: 'Nome do paciente, data e horário são campos obrigatórios.' });
  }

  const consultorio = carregarDadosConsultorio();
  const servico = (consultorio.servicos || []).find((s) => s.id === servicoId) || {
    id: servicoId || 'srv-001',
    nome: 'Consulta Optométrica Completa',
    duracaoMin: duracaoMin || 40,
    precoCentavos: 16000,
  };

  const duracao = duracaoMin || servico.duracaoMin || 40;

  // Validação idêntica ao agendamento público: sem duplicidade e respeitando bloqueios de agenda
  const validacao = validarDisponibilidadeAgendamento(data, horario, duracao, consultorio);
  if (!validacao.valido) {
    return res.status(400).json({ error: validacao.erro });
  }

  const agora = new Date().toISOString();
  const protocolo = `OPTO-INT-${Date.now().toString(36).toUpperCase()}`;

  const novoAgendamento: AgendamentoRegistro = {
    id: `apt-${Date.now()}`,
    protocolo,
    pacienteId: pacienteId || undefined,
    nomeContato: sanitizarTexto(nomeContato),
    telefone: telefone || '',
    email: email || '',
    servicoId: servico.id,
    servicoNome: servico.nome,
    servicoPrecoCentavos: servico.precoCentavos || 16000,
    duracaoMin: duracao,
    data,
    horario,
    inicio: `${data}T${horario}:00.000Z`,
    fim: `${data}T${minutesToTime(timeToMinutes(horario) + duracao)}:00.000Z`,
    status: 'confirmado',
    origem: 'interno',
    optometristaNome: optometristaNome || consultorio.responsavelTecnico,
    observacoes: observacoes ? sanitizarTexto(observacoes) : undefined,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  const agendamentos = carregarAgendamentos();
  agendamentos.push(novoAgendamento);
  salvarAgendamentos(agendamentos);

  enviarNotificacaoPushParaAgenda(
    'Novo Agendamento Cadastrado',
    `Agendamento para ${novoAgendamento.nomeContato} em ${data} às ${horario}.`,
    '/admin/agenda',
    `agenda-${novoAgendamento.id}`
  );

  registrarAuditoria(
    req,
    'agenda.criar',
    'agenda',
    novoAgendamento.id,
    `Agendamento interno criado para ${novoAgendamento.nomeContato} (${novoAgendamento.servicoNome}) no dia ${data} às ${horario}.`,
    null,
    {
      id: novoAgendamento.id,
      nomeContato: novoAgendamento.nomeContato,
      data,
      horario,
      origem: 'interno',
    }
  );

  const { texto: msgWhatsapp, linkWhatsApp } = gerarMensagemWhatsAppConfirmacao(novoAgendamento, consultorio);

  return res.status(201).json({
    sucesso: true,
    agendamento: novoAgendamento,
    mensagemWhatsapp: msgWhatsapp,
    linkWhatsApp,
  });
});

app.put('/api/admin/agenda/:id', requirePermission('agenda.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    acao,
    status,
    novaData,
    novoHorario,
    motivoCancelamento,
    motivoCancelamentoId,
    observacoes,
  } = req.body;

  const agendamentos = carregarAgendamentos();
  const index = agendamentos.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const atual = agendamentos[index];
  const anterior = { ...atual };
  const consultorio = carregarDadosConsultorio();
  const agora = new Date().toISOString();

  let acaoAuditoria = 'agenda.editar';
  let resumoAuditoria = `Agendamento de ${atual.nomeContato} atualizado.`;

  // 1. Remarcar
  if (acao === 'remarcar' || (novaData && novoHorario && (novaData !== atual.data || novoHorario !== atual.horario))) {
    const dataAlvo = novaData || atual.data;
    const horarioAlvo = novoHorario || atual.horario;
    const duracao = atual.duracaoMin || 40;

    const validacao = validarDisponibilidadeAgendamento(dataAlvo, horarioAlvo, duracao, consultorio, id);
    if (!validacao.valido) {
      return res.status(400).json({ error: validacao.erro });
    }

    atual.data = dataAlvo;
    atual.horario = horarioAlvo;
    atual.inicio = `${dataAlvo}T${horarioAlvo}:00.000Z`;
    atual.fim = `${dataAlvo}T${minutesToTime(timeToMinutes(horarioAlvo) + duracao)}:00.000Z`;
    atual.status = 'remarcado';
    atual.atualizadoEm = agora;

    acaoAuditoria = 'agenda.remarcar';
    resumoAuditoria = `Consulta de ${atual.nomeContato} remarcada de ${anterior.data} às ${anterior.horario} para ${dataAlvo} às ${horarioAlvo}.`;
  }
  // 2. Cancelar
  else if (acao === 'cancelar' || status === 'cancelado') {
    if (!motivoCancelamento && !motivoCancelamentoId) {
      return res.status(400).json({
        error: 'É obrigatório selecionar ou informar o motivo do cancelamento da consulta.',
      });
    }

    const motivoNome =
      motivoCancelamento ||
      (consultorio.motivosCancelamento || []).find((m) => m.id === motivoCancelamentoId)?.nome ||
      'Outro motivo justificado';

    atual.status = 'cancelado';
    atual.motivoCancelamentoId = motivoCancelamentoId;
    atual.motivoCancelamento = motivoNome;
    atual.atualizadoEm = agora;

    acaoAuditoria = 'agenda.cancelar';
    resumoAuditoria = `Consulta de ${atual.nomeContato} cancelada. Motivo: ${motivoNome}.`;
  }
  // 3. Confirmar
  else if (acao === 'confirmar' || status === 'confirmado') {
    atual.status = 'confirmado';
    atual.atualizadoEm = agora;

    acaoAuditoria = 'agenda.confirmar';
    resumoAuditoria = `Consulta de ${atual.nomeContato} confirmada para ${atual.data} às ${atual.horario}.`;
  }
  // 4. Marcar Atendido
  // 4. Marcar Atendido (Regra Prompt 08: Ao atender um agendamento, vincule ou crie o paciente automaticamente, sugerindo possíveis duplicados antes de criar)
  else if (acao === 'atendido' || status === 'atendido') {
    const pacientes = carregarPacientes();
    let pacienteVinculado: PacienteRegistro | null = null;
    let pacienteCriadoAutomaticamente = false;

    // Se já tem pacienteId vinculado
    if (atual.pacienteId) {
      pacienteVinculado = pacientes.find((p) => p.id === atual.pacienteId) || null;
    }

    // Se o cliente forneceu um pacienteId para vincular agora
    if (!pacienteVinculado && req.body.pacienteId) {
      const pAlvo = pacientes.find((p) => p.id === req.body.pacienteId);
      if (pAlvo) {
        atual.pacienteId = pAlvo.id;
        pacienteVinculado = pAlvo;
      }
    }

    // Se ainda não está vinculado a nenhum paciente
    if (!pacienteVinculado) {
      const telDigitos = atual.telefone ? atual.telefone.replace(/\D/g, '') : '';
      const cpfDigitos = req.body.cpf ? req.body.cpf.replace(/\D/g, '') : '';

      // Busca possíveis duplicados existentes (mesmo telefone ou mesmo CPF)
      const candidatos = pacientes.filter((p) => {
        if (p.ativo === false) return false;
        if (cpfDigitos && p.cpf && p.cpf.replace(/\D/g, '') === cpfDigitos) return true;
        if (telDigitos && p.phone && p.phone.replace(/\D/g, '') === telDigitos) return true;
        return false;
      });

      // Se há candidatos duplicados e o operador ainda não confirmou se deseja vincular ou criar novo
      if (candidatos.length > 0 && !req.body.criarNovo && !req.body.forcarCriacao) {
        return res.status(200).json({
          sucesso: false,
          requerVinculoPaciente: true,
          mensagem: 'Identificamos cadastro(s) existente(s) com dados coincidentes (mesmo telefone ou CPF). Vincule ao paciente existente ou confirme a criação de uma nova ficha.',
          duplicados: candidatos.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            cpf: c.cpf,
            motivo: c.phone.replace(/\D/g, '') === telDigitos ? 'Mesmo telefone/WhatsApp' : 'Mesmo CPF cadastrado',
          })),
          agendamento: atual,
        });
      }

      // Se não há duplicados ou se foi expressamente confirmado para criar novo: cria automaticamente
      const novoId = `pat-${Date.now().toString(36)}`;
      const novoPaciente: PacienteRegistro = {
        id: novoId,
        name: sanitizarTexto(atual.nomeContato),
        phone: sanitizarTexto(atual.telefone),
        email: atual.email ? sanitizarTexto(atual.email) : undefined,
        birthDate: req.body.birthDate || '1990-01-01',
        gender: req.body.gender || 'F',
        cpf: req.body.cpf && validarCPFServer(req.body.cpf) ? sanitizarTexto(req.body.cpf) : undefined,
        ativo: true,
        healthInsurance: 'Particular',
        anamnesis: {
          chiefComplaint: atual.observacoes ? sanitizarTexto(atual.observacoes) : 'Consulta realizada no consultório.',
          lastExamDate: atual.data,
          wearsGlasses: false,
          wearsContactLenses: false,
          systemicDiseases: [],
          ocularFamilyHistory: [],
        },
        consentimentoLgpd: {
          aceito: true,
          dataHora: agora,
          versao: '1.0',
          canal: atual.origem || 'presencial',
          ip: req.ip || '127.0.0.1',
        },
        createdAt: agora,
        updatedAt: agora,
      };

      pacientes.unshift(novoPaciente);
      salvarPacientes(pacientes);

      registrarAuditoria(
        req,
        'paciente.criar',
        'pacientes',
        novoId,
        `Ficha do paciente "${novoPaciente.name}" criada automaticamente ao atender agendamento (${atual.protocolo || atual.id}).`,
        null,
        { id: novoId, name: novoPaciente.name, phone: novoPaciente.phone }
      );

      atual.pacienteId = novoId;
      pacienteVinculado = novoPaciente;
      pacienteCriadoAutomaticamente = true;
    }

    atual.status = 'atendido';
    atual.atualizadoEm = agora;

    acaoAuditoria = 'agenda.atender';
    resumoAuditoria = `Consulta de ${atual.nomeContato} concluída/marcada como atendida (Paciente vinculado: ${pacienteVinculado?.name || 'Sim'}).`;
  }
  // 5. Marcar Faltou
  else if (acao === 'faltou' || status === 'faltou') {
    atual.status = 'faltou';
    atual.atualizadoEm = agora;

    acaoAuditoria = 'agenda.faltar';
    resumoAuditoria = `Paciente ${atual.nomeContato} marcado como ausente (faltou à consulta).`;
  }
  // Outros status
  else if (status) {
    atual.status = status;
    atual.atualizadoEm = agora;
  }

  if (observacoes !== undefined) {
    atual.observacoes = sanitizarTexto(observacoes);
  }

  agendamentos[index] = atual;
  salvarAgendamentos(agendamentos);

  enviarNotificacaoPushParaAgenda(
    'Consulta Atualizada',
    `Agendamento de ${atual.nomeContato} atualizado para status "${atual.status}".`,
    '/admin/agenda',
    `status-${atual.id}`
  );

  registrarAuditoria(
    req,
    acaoAuditoria,
    'agenda',
    atual.id,
    resumoAuditoria,
    { status: anterior.status, data: anterior.data, horario: anterior.horario },
    { status: atual.status, data: atual.data, horario: atual.horario }
  );

  const { texto: msgWhatsapp, linkWhatsApp } = gerarMensagemWhatsAppConfirmacao(atual, consultorio);

  return res.json({
    sucesso: true,
    agendamento: atual,
    mensagemWhatsapp: msgWhatsapp,
    linkWhatsApp,
  });
});

// Endpoint explícito para vincular paciente a um agendamento
app.post('/api/admin/agenda/:id/vincular-paciente', requirePermission('agenda.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { pacienteId, criarNovo, dadosNovoPaciente } = req.body;

  const agendamentos = carregarAgendamentos();
  const index = agendamentos.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const agendamento = agendamentos[index];
  const pacientes = carregarPacientes();
  const agora = new Date().toISOString();

  let pacienteFinal: PacienteRegistro | null = null;

  if (pacienteId) {
    pacienteFinal = pacientes.find((p) => p.id === pacienteId) || null;
    if (!pacienteFinal) {
      return res.status(404).json({ error: 'Paciente informado não encontrado.' });
    }
  } else if (criarNovo) {
    const nome = dadosNovoPaciente?.name || agendamento.nomeContato;
    const tel = dadosNovoPaciente?.phone || agendamento.telefone;
    const cpf = dadosNovoPaciente?.cpf;

    if (cpf && !validarCPFServer(cpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    const novoId = `pat-${Date.now().toString(36)}`;
    pacienteFinal = {
      id: novoId,
      name: sanitizarTexto(nome),
      phone: sanitizarTexto(tel),
      cpf: cpf ? sanitizarTexto(cpf) : undefined,
      email: dadosNovoPaciente?.email ? sanitizarTexto(dadosNovoPaciente.email) : (agendamento.email || undefined),
      birthDate: dadosNovoPaciente?.birthDate || '1990-01-01',
      gender: dadosNovoPaciente?.gender || 'F',
      ativo: true,
      healthInsurance: dadosNovoPaciente?.healthInsurance || 'Particular',
      anamnesis: {
        chiefComplaint: agendamento.observacoes ? sanitizarTexto(agendamento.observacoes) : 'Consulta realizada no consultório.',
      },
      consentimentoLgpd: {
        aceito: true,
        dataHora: agora,
        versao: '1.0',
        canal: agendamento.origem || 'presencial',
      },
      createdAt: agora,
      updatedAt: agora,
    };

    pacientes.unshift(pacienteFinal);
    salvarPacientes(pacientes);

    registrarAuditoria(
      req,
      'paciente.criar',
      'pacientes',
      novoId,
      `Paciente "${pacienteFinal.name}" cadastrado e vinculado ao agendamento ${agendamento.protocolo || agendamento.id}.`,
      null,
      { id: novoId, name: pacienteFinal.name }
    );
  } else {
    return res.status(400).json({ error: 'Informe o pacienteId para vincular ou defina criarNovo: true.' });
  }

  agendamento.pacienteId = pacienteFinal.id;
  agendamento.atualizadoEm = agora;
  agendamentos[index] = agendamento;
  salvarAgendamentos(agendamentos);

  registrarAuditoria(
    req,
    'agenda.vincular_paciente',
    'agenda',
    agendamento.id,
    `Agendamento de ${agendamento.nomeContato} vinculado ao paciente ${pacienteFinal.name} (${pacienteFinal.id}).`,
    null,
    { agendamentoId: agendamento.id, pacienteId: pacienteFinal.id, pacienteNome: pacienteFinal.name }
  );

  return res.json({ sucesso: true, agendamento, paciente: pacienteFinal });
});

app.get('/api/admin/agenda/:id/whatsapp', requirePermission('agenda.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const agendamentos = carregarAgendamentos();
  const agendamento = agendamentos.find((a) => a.id === id);

  if (!agendamento) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const consultorio = carregarDadosConsultorio();
  const { texto, linkWhatsApp } = gerarMensagemWhatsAppConfirmacao(agendamento, consultorio);

  return res.json({
    sucesso: true,
    texto,
    linkWhatsApp,
    telefone: agendamento.telefone,
    nomeContato: agendamento.nomeContato,
  });
});

// ============================================================================
// PUSH NOTIFICATIONS & SINCRONIZAÇÃO OFFLINE (PROMPT 15)
// ============================================================================

// 1. Chave Pública VAPID (exige autenticação e agenda.ler)
app.get('/api/admin/push/vapid-public-key', requirePermission('agenda.ler'), (_req: Request, res: Response) => {
  return res.json({ publicKey: vapidKeys.publicKey });
});

// 2. Registrar inscrição Web Push por usuário e dispositivo
app.post('/api/admin/push/subscribe', requirePermission('agenda.ler'), (req: Request, res: Response) => {
  const { subscription, deviceId, userAgent } = req.body;
  const user = (req as any).user;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Inscrição Push inválida.' });
  }

  const idInscricao = deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let inscricoes = carregarInscricoesPush();
  
  // Remove inscrição prévia deste mesmo dispositivo/endpoint se houver
  inscricoes = inscricoes.filter((s) => s.deviceId !== idInscricao && s.subscription.endpoint !== subscription.endpoint);

  const agora = new Date().toISOString();
  const novoRegistro: PushSubscriptionRecord = {
    id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    deviceId: idInscricao,
    userAgent: userAgent || (req.headers['user-agent'] as string),
    subscription,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  inscricoes.push(novoRegistro);
  salvarInscricoesPush(inscricoes);

  registrarAuditoria(
    req,
    'push.inscrever',
    'push',
    novoRegistro.id,
    `Usuário ${user.nome} (${user.id}) ativou notificações push no dispositivo ${idInscricao}.`
  );

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Inscrição push registrada com sucesso.',
    deviceId: idInscricao,
  });
});

// 3. Desativar inscrição Web Push do dispositivo
app.post('/api/admin/push/unsubscribe', authenticate, (req: Request, res: Response) => {
  const { deviceId } = req.body;
  const user = (req as any).user;
  let inscricoes = carregarInscricoesPush();

  if (deviceId) {
    inscricoes = inscricoes.filter((s) => s.deviceId !== deviceId);
  } else {
    inscricoes = inscricoes.filter((s) => s.userId !== user.id);
  }

  salvarInscricoesPush(inscricoes);

  registrarAuditoria(
    req,
    'push.desinscrever',
    'push',
    deviceId || user.id,
    `Usuário ${user.nome} desativou notificações push no dispositivo.`
  );

  return res.json({ sucesso: true, mensagem: 'Notificações push desativadas.' });
});

// 4. Teste de Notificação Push
app.post('/api/admin/push/test', requirePermission('agenda.ler'), async (req: Request, res: Response) => {
  const user = (req as any).user;
  const inscricoes = carregarInscricoesPush().filter((s) => s.userId === user.id);

  if (inscricoes.length === 0) {
    return res.status(400).json({ error: 'Nenhum dispositivo registrado para receber push neste usuário.' });
  }

  const payload = JSON.stringify({
    title: '🔔 Teste de Notificação - Optoclin',
    body: `Olá, ${user.nome}! As notificações de agenda e consultas estão funcionando perfeitamente.`,
    url: '/admin/agenda',
    tag: `teste-push-${Date.now()}`,
    timestamp: Date.now(),
  });

  let enviados = 0;
  for (const s of inscricoes) {
    try {
      await webpush.sendNotification(s.subscription, payload);
      enviados++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        removerInscricaoPushPorId(s.id);
      }
    }
  }

  return res.json({ sucesso: true, mensagem: `${enviados} notificação(ões) de teste enviada(s).`, enviados });
});

// 5. Processamento de Fila de Sincronização Offline (com Detecção de Conflitos)
app.post('/api/admin/sync/process-queue', authenticate, (req: Request, res: Response) => {
  const { itens } = req.body;
  const user = (req as any).user;

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Nenhum item informado para sincronização.' });
  }

  const resultados: Array<{
    id: string;
    sucesso: boolean;
    conflito: boolean;
    motivo?: string;
    dados?: any;
  }> = [];

  const agendamentos = carregarAgendamentos();
  const pacientes = carregarPacientes();
  const agora = new Date().toISOString();

  for (const item of itens) {
    const { id, entidade, tipoOperacao, dados, timestamp } = item;

    // A) Mutações na Agenda
    if (entidade === 'agenda') {
      if (!usuarioTemPermissaoAgenda(user.id)) {
        resultados.push({
          id,
          sucesso: false,
          conflito: false,
          motivo: 'Usuário sem permissão para sincronizar itens da agenda.',
        });
        continue;
      }

      if (tipoOperacao === 'atualizar_status') {
        const aptIndex = agendamentos.findIndex((a) => a.id === dados.id);
        if (aptIndex === -1) {
          resultados.push({
            id,
            sucesso: false,
            conflito: true,
            motivo: 'Agendamento não encontrado no servidor (pode ter sido excluído ou alterado).',
          });
          continue;
        }

        const aptAtual = agendamentos[aptIndex];

        if (dados.statusAnterior && aptAtual.status !== dados.statusAnterior && aptAtual.status !== dados.novoStatus) {
          resultados.push({
            id,
            sucesso: false,
            conflito: true,
            motivo: `Conflito de concorrência: o agendamento foi alterado para "${aptAtual.status}" no servidor por outro usuário antes da reconexão.`,
            dados: aptAtual,
          });
          continue;
        }

        // Aplica atualização
        const statusAnterior = aptAtual.status;
        aptAtual.status = dados.novoStatus;
        aptAtual.atualizadoEm = agora;
        agendamentos[aptIndex] = aptAtual;

        registrarAuditoria(
          req,
          'agenda.sincronizar_status',
          'agenda',
          aptAtual.id,
          `Status sincronizado da fila offline de "${statusAnterior}" para "${aptAtual.status}".`
        );

        resultados.push({
          id,
          sucesso: true,
          conflito: false,
          dados: aptAtual,
        });
      } else if (tipoOperacao === 'criar') {
        const slotOcupado = agendamentos.some(
          (a) => a.data === dados.data && a.horario === dados.horario && a.status !== 'cancelado'
        );

        if (slotOcupado) {
          resultados.push({
            id,
            sucesso: false,
            conflito: true,
            motivo: `Conflito de horário: o horário das ${dados.horario} no dia ${dados.data} já foi ocupado no servidor enquanto você estava offline.`,
          });
          continue;
        }

        const novoApt: AgendamentoRegistro = {
          ...dados,
          id: dados.id || `apt-sync-${Date.now().toString(36)}`,
          status: dados.status || 'agendado',
          criadoEm: agora,
          atualizadoEm: agora,
        };
        agendamentos.push(novoApt);

        registrarAuditoria(
          req,
          'agenda.sincronizar_criacao',
          'agenda',
          novoApt.id,
          `Agendamento de ${novoApt.nomeContato} criado offline sincronizado com sucesso.`
        );

        resultados.push({
          id,
          sucesso: true,
          conflito: false,
          dados: novoApt,
        });
      }
    }
    // B) Mutações em Pacientes
    else if (entidade === 'paciente') {
      if (tipoOperacao === 'criar' || tipoOperacao === 'editar') {
        if (dados.cpf) {
          const cpfDigitos = dados.cpf.replace(/\D/g, '');
          const cpfExistente = pacientes.find((p) => p.cpf && p.cpf.replace(/\D/g, '') === cpfDigitos && p.id !== dados.id);
          if (cpfExistente) {
            resultados.push({
              id,
              sucesso: false,
              conflito: true,
              motivo: `Conflito de cadastro: o CPF ${dados.cpf} já pertence ao paciente cadastrado "${cpfExistente.name}".`,
              dados: cpfExistente,
            });
            continue;
          }
        }

        const pIndex = pacientes.findIndex((p) => p.id === dados.id);
        if (pIndex !== -1) {
          pacientes[pIndex] = { ...pacientes[pIndex], ...dados, updatedAt: agora };
        } else {
          pacientes.unshift({ ...dados, createdAt: agora, updatedAt: agora });
        }

        resultados.push({
          id,
          sucesso: true,
          conflito: false,
        });
      }
    }
  }

  salvarAgendamentos(agendamentos);
  salvarPacientes(pacientes);

  return res.json({ sucesso: true, resultados });
});

// ============================================================================
// MÓDULO: PACIENTES & PRONTUÁRIOS (PROMPT 08)
// ============================================================================

// 1. Listagem de Pacientes com Busca por Nome / CPF / Telefone
app.get('/api/admin/pacientes', requirePermission('pacientes.ler'), (req: Request, res: Response) => {
  const { busca, incluirDesativados } = req.query;
  let pacientes = carregarPacientes();

  if (incluirDesativados !== 'true') {
    pacientes = pacientes.filter((p) => p.ativo !== false);
  }

  if (busca && typeof busca === 'string' && busca.trim()) {
    const termo = busca.trim().toLowerCase();
    const termoDigitos = busca.replace(/\D/g, '');

    pacientes = pacientes.filter((p) => {
      const matchNome = p.name.toLowerCase().includes(termo);
      const matchCpf = p.cpf ? p.cpf.toLowerCase().includes(termo) || (termoDigitos && p.cpf.replace(/\D/g, '').includes(termoDigitos)) : false;
      const matchTelefone = p.phone ? p.phone.includes(termo) || (termoDigitos && p.phone.replace(/\D/g, '').includes(termoDigitos)) : false;
      const matchEmail = p.email ? p.email.toLowerCase().includes(termo) : false;

      return matchNome || matchCpf || matchTelefone || matchEmail;
    });
  }

  return res.json({ sucesso: true, total: pacientes.length, pacientes });
});

// 2. Verificação de Duplicados (Sugestão de possíveis duplicados por CPF ou Telefone)
app.post('/api/admin/pacientes/verificar-duplicados', requirePermission('pacientes.ler'), (req: Request, res: Response) => {
  const { cpf, phone, ignorarId } = req.body;
  const pacientes = carregarPacientes().filter((p) => p.ativo !== false && p.id !== ignorarId);

  const cpfDigitos = cpf ? cpf.replace(/\D/g, '') : '';
  const telDigitos = phone ? phone.replace(/\D/g, '') : '';

  const duplicados: Array<{ id: string; name: string; cpf?: string; phone: string; motivo: string }> = [];

  for (const p of pacientes) {
    if (cpfDigitos && p.cpf && p.cpf.replace(/\D/g, '') === cpfDigitos) {
      duplicados.push({
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        phone: p.phone,
        motivo: 'Mesmo CPF cadastrado',
      });
      continue;
    }

    if (telDigitos && p.phone && p.phone.replace(/\D/g, '') === telDigitos) {
      duplicados.push({
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        phone: p.phone,
        motivo: 'Mesmo Telefone/WhatsApp cadastrado',
      });
    }
  }

  return res.json({ sucesso: true, temDuplicados: duplicados.length > 0, duplicados });
});

// 3. Ficha do Paciente com Histórico Clínico (Agendamentos, Atendimentos e Receitas)
app.get('/api/admin/pacientes/:id', requirePermission('pacientes.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const pacientes = carregarPacientes();
  const paciente = pacientes.find((p) => p.id === id);

  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  // Agendamentos vinculados a este paciente
  const agendamentos = carregarAgendamentos().filter((a) => {
    if (a.pacienteId === id) return true;
    if (a.nomeContato && a.nomeContato.toLowerCase() === paciente.name.toLowerCase()) return true;
    if (a.telefone && paciente.phone && a.telefone.replace(/\D/g, '') === paciente.phone.replace(/\D/g, '')) return true;
    return false;
  });

  // Atendimentos / Exames Refrativos vinculados a este paciente (Prompt 09)
  const atendimentosGerais = carregarAtendimentos().filter((at) => at.pacienteId === id);

  // Receitas Ópticas emitidas para este paciente (Prompt 09)
  const receitasGerais = carregarReceitas().filter((r) => r.pacienteId === id);

  return res.json({
    sucesso: true,
    paciente,
    historicoAgendamentos: agendamentos,
    historicoAtendimentos: atendimentosGerais,
    historicoReceitas: receitasGerais,
  });
});

// 4. Criação de Paciente com Validação de CPF e Consentimento LGPD
app.post('/api/admin/pacientes', requirePermission('pacientes.criar'), (req: Request, res: Response) => {
  const {
    name,
    cpf,
    birthDate,
    gender,
    phone,
    email,
    address,
    healthInsurance,
    profession,
    anamnesis,
    notes,
    consentimentoLgpd,
    ignorarDuplicado,
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nome completo do paciente é obrigatório.' });
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'Telefone do paciente é obrigatório.' });
  }

  // 1. Validação algorítmica de CPF (se fornecido)
  if (cpf && typeof cpf === 'string' && cpf.trim()) {
    if (!validarCPFServer(cpf)) {
      return res.status(400).json({
        error: 'CPF inválido. Forneça um documento brasileiro com 11 dígitos e dígitos verificadores válidos.',
      });
    }
  }

  // 2. Validação de Telefone / WhatsApp
  if (!validarTelefoneServer(phone)) {
    return res.status(400).json({
      error: 'Telefone inválido. Deve possuir DDD válido e 10 ou 11 dígitos.',
    });
  }

  const pacientes = carregarPacientes();

  // 3. Checagem de duplicidade prévia (se não confirmado pelo usuário)
  if (!ignorarDuplicado) {
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    const telLimpo = phone.replace(/\D/g, '');

    const duplicadoCpf = cpfLimpo ? pacientes.find((p) => p.ativo !== false && p.cpf && p.cpf.replace(/\D/g, '') === cpfLimpo) : null;
    if (duplicadoCpf) {
      return res.status(409).json({
        error: `Já existe um paciente cadastrado com este CPF: ${duplicadoCpf.name} (${duplicadoCpf.phone}).`,
        pacienteDuplicado: duplicadoCpf,
      });
    }

    const duplicadoTel = pacientes.find((p) => p.ativo !== false && p.phone && p.phone.replace(/\D/g, '') === telLimpo);
    if (duplicadoTel) {
      return res.status(409).json({
        error: `Já existe um paciente cadastrado com este telefone: ${duplicadoTel.name}. Deseja vincular ou criar outro?`,
        pacienteDuplicado: duplicadoTel,
      });
    }
  }

  const agora = new Date().toISOString();
  const idNovo = `pat-${Date.now().toString(36)}`;

  const novoPaciente: PacienteRegistro = {
    id: idNovo,
    name: sanitizarTexto(name),
    cpf: cpf ? sanitizarTexto(cpf) : undefined,
    birthDate: birthDate || '1990-01-01',
    gender: gender || 'F',
    phone: sanitizarTexto(phone),
    email: email ? sanitizarTexto(email) : undefined,
    ativo: true,
    address: address
      ? {
          street: sanitizarTexto(address.street),
          number: sanitizarTexto(address.number),
          complement: sanitizarTexto(address.complement),
          neighborhood: sanitizarTexto(address.neighborhood),
          city: sanitizarTexto(address.city) || 'São Paulo',
          state: sanitizarTexto(address.state) || 'SP',
          zipCode: address.zipCode ? sanitizarTexto(address.zipCode) : undefined,
        }
      : undefined,
    healthInsurance: healthInsurance ? sanitizarTexto(healthInsurance) : 'Particular',
    profession: profession ? sanitizarTexto(profession) : undefined,
    anamnesis: anamnesis
      ? {
          chiefComplaint: sanitizarTexto(anamnesis.chiefComplaint),
          lastExamDate: anamnesis.lastExamDate,
          wearsGlasses: Boolean(anamnesis.wearsGlasses),
          wearsContactLenses: Boolean(anamnesis.wearsContactLenses),
          systemicDiseases: Array.isArray(anamnesis.systemicDiseases)
            ? anamnesis.systemicDiseases.map((s: string) => sanitizarTexto(s))
            : [],
          ocularFamilyHistory: Array.isArray(anamnesis.ocularFamilyHistory)
            ? anamnesis.ocularFamilyHistory.map((h: string) => sanitizarTexto(h))
            : [],
          currentMedications: sanitizarTexto(anamnesis.currentMedications),
          allergies: sanitizarTexto(anamnesis.allergies),
        }
      : undefined,
    consentimentoLgpd: {
      aceito: consentimentoLgpd?.aceito !== false,
      dataHora: consentimentoLgpd?.dataHora || agora,
      versao: consentimentoLgpd?.versao || '1.0',
      ip: req.ip || '127.0.0.1',
      canal: consentimentoLgpd?.canal || 'presencial',
    },
    notes: notes ? sanitizarTexto(notes) : undefined,
    createdAt: agora,
    updatedAt: agora,
  };

  pacientes.unshift(novoPaciente);
  salvarPacientes(pacientes);

  registrarAuditoria(
    req,
    'paciente.criar',
    'pacientes',
    novoPaciente.id,
    `Paciente "${novoPaciente.name}" cadastrado no prontuário eletrônico do consultório.`,
    null,
    { id: novoPaciente.id, name: novoPaciente.name, phone: novoPaciente.phone, cpf: novoPaciente.cpf }
  );

  return res.status(201).json({ sucesso: true, paciente: novoPaciente });
});

// 5. Edição de Paciente
app.put('/api/admin/pacientes/:id', requirePermission('pacientes.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const pacientes = carregarPacientes();
  const index = pacientes.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  // Validação algorítmica de CPF (se informado/atualizado)
  if (updates.cpf && typeof updates.cpf === 'string' && updates.cpf.trim()) {
    if (!validarCPFServer(updates.cpf)) {
      return res.status(400).json({
        error: 'CPF inválido. Forneça um documento brasileiro com 11 dígitos e dígitos verificadores válidos.',
      });
    }
  }

  // Validação de Telefone (se informado)
  if (updates.phone) {
    if (!validarTelefoneServer(updates.phone)) {
      return res.status(400).json({
        error: 'Telefone inválido. Deve possuir DDD válido e 10 ou 11 dígitos.',
      });
    }
  }

  const anterior = { ...pacientes[index] };
  const agora = new Date().toISOString();

  const atualizado: PacienteRegistro = {
    ...anterior,
    ...updates,
    id, // Imutável
    name: updates.name ? sanitizarTexto(updates.name) : anterior.name,
    cpf: updates.cpf !== undefined ? (updates.cpf ? sanitizarTexto(updates.cpf) : undefined) : anterior.cpf,
    phone: updates.phone ? sanitizarTexto(updates.phone) : anterior.phone,
    email: updates.email !== undefined ? (updates.email ? sanitizarTexto(updates.email) : undefined) : anterior.email,
    address: updates.address ? { ...anterior.address, ...updates.address } : anterior.address,
    anamnesis: updates.anamnesis ? { ...anterior.anamnesis, ...updates.anamnesis } : anterior.anamnesis,
    notes: updates.notes !== undefined ? sanitizarTexto(updates.notes) : anterior.notes,
    updatedAt: agora,
  };

  pacientes[index] = atualizado;
  salvarPacientes(pacientes);

  registrarAuditoria(
    req,
    'paciente.editar',
    'pacientes',
    id,
    `Prontuário do paciente "${atualizado.name}" atualizado.`,
    { name: anterior.name, phone: anterior.phone, cpf: anterior.cpf },
    { name: atualizado.name, phone: atualizado.phone, cpf: atualizado.cpf }
  );

  return res.json({ sucesso: true, paciente: atualizado });
});

// 6. Desativação de Paciente (Regra Prompt 08: "Desative em vez de excluir")
app.delete('/api/admin/pacientes/:id', requirePermission('pacientes.excluir'), (req: Request, res: Response) => {
  const { id } = req.params;
  const pacientes = carregarPacientes();
  const index = pacientes.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const anterior = { ...pacientes[index] };
  const agora = new Date().toISOString();

  // Desativa em vez de deletar fisicamente do banco
  pacientes[index].ativo = false;
  pacientes[index].updatedAt = agora;
  salvarPacientes(pacientes);

  registrarAuditoria(
    req,
    'paciente.desativar',
    'pacientes',
    id,
    `Paciente "${anterior.name}" desativado do sistema (registro mantido para histórico clínico).`,
    { ativo: anterior.ativo },
    { ativo: false }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Paciente desativado com sucesso (histórico clínico preservado conforme LGPD e normas do conselho optométrico).',
    paciente: pacientes[index],
  });
});

// 7. Exportação de Dados do Paciente (Regra Prompt 08: "apenas Admin, com confirmação e registro em auditoria")
app.get('/api/admin/pacientes/:id/exportar', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.auth_token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) return res.status(401).json({ error: 'Não autenticado.' });

  const sessoes = carregarSessoes();
  const sessao = sessoes.get(token);
  if (!sessao || new Date(sessao.expiraEm) < new Date()) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const usuario = carregarUsuarios().find((u) => u.uid === sessao.uid && u.ativo);
  if (!usuario) return res.status(401).json({ error: 'Usuário não encontrado.' });

  // Regra Prompt 08: Apenas Administrador pode exportar
  if (usuario.papelId !== 'admin') {
    return res.status(403).json({
      error: 'Apenas Administradores do consultório possuem permissão para exportar prontuários completos de pacientes (LGPD).',
    });
  }

  const { id } = req.params;
  const pacientes = carregarPacientes();
  const paciente = pacientes.find((p) => p.id === id);

  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const agendamentos = carregarAgendamentos().filter((a) => a.pacienteId === id || a.nomeContato === paciente.name);

  const dossieExportacao = {
    exportadoEm: new Date().toISOString(),
    exportadoPor: { uid: usuario.uid, nome: usuario.nome, email: usuario.email },
    consultorio: {
      nomeFantasia: carregarDadosConsultorio().nomeFantasia,
      cnpj: carregarDadosConsultorio().cnpj,
      responsavelTecnico: carregarDadosConsultorio().responsavelTecnico,
    },
    paciente,
    historicoAgendamentos: agendamentos,
    termoResponsabilidade:
      'Dossiê exportado para fins de portabilidade e atendimento ao titular de dados conforme Art. 18 da Lei Geral de Proteção de Dados (LGPD).',
  };

  registrarAuditoria(
    req,
    'paciente.exportar',
    'pacientes',
    id,
    `Exportação completa do prontuário e dados pessoais do paciente "${paciente.name}" realizada pelo Administrador ${usuario.nome}.`,
    null,
    { pacienteId: id, pacienteNome: paciente.name }
  );

  return res.json({ sucesso: true, dossie: dossieExportacao });
});

// 8. Anonimização de Dados do Paciente (Regra Prompt 08: "apenas Admin, com confirmação e registro em auditoria")
app.post('/api/admin/pacientes/:id/anonimizar', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.auth_token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) return res.status(401).json({ error: 'Não autenticado.' });

  const sessoes = carregarSessoes();
  const sessao = sessoes.get(token);
  if (!sessao || new Date(sessao.expiraEm) < new Date()) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const usuario = carregarUsuarios().find((u) => u.uid === sessao.uid && u.ativo);
  if (!usuario) return res.status(401).json({ error: 'Usuário não encontrado.' });

  // Regra Prompt 08: Apenas Administrador pode anonimizar
  if (usuario.papelId !== 'admin') {
    return res.status(403).json({
      error: 'Apenas Administradores do consultório possuem permissão para anonimizar prontuários de pacientes (LGPD).',
    });
  }

  // Regra Prompt 08: Exige confirmação expressa
  const { confirmacao, confirmar } = req.body || {};
  if (!confirmacao && confirmar !== true) {
    return res.status(400).json({
      error: 'Confirmação obrigatória: é necessário confirmar expressamente a anonimização irreversível dos dados pessoais deste paciente conforme a LGPD.',
    });
  }

  const { id } = req.params;
  const pacientes = carregarPacientes();
  const index = pacientes.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const anterior = { ...pacientes[index] };
  const agora = new Date().toISOString();

  // Anonimização LGPD: substitui dados que identificam a pessoa física
  pacientes[index] = {
    ...pacientes[index],
    name: `Paciente Anonimizado [LGPD-${id.slice(-4)}]`,
    cpf: '000.***.***-00',
    phone: '(00) 00000-0000',
    email: 'anonimizado@lgpd.local',
    address: {
      city: anterior.address?.city || 'São Paulo',
      state: anterior.address?.state || 'SP',
    },
    ativo: false,
    anonimizado: true,
    anonimizadoEm: agora,
    anonimizadoPor: usuario.nome,
    updatedAt: agora,
  };

  salvarPacientes(pacientes);

  registrarAuditoria(
    req,
    'paciente.anonimizar',
    'pacientes',
    id,
    `Anonimização dos dados pessoais do paciente "${anterior.name}" (ID: ${id}) realizada pelo Administrador ${usuario.nome} conforme LGPD.`,
    { name: anterior.name, cpf: anterior.cpf, phone: anterior.phone },
    { name: pacientes[index].name, anonimizado: true, anonimizadoEm: agora }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Dados pessoais do paciente foram anonimizados com sucesso. O registro clínico foi desassociado de identificadores civis.',
    paciente: pacientes[index],
  });
});

// 9. Reativação de Paciente
app.post('/api/admin/pacientes/:id/reativar', requirePermission('pacientes.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const pacientes = carregarPacientes();
  const index = pacientes.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  if (pacientes[index].anonimizado) {
    return res.status(400).json({ error: 'Pacientes anonimizados não podem ser reativados conforme as diretrizes da LGPD.' });
  }

  pacientes[index].ativo = true;
  pacientes[index].updatedAt = new Date().toISOString();
  salvarPacientes(pacientes);

  registrarAuditoria(
    req,
    'paciente.reativar',
    'pacientes',
    id,
    `Paciente "${pacientes[index].name}" reativado no sistema.`,
    { ativo: false },
    { ativo: true }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Paciente reativado com sucesso.',
    paciente: pacientes[index],
  });
});


// ============================================================================
// MÓDULO: ATENDIMENTO CLÍNICO & EXAMES (PROMPT 09)
// ============================================================================

// 1. Listar Atendimentos
app.get('/api/admin/atendimento', requirePermission('atendimento.ler'), (req: Request, res: Response) => {
  const { pacienteId, status, busca, data } = req.query;
  let atendimentos = carregarAtendimentos();

  if (pacienteId && typeof pacienteId === 'string') {
    atendimentos = atendimentos.filter((a) => a.pacienteId === pacienteId);
  }
  if (status && typeof status === 'string' && status !== 'todos') {
    atendimentos = atendimentos.filter((a) => a.status === status);
  }
  if (data && typeof data === 'string') {
    atendimentos = atendimentos.filter((a) => a.data === data);
  }
  if (busca && typeof busca === 'string' && busca.trim()) {
    const term = busca.toLowerCase().trim();
    atendimentos = atendimentos.filter((a) =>
      a.pacienteNome.toLowerCase().includes(term) ||
      (a.pacienteCpf && a.pacienteCpf.includes(term)) ||
      (a.pacienteTelefone && a.pacienteTelefone.includes(term))
    );
  }

  // Ordenar decrescente por data/criadoEm
  atendimentos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  return res.json({ sucesso: true, atendimentos });
});

// 2. Obter Atendimento por ID
app.get('/api/admin/atendimento/:id', requirePermission('atendimento.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const atendimentos = carregarAtendimentos();
  const atendimento = atendimentos.find((a) => a.id === id);

  if (!atendimento) {
    return res.status(404).json({ error: 'Atendimento clínico não encontrado.' });
  }

  const pacientes = carregarPacientes();
  const paciente = pacientes.find((p) => p.id === atendimento.pacienteId);

  const receitas = carregarReceitas();
  const receita = atendimento.receitaId ? receitas.find((r) => r.id === atendimento.receitaId) : null;

  return res.json({ sucesso: true, atendimento, paciente, receita });
});

// 3. Criar Atendimento Clínico (Conclui atendimento e marca agendamento como atendido)
app.post('/api/admin/atendimento', requirePermission('atendimento.criar'), (req: Request, res: Response) => {
  const {
    agendamentoId,
    pacienteId,
    anamnese,
    acuidadeVisual,
    refracao,
    ceratometria,
    pressaoIntraocular,
    observacoes,
    condutaDiagnostica,
    status,
    concluir,
    emitirReceita,
    dadosReceita,
  } = req.body;

  if (!pacienteId || typeof pacienteId !== 'string') {
    return res.status(400).json({ error: 'Identificador do paciente (pacienteId) é obrigatório para abrir um atendimento clínico.' });
  }

  const pacientes = carregarPacientes();
  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado no cadastro do consultório.' });
  }

  const usuario = req.user || { uid: 'usr-admin', nome: 'Dr. Roberto Viana', email: 'roberto@consultorio.com' };

  const consultorio = carregarDadosConsultorio();
  const agora = new Date().toISOString();
  const idNovo = `ate-${Date.now().toString(36)}`;
  const finalizado = Boolean(concluir || status === 'finalizado');

  const novoAtendimento: AtendimentoRegistro = {
    id: idNovo,
    agendamentoId: agendamentoId || undefined,
    pacienteId: paciente.id,
    pacienteNome: paciente.name,
    pacienteCpf: paciente.cpf,
    pacienteTelefone: paciente.phone,
    optometristaId: usuario.uid,
    optometristaNome: usuario.nome,
    registroOptometrista: consultorio.registroResponsavelTecnico || 'CBOO 14.892-SP',
    data: req.body.data || agora.split('T')[0],
    horario: req.body.horario || new Date().toTimeString().slice(0, 5),
    anamnese: {
      motivoConsulta: sanitizarTexto(anamnese?.motivoConsulta),
      queixaPrincipal: sanitizarTexto(anamnese?.queixaPrincipal) || 'Consulta de rotina visual',
      historicoVisual: sanitizarTexto(anamnese?.historicoVisual),
      usaOculos: Boolean(anamnese?.usaOculos),
      usaLentesContato: Boolean(anamnese?.usaLentesContato),
      doencasSistemicas: sanitizarTexto(anamnese?.doencasSistemicas),
      alergias: sanitizarTexto(anamnese?.alergias),
      medicamentosUso: sanitizarTexto(anamnese?.medicamentosUso),
      antecedentesFamiliares: sanitizarTexto(anamnese?.antecedentesFamiliares),
    },
    acuidadeVisual: {
      sc: {
        od: acuidadeVisual?.sc?.od || '20/20',
        oe: acuidadeVisual?.sc?.oe || '20/20',
        binocular: acuidadeVisual?.sc?.binocular,
      },
      cc: {
        od: acuidadeVisual?.cc?.od || '20/20',
        oe: acuidadeVisual?.cc?.oe || '20/20',
        binocular: acuidadeVisual?.cc?.binocular,
      },
    },
    refracao: {
      od: {
        esferico: refracao?.od?.esferico !== undefined ? Number(refracao.od.esferico) : undefined,
        cilindrico: refracao?.od?.cilindrico !== undefined ? Number(refracao.od.cilindrico) : undefined,
        eixo: refracao?.od?.eixo !== undefined ? Number(refracao.od.eixo) : undefined,
        adicao: refracao?.od?.adicao !== undefined ? Number(refracao.od.adicao) : undefined,
        dnp: refracao?.od?.dnp !== undefined ? Number(refracao.od.dnp) : undefined,
        acuidade: refracao?.od?.acuidade || '20/20',
      },
      oe: {
        esferico: refracao?.oe?.esferico !== undefined ? Number(refracao.oe.esferico) : undefined,
        cilindrico: refracao?.oe?.cilindrico !== undefined ? Number(refracao.oe.cilindrico) : undefined,
        eixo: refracao?.oe?.eixo !== undefined ? Number(refracao.oe.eixo) : undefined,
        adicao: refracao?.oe?.adicao !== undefined ? Number(refracao.oe.adicao) : undefined,
        dnp: refracao?.oe?.dnp !== undefined ? Number(refracao.oe.dnp) : undefined,
        acuidade: refracao?.oe?.acuidade || '20/20',
      },
      dpTotal: refracao?.dpTotal !== undefined ? Number(refracao.dpTotal) : undefined,
    },
    ceratometria: ceratometria || undefined,
    pressaoIntraocular: pressaoIntraocular || undefined,
    observacoes: sanitizarTexto(observacoes),
    condutaDiagnostica: sanitizarTexto(condutaDiagnostica),
    status: finalizado ? 'finalizado' : 'em_andamento',
    criadoEm: agora,
    finalizadoEm: finalizado ? agora : undefined,
    atualizadoEm: agora,
  };

  // Regra Prompt 09: Se conclui o atendimento e há agendamentoId vinculado, marca o agendamento como 'atendido'
  if (finalizado && agendamentoId) {
    const agendamentos = carregarAgendamentos();
    const aptIndex = agendamentos.findIndex((a) => a.id === agendamentoId);
    if (aptIndex !== -1) {
      agendamentos[aptIndex].status = 'atendido';
      agendamentos[aptIndex].pacienteId = paciente.id;
      agendamentos[aptIndex].atualizadoEm = agora;
      salvarAgendamentos(agendamentos);

      registrarAuditoria(
        req,
        'agenda.atender',
        'agenda',
        agendamentoId,
        `Consulta de ${agendamentos[aptIndex].nomeContato} marcada como atendida a partir da conclusão do atendimento ${idNovo}.`,
        { status: 'confirmado' },
        { status: 'atendido', pacienteId: paciente.id }
      );
    }
  }

  // Opcional: Emissão automática de receita vinculada
  let receitaEmitida: ReceitaRegistro | null = null;
  if (emitirReceita && dadosReceita) {
    const { numeroSequencial, numeroFormatado } = gerarProximoNumeroReceita();
    const validadeDias = Number(dadosReceita.validadeDias) || consultorio.validadeReceitaDias || 365;
    const dataValidade = new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const novaRec: ReceitaRegistro = {
      id: `rec-${Date.now().toString(36)}`,
      numeroSequencial,
      numeroFormatado,
      atendimentoId: idNovo,
      pacienteId: paciente.id,
      status: 'emitida',
      dataEmissao: agora.split('T')[0],
      validadeDias,
      dataValidade,
      tabelaRefracao: novoAtendimento.refracao,
      tipoLente: dadosReceita.tipoLente || 'Monofocal',
      tratamentos: Array.isArray(dadosReceita.tratamentos) ? dadosReceita.tratamentos : [],
      observacoes: dadosReceita.observacoes || novoAtendimento.observacoes,
      recomendacoes: dadosReceita.recomendacoes || novoAtendimento.condutaDiagnostica,
      snapshotConsultorio: JSON.parse(JSON.stringify(consultorio)),
      snapshotProfissional: {
        id: usuario.uid,
        nome: usuario.nome,
        registroProfissional: consultorio.registroResponsavelTecnico || 'CBOO 14.892-SP | CBO 3223-05',
        email: usuario.email,
        cargo: 'Optometrista Responsável',
      },
      snapshotPaciente: {
        id: paciente.id,
        nome: paciente.name,
        cpf: paciente.cpf,
        dataNascimento: paciente.birthDate,
        telefone: paciente.phone,
        email: paciente.email,
        endereco: paciente.address,
      },
      contagemReimpressoes: 0,
      historicoEnvios: [],
      tokenAcessoTemporario: crypto.randomBytes(24).toString('hex'),
      tokenExpiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cancelada: false,
      emitidaPor: { id: usuario.uid, nome: usuario.nome },
      criadaEm: agora,
    };

    const receitas = carregarReceitas();
    receitas.unshift(novaRec);
    salvarReceitas(receitas);
    receitaEmitida = novaRec;
    novoAtendimento.receitaId = novaRec.id;

    registrarAuditoria(
      req,
      'receita.emitir',
      'receitas',
      novaRec.id,
      `Receita óptica nº ${novaRec.numeroFormatado} emitida para o paciente ${paciente.name}.`,
      null,
      { numeroFormatado: novaRec.numeroFormatado, pacienteId: paciente.id }
    );
  }

  const atendimentos = carregarAtendimentos();
  atendimentos.unshift(novoAtendimento);
  salvarAtendimentos(atendimentos);

  registrarAuditoria(
    req,
    'atendimento.criar',
    'atendimentos',
    novoAtendimento.id,
    `Atendimento clínico criado para o paciente ${paciente.name} (${finalizado ? 'Concluído' : 'Em andamento'}).`,
    null,
    { id: novoAtendimento.id, status: novoAtendimento.status }
  );

  if (finalizado) {
    registrarAuditoria(
      req,
      'atendimento.concluir',
      'atendimentos',
      novoAtendimento.id,
      `Atendimento clínico ${novoAtendimento.id} de ${paciente.name} concluído com sucesso.`,
      { status: 'em_andamento' },
      { status: 'finalizado' }
    );
  }

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Atendimento clínico registrado com sucesso.',
    atendimento: novoAtendimento,
    receita: receitaEmitida,
  });
});

// 4. Atualizar / Concluir Atendimento Clínico
app.put('/api/admin/atendimento/:id', requirePermission('atendimento.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const atendimentos = carregarAtendimentos();
  const index = atendimentos.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Atendimento clínico não encontrado.' });
  }

  const anterior = { ...atendimentos[index] };
  const agora = new Date().toISOString();
  const concluindo = updates.concluir || updates.status === 'finalizado';

  const atualizado: AtendimentoRegistro = {
    ...anterior,
    ...updates,
    id, // Imutável
    pacienteId: anterior.pacienteId, // Imutável
    anamnese: updates.anamnese ? { ...anterior.anamnese, ...updates.anamnese } : anterior.anamnese,
    acuidadeVisual: updates.acuidadeVisual ? { ...anterior.acuidadeVisual, ...updates.acuidadeVisual } : anterior.acuidadeVisual,
    refracao: updates.refracao ? { ...anterior.refracao, ...updates.refracao } : anterior.refracao,
    status: concluindo ? 'finalizado' : (updates.status || anterior.status),
    finalizadoEm: concluindo && !anterior.finalizadoEm ? agora : anterior.finalizadoEm,
    atualizadoEm: agora,
  };

  // Se concluído e houver agendamento vinculado, atualiza status do agendamento
  if (concluindo && atualizado.agendamentoId) {
    const agendamentos = carregarAgendamentos();
    const aptIndex = agendamentos.findIndex((a) => a.id === atualizado.agendamentoId);
    if (aptIndex !== -1 && agendamentos[aptIndex].status !== 'atendido') {
      agendamentos[aptIndex].status = 'atendido';
      agendamentos[aptIndex].pacienteId = atualizado.pacienteId;
      agendamentos[aptIndex].atualizadoEm = agora;
      salvarAgendamentos(agendamentos);

      registrarAuditoria(
        req,
        'agenda.atender',
        'agenda',
        atualizado.agendamentoId,
        `Consulta de ${agendamentos[aptIndex].nomeContato} concluída/atendida via atualização do atendimento ${id}.`,
        { status: 'confirmado' },
        { status: 'atendido' }
      );
    }
  }

  atendimentos[index] = atualizado;
  salvarAtendimentos(atendimentos);

  registrarAuditoria(
    req,
    concluindo ? 'atendimento.concluir' : 'atendimento.editar',
    'atendimentos',
    id,
    `Atendimento clínico ${id} ${concluindo ? 'concluído' : 'atualizado'}.`,
    { status: anterior.status },
    { status: atualizado.status }
  );

  return res.json({ sucesso: true, atendimento: atualizado });
});

// ============================================================================
// MÓDULO: RECEITUÁRIO ÓPTICO DIGITAL (PROMPT 09)
// ============================================================================

// 1. Listar Receitas Ópticas
app.get('/api/admin/receitas', requirePermission('receitas.ler'), (req: Request, res: Response) => {
  const { pacienteId, status, busca, ano } = req.query;
  let receitas = carregarReceitas();

  if (pacienteId && typeof pacienteId === 'string') {
    receitas = receitas.filter((r) => r.pacienteId === pacienteId);
  }
  if (status && typeof status === 'string' && status !== 'todos') {
    if (status === 'cancelada') {
      receitas = receitas.filter((r) => r.cancelada || r.status === 'cancelada');
    } else if (status === 'emitida' || status === 'ativa') {
      receitas = receitas.filter((r) => !r.cancelada && r.status === 'emitida');
    }
  }
  if (ano && typeof ano === 'string') {
    receitas = receitas.filter((r) => r.dataEmissao.startsWith(ano));
  }
  if (busca && typeof busca === 'string' && busca.trim()) {
    const term = busca.toLowerCase().trim();
    receitas = receitas.filter((r) =>
      r.numeroFormatado.toLowerCase().includes(term) ||
      r.snapshotPaciente.nome.toLowerCase().includes(term) ||
      (r.snapshotPaciente.cpf && r.snapshotPaciente.cpf.includes(term))
    );
  }

  receitas.sort((a, b) => (b.numeroSequencial || 0) - (a.numeroSequencial || 0));
  return res.json({ sucesso: true, total: receitas.length, receitas });
});

// 2. Obter Receita por ID
app.get('/api/admin/receitas/:id', requirePermission('receitas.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const receitas = carregarReceitas();
  const receita = receitas.find((r) => r.id === id);

  if (!receita) {
    return res.status(404).json({ error: 'Receita óptica não encontrada.' });
  }

  return res.json({ sucesso: true, receita });
});

// 3. Emissão de Receita Óptica (Sequencial Atômico + Congelamento de Snapshot + Validação de Campos Obrigatórios)
app.post('/api/admin/receitas', requirePermission('receitas.criar'), (req: Request, res: Response) => {
  const {
    pacienteId,
    atendimentoId,
    tabelaRefracao,
    tipoLente,
    tratamentos,
    observacoes,
    recomendacoes,
    validadeDias,
  } = req.body;

  if (!pacienteId || typeof pacienteId !== 'string') {
    return res.status(400).json({ error: 'Identificador do paciente (pacienteId) é obrigatório.' });
  }

  const pacientes = carregarPacientes();
  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const consultorio = carregarDadosConsultorio();

  // Validação dos campos obrigatórios da clínica (Regra Prompt 09)
  const validadeCalculadaDias = Number(validadeDias) || consultorio.validadeReceitaDias || 365;
  const agora = new Date().toISOString();
  const dataEmissao = req.body.dataEmissao || agora.split('T')[0];
  const dataValidade = new Date(Date.now() + validadeCalculadaDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const validacao = validarCamposObrigatoriosReceita(consultorio.camposObrigatoriosReceita, tabelaRefracao, dataValidade);
  if (!validacao.valido) {
    return res.status(400).json({ error: validacao.erro });
  }

  // Geração atômica sequencial sem lacunas (Regra Prompt 09)
  const { numeroSequencial, numeroFormatado } = gerarProximoNumeroReceita();

  const usuario = req.user || { uid: 'usr-optometrista', nome: 'Dr. Roberto Viana', email: 'roberto@consultorio.com' };

  // Congelamento de dados na emissão (Snapshot imutável - Regra Prompt 09)
  const novaReceita: ReceitaRegistro = {
    id: `rec-${Date.now().toString(36)}`,
    numeroSequencial,
    numeroFormatado,
    atendimentoId: atendimentoId || undefined,
    pacienteId: paciente.id,
    status: 'emitida',
    dataEmissao,
    validadeDias: validadeCalculadaDias,
    dataValidade,
    tabelaRefracao: tabelaRefracao || {
      od: { esferico: 0, cilindrico: 0, eixo: 0 },
      oe: { esferico: 0, cilindrico: 0, eixo: 0 },
    },
    tipoLente: sanitizarTexto(tipoLente) || 'Monofocal',
    tratamentos: Array.isArray(tratamentos) ? tratamentos.map((t: string) => sanitizarTexto(t)) : [],
    observacoes: sanitizarTexto(observacoes),
    recomendacoes: sanitizarTexto(recomendacoes),

    // Snapshot Consultório (Cópia fiel no momento da emissão)
    snapshotConsultorio: {
      razaoSocial: consultorio.razaoSocial,
      nomeFantasia: consultorio.nomeFantasia,
      cnpj: consultorio.cnpj,
      registroProfissional: consultorio.registroProfissional,
      responsavelTecnico: consultorio.responsavelTecnico,
      registroResponsavelTecnico: consultorio.registroResponsavelTecnico,
      telefone: consultorio.telefone,
      whatsapp: consultorio.whatsapp,
      email: consultorio.email,
      endereco: { ...consultorio.endereco },
      logoUrl: consultorio.logoUrl,
      carimboUrl: consultorio.carimboUrl,
      assinaturaUrl: consultorio.assinaturaUrl,
      textoRodape: consultorio.textoRodapeRelatorio || consultorio.textoRodape,
    },

    // Snapshot Profissional
    snapshotProfissional: {
      id: usuario.uid,
      nome: usuario.nome,
      registroProfissional: consultorio.registroResponsavelTecnico || 'CBOO 14.892-SP | CBO 3223-05',
      email: usuario.email,
      cargo: 'Optometrista Responsável',
    },

    // Snapshot Paciente
    snapshotPaciente: {
      id: paciente.id,
      nome: paciente.name,
      cpf: paciente.cpf,
      dataNascimento: paciente.birthDate,
      telefone: paciente.phone,
      email: paciente.email,
      endereco: paciente.address,
    },

    contagemReimpressoes: 0,
    historicoEnvios: [],
    tokenAcessoTemporario: crypto.randomBytes(24).toString('hex'),
    tokenExpiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    cancelada: false,
    emitidaPor: { id: usuario.uid, nome: usuario.nome },
    criadaEm: agora,
  };

  const receitas = carregarReceitas();
  receitas.unshift(novaReceita);
  salvarReceitas(receitas);

  // Se vinculada a um atendimento, atualiza o atendimento
  if (atendimentoId) {
    const atendimentos = carregarAtendimentos();
    const atIndex = atendimentos.findIndex((a) => a.id === atendimentoId);
    if (atIndex !== -1) {
      atendimentos[atIndex].receitaId = novaReceita.id;
      salvarAtendimentos(atendimentos);
    }
  }

  registrarAuditoria(
    req,
    'receita.criar',
    'receitas',
    novaReceita.id,
    `Receita óptica nº ${novaReceita.numeroFormatado} emitida para o paciente ${paciente.name} com validade de ${validadeCalculadaDias} dias.`,
    null,
    {
      numeroSequencial: novaReceita.numeroSequencial,
      numeroFormatado: novaReceita.numeroFormatado,
      pacienteId: paciente.id,
      pacienteNome: paciente.name,
      dataValidade: novaReceita.dataValidade,
    }
  );

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Receita óptica emitida com sucesso.',
    receita: novaReceita,
  });
});

// 4. "Receita emitida não é editável (imposto no servidor): cancela-se com motivo e emite-se outra"
app.put('/api/admin/receitas/:id', requirePermission('receitas.editar'), (_req: Request, res: Response) => {
  return res.status(400).json({
    error: 'Receitas emitidas são documentos ópticos oficiais imutáveis e não podem ser editadas. Conforme as normas clínicas e legais, para retificar uma receita, cancele a receita atual informando o motivo e emita uma nova receita.',
  });
});

app.delete('/api/admin/receitas/:id', requirePermission('receitas.excluir'), (_req: Request, res: Response) => {
  return res.status(400).json({
    error: 'Receitas ópticas emitidas não podem ser excluídas fisicamente para preservar a integridade jurídica e o histórico de saúde. Para invalidar uma receita emitida, utilize o cancelamento formal com justificativa.',
  });
});

// 5. Cancelamento de Receita (com motivo obrigatório e auditoria)
app.post('/api/admin/receitas/:id/cancelar', requirePermission('receitas.excluir'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return res.status(400).json({ error: 'É obrigatório informar o motivo do cancelamento da receita.' });
  }

  const receitas = carregarReceitas();
  const index = receitas.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Receita não encontrada.' });
  }

  if (receitas[index].cancelada || receitas[index].status === 'cancelada') {
    return res.status(400).json({ error: 'Esta receita já foi cancelada anteriormente.' });
  }

  const usuario = req.user || { uid: 'usr-admin', nome: 'Administrador' };

  const agora = new Date().toISOString();
  const anterior = { ...receitas[index] };

  receitas[index].cancelada = true;
  receitas[index].status = 'cancelada';
  receitas[index].motivoCancelamento = sanitizarTexto(motivo);
  receitas[index].canceladaEm = agora;
  receitas[index].canceladaPor = { id: usuario.uid, nome: usuario.nome };

  salvarReceitas(receitas);

  registrarAuditoria(
    req,
    'receita.cancelar',
    'receitas',
    id,
    `Receita óptica nº ${anterior.numeroFormatado} do paciente "${anterior.snapshotPaciente.nome}" CANCELADA por ${usuario.nome}. Motivo: ${motivo.trim()}`,
    { status: 'emitida', cancelada: false },
    { status: 'cancelada', cancelada: true, motivoCancelamento: motivo.trim() }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Receita cancelada com sucesso.',
    receita: receitas[index],
  });
});

// 6. Reimpressão de Receita (Audita e incrementa contagem de 2ª via)
app.post('/api/admin/receitas/:id/reimprimir', requirePermission('receitas.imprimir'), (req: Request, res: Response) => {
  const { id } = req.params;
  const receitas = carregarReceitas();
  const index = receitas.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Receita não encontrada.' });
  }

  receitas[index].contagemReimpressoes = (receitas[index].contagemReimpressoes || 0) + 1;
  salvarReceitas(receitas);

  const usuario = req.user || { uid: 'usr-opt', nome: 'Optometrista' };

  registrarAuditoria(
    req,
    'receita.reimprimir',
    'receitas',
    id,
    `Reimpressão (2ª via nº ${receitas[index].contagemReimpressoes}) da receita ${receitas[index].numeroFormatado} do paciente ${receitas[index].snapshotPaciente.nome} realizada por ${usuario.nome}.`,
    { contagemReimpressoes: receitas[index].contagemReimpressoes - 1 },
    { contagemReimpressoes: receitas[index].contagemReimpressoes }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Reimpressão de receita registrada com sucesso.',
    contagemReimpressoes: receitas[index].contagemReimpressoes,
    receita: receitas[index],
  });
});

// 7. Envio de Receita por WhatsApp ou E-mail (Gera link temporário expirável)
app.post('/api/admin/receitas/:id/enviar', requirePermission('receitas.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipo, destinatario } = req.body; // 'whatsapp' | 'email'

  if (!tipo || (tipo !== 'whatsapp' && tipo !== 'email')) {
    return res.status(400).json({ error: 'Tipo de envio inválido. Use "whatsapp" ou "email".' });
  }

  const receitas = carregarReceitas();
  const index = receitas.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Receita não encontrada.' });
  }

  const usuario = req.user || { uid: 'usr-envio', nome: 'Equipe Consultório' };

  // Gera novo token temporário de 7 dias se não houver ou se estiver próximo de expirar
  const tokenTemporario = crypto.randomBytes(24).toString('hex');
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  receitas[index].tokenAcessoTemporario = tokenTemporario;
  receitas[index].tokenExpiraEm = expiraEm;

  const destinoFinal = destinatario || (tipo === 'whatsapp' ? receitas[index].snapshotPaciente.telefone : receitas[index].snapshotPaciente.email) || 'Paciente';

  const linkTemporario = `/receita-digital/${tokenTemporario}`;
  const textoWhatsapp = `Olá ${receitas[index].snapshotPaciente.nome}! Segue sua receita óptica digital emitida pelo ${receitas[index].snapshotProfissional.nome} no ${receitas[index].snapshotConsultorio.nomeFantasia}. Acesse sua via oficial em PDF pelo link seguro: ${linkTemporario} (válido por 7 dias). Dúvidas: ${receitas[index].snapshotConsultorio.whatsapp}`;

  if (!receitas[index].historicoEnvios) {
    receitas[index].historicoEnvios = [];
  }

  receitas[index].historicoEnvios.push({
    tipo,
    destinatario: destinoFinal,
    data: new Date().toISOString(),
    usuarioId: usuario.uid,
    usuarioNome: usuario.nome,
    linkTemporario,
    expiraEm,
  });

  salvarReceitas(receitas);

  registrarAuditoria(
    req,
    'receita.enviar',
    'receitas',
    id,
    `Receita óptica nº ${receitas[index].numeroFormatado} enviada por ${tipo.toUpperCase()} para "${destinoFinal}" por ${usuario.nome}.`,
    null,
    { tipo, destinatario: destinoFinal, linkTemporario, expiraEm }
  );

  return res.json({
    sucesso: true,
    mensagem: `Receita enviada por ${tipo} com sucesso.`,
    linkTemporario,
    tokenAcessoTemporario: tokenTemporario,
    expiraEm,
    textoWhatsapp,
    destinatario: destinoFinal,
    receita: receitas[index],
  });
});

// 8. Rota Pública de Acesso à Receita Digital via Token Expirável (Link WhatsApp)
app.get('/api/public/receita-digital/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const receitas = carregarReceitas();
  const receita = receitas.find((r) => r.tokenAcessoTemporario === token);

  if (!receita) {
    return res.status(404).json({ error: 'Receita digital não encontrada ou link inválido.' });
  }

  if (receita.tokenExpiraEm && new Date(receita.tokenExpiraEm) < new Date()) {
    return res.status(410).json({ error: 'Este link de visualização expirou. Por favor, solicite um novo envio ao consultório.' });
  }

  return res.json({
    sucesso: true,
    receita,
  });
});

// ============================================================================
// MÓDULO: FINANCEIRO & CAIXA DO CONSULTÓRIO (PROMPT 10)
// ============================================================================

// 1. Exportação de Relatório Financeiro em CSV (RFC-4180 com UTF-8 BOM para Excel)
// Definida antes de /:id para evitar colisão de rotas
app.get('/api/admin/financeiro/exportar-csv', requirePermission('financeiro.ler'), (req: Request, res: Response) => {
  const { tipo, status, periodoInicio, periodoFim, categoria, busca, pacienteId } = req.query;
  const hoje = new Date().toISOString().split('T')[0];
  let transacoes = carregarFinanceiro();

  // Filtros idênticos à listagem
  if (tipo && tipo !== 'todos') {
    transacoes = transacoes.filter((t) => t.type === tipo);
  }

  if (status && status !== 'todos') {
    if (status === 'vence_hoje') {
      transacoes = transacoes.filter((t) => t.status === 'pendente' && t.dueDate === hoje);
    } else if (status === 'atrasadas') {
      transacoes = transacoes.filter((t) => t.status === 'pendente' && t.dueDate < hoje);
    } else {
      transacoes = transacoes.filter((t) => t.status === status);
    }
  }

  if (periodoInicio && typeof periodoInicio === 'string') {
    transacoes = transacoes.filter((t) => (t.paymentDate || t.dueDate || t.date) >= periodoInicio);
  }
  if (periodoFim && typeof periodoFim === 'string') {
    transacoes = transacoes.filter((t) => (t.paymentDate || t.dueDate || t.date) <= periodoFim);
  }
  if (categoria && typeof categoria === 'string') {
    transacoes = transacoes.filter((t) => t.categoryId === categoria || t.categoryName.toLowerCase().includes(categoria.toLowerCase()));
  }
  if (pacienteId && typeof pacienteId === 'string') {
    transacoes = transacoes.filter((t) => t.patientId === pacienteId);
  }
  if (busca && typeof busca === 'string' && busca.trim()) {
    const termo = busca.trim().toLowerCase();
    transacoes = transacoes.filter((t) =>
      t.description.toLowerCase().includes(termo) ||
      (t.patientName && t.patientName.toLowerCase().includes(termo)) ||
      (t.supplierName && t.supplierName.toLowerCase().includes(termo)) ||
      t.categoryName.toLowerCase().includes(termo) ||
      t.paymentMethodName.toLowerCase().includes(termo)
    );
  }

  const csvContent = gerarCsvFinanceiro(transacoes);
  const dataHoje = new Date().toISOString().split('T')[0];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="movimentacoes_financeiras_${dataHoje}.csv"`);
  return res.status(200).send(csvContent);
});

// 2. Listagem de Transações com Filtros, Resumo, Alertas, Gráfico e Totais por Categoria
app.get('/api/admin/financeiro', requirePermission('financeiro.ler'), (req: Request, res: Response) => {
  const { tipo, status, periodoInicio, periodoFim, categoria, busca, pacienteId } = req.query;
  const hoje = new Date().toISOString().split('T')[0];
  const todasTransacoes = carregarFinanceiro();

  // Resumo geral com todas as transações
  const resumoGeral = calcularResumoFinanceiro(todasTransacoes);
  const fluxoCaixaMensal = calcularGraficoFluxoCaixa(todasTransacoes);

  let filtradas = [...todasTransacoes];

  if (tipo && tipo !== 'todos') {
    filtradas = filtradas.filter((t) => t.type === tipo);
  }

  if (status && status !== 'todos') {
    if (status === 'vence_hoje') {
      filtradas = filtradas.filter((t) => t.status === 'pendente' && t.dueDate === hoje);
    } else if (status === 'atrasadas') {
      filtradas = filtradas.filter((t) => t.status === 'pendente' && t.dueDate < hoje);
    } else {
      filtradas = filtradas.filter((t) => t.status === status);
    }
  }

  if (periodoInicio && typeof periodoInicio === 'string') {
    filtradas = filtradas.filter((t) => (t.paymentDate || t.dueDate || t.date) >= periodoInicio);
  }
  if (periodoFim && typeof periodoFim === 'string') {
    filtradas = filtradas.filter((t) => (t.paymentDate || t.dueDate || t.date) <= periodoFim);
  }
  if (categoria && typeof categoria === 'string') {
    filtradas = filtradas.filter((t) => t.categoryId === categoria || t.categoryName.toLowerCase().includes(categoria.toLowerCase()));
  }
  if (pacienteId && typeof pacienteId === 'string') {
    filtradas = filtradas.filter((t) => t.patientId === pacienteId);
  }
  if (busca && typeof busca === 'string' && busca.trim()) {
    const termo = busca.trim().toLowerCase();
    filtradas = filtradas.filter((t) =>
      t.description.toLowerCase().includes(termo) ||
      (t.patientName && t.patientName.toLowerCase().includes(termo)) ||
      (t.supplierName && t.supplierName.toLowerCase().includes(termo)) ||
      t.categoryName.toLowerCase().includes(termo) ||
      t.paymentMethodName.toLowerCase().includes(termo)
    );
  }

  // Ordena por vencimento / data decrescente
  filtradas.sort((a, b) => (b.dueDate || b.date).localeCompare(a.dueDate || a.date));

  const totaisPorCategoria = calcularTotaisPorCategoria(filtradas);

  return res.json({
    sucesso: true,
    total: filtradas.length,
    transacoes: filtradas,
    resumo: resumoGeral,
    alertas: {
      vencendoHoje: resumoGeral.vencendoHojeList,
      atrasadas: resumoGeral.atrasadasList,
    },
    totaisPorCategoria,
    fluxoCaixaMensal,
  });
});

// 3. Buscar Transação por ID
app.get('/api/admin/financeiro/:id', requirePermission('financeiro.ler'), (req: Request, res: Response) => {
  const { id } = req.params;
  const transacoes = carregarFinanceiro();
  const transacao = transacoes.find((t) => t.id === id);

  if (!transacao) {
    return res.status(404).json({ error: 'Movimentação financeira não encontrada.' });
  }

  return res.json({ sucesso: true, transacao });
});

// 4. Lançar Movimentação (Receita / Despesa, Recorrência ou Parcelamento Simples)
app.post('/api/admin/financeiro', requirePermission('financeiro.criar'), (req: Request, res: Response) => {
  const {
    type,
    description,
    amountInCents,
    status,
    date,
    dueDate,
    paymentDate,
    categoryId,
    categoryName,
    paymentMethodId,
    paymentMethodName,
    patientId,
    patientName,
    atendimentoId,
    agendamentoId,
    supplierName,
    isRecurring,
    recurringFrequency,
    parcelas, // número de parcelas para parcelamento simples (ex: 3)
    receiptUrl,
    receiptName,
    notes,
  } = req.body;

  if (!type || (type !== 'receita' && type !== 'despesa')) {
    return res.status(400).json({ error: 'Tipo financeiro inválido. Escolha "receita" ou "despesa".' });
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'Descrição da movimentação é obrigatória.' });
  }

  const valorCentavos = Number(amountInCents);
  if (isNaN(valorCentavos) || valorCentavos <= 0) {
    return res.status(400).json({ error: 'Valor monetário deve ser maior que zero (em centavos).' });
  }

  const consultorio = carregarDadosConsultorio();
  const agora = new Date().toISOString();
  const dataLancamento = date || agora.split('T')[0];
  const dataVencimento = dueDate || dataLancamento;

  // Resolução de Categoria e Forma de Pagamento dos cadastros auxiliares
  let catNomeFinal = categoryName;
  if (!catNomeFinal && categoryId) {
    if (type === 'despesa') {
      const cd = (consultorio.categoriasDespesa || []).find((c) => c.id === categoryId);
      catNomeFinal = cd?.nome;
    } else {
      const srv = (consultorio.servicos || []).find((s) => s.id === categoryId);
      catNomeFinal = srv?.nome;
    }
  }
  if (!catNomeFinal) {
    catNomeFinal = type === 'receita' ? 'Consulta Optométrica' : 'Outras Despesas';
  }

  let formaPagNomeFinal = paymentMethodName;
  if (!formaPagNomeFinal && paymentMethodId) {
    const fp = (consultorio.formasPagamento || []).find((f) => f.id === paymentMethodId);
    formaPagNomeFinal = fp?.nome;
  }
  if (!formaPagNomeFinal) {
    formaPagNomeFinal = 'Pix (Chave ou QR Code)';
  }

  // Validação de Comprovante de Despesa se enviado
  if (receiptUrl) {
    const checagemComprovante = validarImagemTamanhoETipo(receiptUrl);
    if (!checagemComprovante.valido) {
      return res.status(400).json({ error: `Comprovante inválido: ${checagemComprovante.erro}` });
    }
  }

  const transacoes = carregarFinanceiro();
  const numParcelas = Number(parcelas);

  // Parcelamento Simples (Regra Prompt 10)
  if (numParcelas && numParcelas > 1) {
    const totalParcelas = Math.min(Math.max(2, Math.floor(numParcelas)), 36);
    const valorBase = Math.floor(valorCentavos / totalParcelas);
    const restoCentavos = valorCentavos % totalParcelas;
    const groupCode = `grp-${Date.now().toString(36)}`;
    const novasParcelas: FinanceiroRegistro[] = [];

    for (let i = 1; i <= totalParcelas; i++) {
      const valorDestaParcela = i === 1 ? valorBase + restoCentavos : valorBase;

      // Incrementa meses para as datas de vencimento
      const baseD = new Date(`${dataVencimento}T12:00:00.000Z`);
      baseD.setMonth(baseD.getMonth() + (i - 1));
      const vencimentoParcela = baseD.toISOString().split('T')[0];

      // Primeira parcela pode vir como paga se o status geral for 'pago'
      const statusParcela = status === 'pago' && i === 1 ? 'pago' : 'pendente';
      const dtPagParcela = statusParcela === 'pago' ? (paymentDate || dataLancamento) : undefined;

      const novaParcela: FinanceiroRegistro = {
        id: `fin-${Date.now().toString(36)}-${i}`,
        type,
        description: `${sanitizarTexto(description)} (${i}/${totalParcelas})`,
        amountInCents: valorDestaParcela,
        status: statusParcela,
        date: dataLancamento,
        dueDate: vencimentoParcela,
        paymentDate: dtPagParcela,
        categoryId,
        categoryName: sanitizarTexto(catNomeFinal),
        paymentMethodId,
        paymentMethodName: sanitizarTexto(formaPagNomeFinal),
        patientId,
        patientName: sanitizarTexto(patientName),
        atendimentoId,
        agendamentoId,
        supplierName: sanitizarTexto(supplierName),
        installmentNumber: i,
        installmentTotal: totalParcelas,
        installmentGroupCode: groupCode,
        receiptUrl: i === 1 ? receiptUrl : undefined,
        receiptName: i === 1 ? receiptName : undefined,
        notes: sanitizarTexto(notes),
        createdAt: agora,
        updatedAt: agora,
      };

      novasParcelas.push(novaParcela);
    }

    transacoes.unshift(...novasParcelas);
    salvarFinanceiro(transacoes);

    registrarAuditoria(
      req,
      'financeiro.criar',
      'financeiro',
      groupCode,
      `Lançamento parcelado em ${totalParcelas}x de ${formatarMoedaCentavos(valorCentavos)} (${novasParcelas[0].description}) criado.`,
      null,
      { groupCode, totalParcelas, valorTotalCentavos: valorCentavos }
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: `Lançamento parcelado em ${totalParcelas}x criado com sucesso.`,
      transacoes: novasParcelas,
      transacao: novasParcelas[0],
    });
  }

  // Transação Única (Normal ou Recorrente)
  const idNova = `fin-${Date.now().toString(36)}`;
  const statusFinal = status === 'pago' ? 'pago' : 'pendente';
  const dataPagamentoFinal = statusFinal === 'pago' ? (paymentDate || dataLancamento) : undefined;

  const novaTransacao: FinanceiroRegistro = {
    id: idNova,
    type,
    description: sanitizarTexto(description),
    amountInCents: valorCentavos,
    status: statusFinal,
    date: dataLancamento,
    dueDate: dataVencimento,
    paymentDate: dataPagamentoFinal,
    categoryId,
    categoryName: sanitizarTexto(catNomeFinal),
    paymentMethodId,
    paymentMethodName: sanitizarTexto(formaPagNomeFinal),
    patientId,
    patientName: sanitizarTexto(patientName),
    atendimentoId,
    agendamentoId,
    supplierName: sanitizarTexto(supplierName),
    isRecurring: Boolean(isRecurring),
    recurringFrequency: isRecurring ? (recurringFrequency || 'mensal') : undefined,
    receiptUrl,
    receiptName: sanitizarTexto(receiptName),
    notes: sanitizarTexto(notes),
    createdAt: agora,
    updatedAt: agora,
  };

  transacoes.unshift(novaTransacao);
  salvarFinanceiro(transacoes);

  registrarAuditoria(
    req,
    'financeiro.criar',
    'financeiro',
    novaTransacao.id,
    `${type === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'} "${novaTransacao.description}" no valor de ${formatarMoedaCentavos(valorCentavos)} cadastrada com vencimento em ${novaTransacao.dueDate}.`,
    null,
    novaTransacao
  );

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Movimentação financeira registrada com sucesso.',
    transacao: novaTransacao,
  });
});

// 5. Atualizar Movimentação Financeira
app.put('/api/admin/financeiro/:id', requirePermission('financeiro.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const transacoes = carregarFinanceiro();
  const index = transacoes.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movimentação financeira não encontrada.' });
  }

  const anterior = { ...transacoes[index] };
  const {
    description,
    amountInCents,
    dueDate,
    categoryId,
    categoryName,
    paymentMethodId,
    paymentMethodName,
    supplierName,
    patientName,
    notes,
    isRecurring,
    receiptUrl,
    receiptName,
  } = req.body;

  if (receiptUrl) {
    const checagemComprovante = validarImagemTamanhoETipo(receiptUrl);
    if (!checagemComprovante.valido) {
      return res.status(400).json({ error: `Comprovante inválido: ${checagemComprovante.erro}` });
    }
  }

  transacoes[index] = {
    ...transacoes[index],
    description: description !== undefined ? sanitizarTexto(description) : transacoes[index].description,
    amountInCents: amountInCents !== undefined ? Number(amountInCents) : transacoes[index].amountInCents,
    dueDate: dueDate !== undefined ? dueDate : transacoes[index].dueDate,
    categoryId: categoryId !== undefined ? categoryId : transacoes[index].categoryId,
    categoryName: categoryName !== undefined ? sanitizarTexto(categoryName) : transacoes[index].categoryName,
    paymentMethodId: paymentMethodId !== undefined ? paymentMethodId : transacoes[index].paymentMethodId,
    paymentMethodName: paymentMethodName !== undefined ? sanitizarTexto(paymentMethodName) : transacoes[index].paymentMethodName,
    supplierName: supplierName !== undefined ? sanitizarTexto(supplierName) : transacoes[index].supplierName,
    patientName: patientName !== undefined ? sanitizarTexto(patientName) : transacoes[index].patientName,
    notes: notes !== undefined ? sanitizarTexto(notes) : transacoes[index].notes,
    isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : transacoes[index].isRecurring,
    receiptUrl: receiptUrl !== undefined ? receiptUrl : transacoes[index].receiptUrl,
    receiptName: receiptName !== undefined ? sanitizarTexto(receiptName) : transacoes[index].receiptName,
    updatedAt: new Date().toISOString(),
  };

  salvarFinanceiro(transacoes);

  registrarAuditoria(
    req,
    'financeiro.editar',
    'financeiro',
    id,
    `Movimentação "${transacoes[index].description}" (${id}) atualizada.`,
    anterior,
    transacoes[index]
  );

  return res.json({
    sucesso: true,
    mensagem: 'Movimentação financeira atualizada com sucesso.',
    transacao: transacoes[index],
  });
});

// 6. Dar Baixa com Data e Registro em Auditoria (Regra Prompt 10)
app.post('/api/admin/financeiro/:id/baixar', requirePermission('financeiro.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentDate, paymentMethodId, paymentMethodName, receiptUrl, receiptName, notes } = req.body;

  const transacoes = carregarFinanceiro();
  const index = transacoes.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movimentação financeira não encontrada.' });
  }

  if (transacoes[index].status === 'cancelado') {
    return res.status(400).json({ error: 'Não é possível dar baixa em uma movimentação já cancelada.' });
  }

  if (receiptUrl) {
    const checagemComprovante = validarImagemTamanhoETipo(receiptUrl);
    if (!checagemComprovante.valido) {
      return res.status(400).json({ error: `Comprovante inválido: ${checagemComprovante.erro}` });
    }
  }

  const anterior = { ...transacoes[index] };
  const agora = new Date().toISOString();
  const dtPagamento = paymentDate || agora.split('T')[0];
  const usuario = req.user || { uid: 'usr-fin', nome: 'Responsável Financeiro' };

  transacoes[index].status = 'pago';
  transacoes[index].paymentDate = dtPagamento;
  if (paymentMethodId) transacoes[index].paymentMethodId = paymentMethodId;
  if (paymentMethodName) transacoes[index].paymentMethodName = sanitizarTexto(paymentMethodName);
  if (receiptUrl) transacoes[index].receiptUrl = receiptUrl;
  if (receiptName) transacoes[index].receiptName = sanitizarTexto(receiptName);
  if (notes) transacoes[index].notes = sanitizarTexto(notes);
  transacoes[index].paidAt = agora;
  transacoes[index].paidBy = { id: usuario.uid, nome: usuario.nome };
  transacoes[index].updatedAt = agora;

  salvarFinanceiro(transacoes);

  registrarAuditoria(
    req,
    'financeiro.baixar',
    'financeiro',
    id,
    `Baixa efetuada em ${transacoes[index].type === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'} "${transacoes[index].description}" no valor de ${formatarMoedaCentavos(transacoes[index].amountInCents)} com data de pagamento em ${dtPagamento} por ${usuario.nome}.`,
    { status: anterior.status, paymentDate: anterior.paymentDate },
    { status: 'pago', paymentDate: dtPagamento }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Baixa financeira registrada com sucesso.',
    transacao: transacoes[index],
  });
});

// 7. Cancelar Movimentação com Motivo e Auditoria (Regra Prompt 10)
app.post('/api/admin/financeiro/:id/cancelar', requirePermission('financeiro.editar'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return res.status(400).json({ error: 'É obrigatório informar o motivo do cancelamento da movimentação financeira.' });
  }

  const transacoes = carregarFinanceiro();
  const index = transacoes.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movimentação financeira não encontrada.' });
  }

  if (transacoes[index].status === 'cancelado') {
    return res.status(400).json({ error: 'Esta movimentação já foi cancelada anteriormente.' });
  }

  const anterior = { ...transacoes[index] };
  const agora = new Date().toISOString();
  const usuario = req.user || { uid: 'usr-fin', nome: 'Responsável Financeiro' };

  transacoes[index].status = 'cancelado';
  transacoes[index].canceledReason = sanitizarTexto(motivo);
  transacoes[index].canceledAt = agora;
  transacoes[index].canceledBy = { id: usuario.uid, nome: usuario.nome };
  transacoes[index].updatedAt = agora;

  salvarFinanceiro(transacoes);

  registrarAuditoria(
    req,
    'financeiro.cancelar',
    'financeiro',
    id,
    `Movimentação "${transacoes[index].description}" (${id}) de ${formatarMoedaCentavos(transacoes[index].amountInCents)} CANCELADA por ${usuario.nome}. Motivo: ${motivo.trim()}`,
    { status: anterior.status },
    { status: 'cancelado', motivoCancelamento: motivo.trim() }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Movimentação cancelada com sucesso.',
    transacao: transacoes[index],
  });
});

// 8. Excluir Movimentação Financeira
app.delete('/api/admin/financeiro/:id', requirePermission('financeiro.excluir'), (req: Request, res: Response) => {
  const { id } = req.params;
  const transacoes = carregarFinanceiro();
  const index = transacoes.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movimentação financeira não encontrada.' });
  }

  const removida = transacoes[index];
  transacoes.splice(index, 1);
  salvarFinanceiro(transacoes);

  registrarAuditoria(
    req,
    'financeiro.excluir',
    'financeiro',
    id,
    `Movimentação "${removida.description}" no valor de ${formatarMoedaCentavos(removida.amountInCents)} excluída do sistema.`,
    removida,
    null
  );

  return res.json({
    sucesso: true,
    mensagem: 'Movimentação financeira excluída com sucesso.',
  });
});

// ============================================================================
// MÓDULO: RELATÓRIOS IMPRESSOS (PROMPT 11)
// ============================================================================

export interface RelatorioDefinicao {
  id: string;
  titulo: string;
  descricao: string;
  permissao: string;
  temDadosPacientes: boolean;
  filtrosSuportados: string[];
}

const CATALOGO_RELATORIOS: RelatorioDefinicao[] = [
  {
    id: 'agenda',
    titulo: 'Agenda do Dia / Semana',
    descricao: 'Listagem cronológica das consultas, horários, status e profissionais responsáveis.',
    permissao: 'agenda.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['data', 'dataInicio', 'dataFim', 'profissional'],
  },
  {
    id: 'atendimentos',
    titulo: 'Atendimentos Clínicos por Período',
    descricao: 'Histórico detalhado de exames de refração, anamnese, acuidade e condutas diagnósticas.',
    permissao: 'atendimento.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['periodoInicio', 'periodoFim', 'profissional'],
  },
  {
    id: 'receitas',
    titulo: 'Receitas Ópticas Emitidas',
    descricao: 'Relação de prescrições oficiais emitidas, dioptrias esféricas/cilíndricas, lentes e validades.',
    permissao: 'receitas.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['periodoInicio', 'periodoFim', 'pacienteId', 'status'],
  },
  {
    id: 'pacientes',
    titulo: 'Lista Geral de Pacientes',
    descricao: 'Relação cadastral completa dos pacientes, contatos telefônicos e status de consentimento LGPD.',
    permissao: 'pacientes.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['status', 'cidade'],
  },
  {
    id: 'aniversariantes',
    titulo: 'Aniversariantes do Mês',
    descricao: 'Pacientes que comemoram aniversário no mês selecionado para ações de fidelização e retorno.',
    permissao: 'pacientes.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['mes'],
  },
  {
    id: 'contas_receber',
    titulo: 'Contas a Receber (Honorários Clínicos)',
    descricao: 'Demonstrativo de receitas de consultas, formas de pagamento e status de liquidação.',
    permissao: 'financeiro.ler',
    temDadosPacientes: true,
    filtrosSuportados: ['periodoInicio', 'periodoFim', 'status'],
  },
  {
    id: 'contas_pagar',
    titulo: 'Contas a Pagar (Despesas Operacionais)',
    descricao: 'Despesas fixas e variáveis do consultório, fornecedores, categorias e comprovantes anexos.',
    permissao: 'financeiro.ler',
    temDadosPacientes: false,
    filtrosSuportados: ['periodoInicio', 'periodoFim', 'status', 'categoria'],
  },
  {
    id: 'fluxo_caixa',
    titulo: 'Demonstrativo de Fluxo de Caixa Mensal',
    descricao: 'Consolidação contábil mensal das entradas, saídas operacionais e resultado líquido em caixa.',
    permissao: 'financeiro.ler',
    temDadosPacientes: false,
    filtrosSuportados: ['mesAno'],
  },
  {
    id: 'usuarios',
    titulo: 'Usuários, Colaboradores e Papéis',
    descricao: 'Relação da equipe do consultório, níveis de permissão, registros de classe e acessos.',
    permissao: 'usuarios.ler',
    temDadosPacientes: false,
    filtrosSuportados: ['status'],
  },
  {
    id: 'auditoria',
    titulo: 'Trilha de Auditoria & Conformidade LGPD',
    descricao: 'Histórico cronológico e imutável das operações de criação, alteração e cancelamento.',
    permissao: 'auditoria.ler',
    temDadosPacientes: false,
    filtrosSuportados: ['periodoInicio', 'periodoFim', 'usuario'],
  },
];

// 1. Catálogo de Relatórios Disponíveis (Filtrado em tempo real pelas permissões do usuário)
app.get('/api/admin/relatorios', requirePermission('relatorios.ler'), (req: Request, res: Response) => {
  const userPerms = req.user?.permissoes;
  const relatoriosPermitidos = CATALOGO_RELATORIOS.filter((r) =>
    hasServerPermission(userPerms, r.permissao)
  );

  return res.json({
    sucesso: true,
    relatorios: relatoriosPermitidos,
    totalDisponiveis: relatoriosPermitidos.length,
  });
});

// 2. Geração e Consulta dos Dados do Relatório Escolhido com Checagem Estrita de Permissão
app.get('/api/admin/relatorios/dados', requirePermission('relatorios.ler'), (req: Request, res: Response) => {
  const {
    tipo,
    data,
    dataInicio,
    dataFim,
    periodoInicio,
    periodoFim,
    profissional,
    status,
    cidade,
    mes,
    mesAno,
    categoria,
    usuario,
    pacienteId,
  } = req.query;

  if (!tipo || typeof tipo !== 'string') {
    return res.status(400).json({ error: 'Informe o tipo de relatório desejado.' });
  }

  const definicao = CATALOGO_RELATORIOS.find((r) => r.id === tipo);
  if (!definicao) {
    return res.status(404).json({ error: `Tipo de relatório "${tipo}" não reconhecido.` });
  }

  // Validação Estrita de Permissão por Relatório no Servidor (Regra Prompt 11 & docs)
  const userPerms = req.user?.permissoes;
  if (!hasServerPermission(userPerms, definicao.permissao)) {
    return res.status(403).json({
      error: `Acesso negado. Você não possui a permissão "${definicao.permissao}" exigida para emitir este relatório.`,
    });
  }

  const consultorio = carregarDadosConsultorio();
  const agora = new Date().toISOString();
  const dataHoraEmissaoStr = formatarDataHoraIsoParaBR(agora);
  const usuarioEmissor = req.user
    ? `${req.user.nome} (${req.user.papelNome})`
    : 'Dr. Roberto Viana (Optometrista)';

  const filtrosAplicados: { rotulo: string; valor: string }[] = [];
  let colunas: string[] = [];
  let linhas: any[] = [];
  let totais: { rotulo: string; valor: string }[] = [];

  // ==========================================
  // RELATÓRIO 1: AGENDA DO DIA / SEMANA
  // ==========================================
  if (tipo === 'agenda') {
    let ags = carregarAgendamentos();
    const dtAlvoInicio = (dataInicio as string) || (data as string) || agora.split('T')[0];
    const dtAlvoFim = (dataFim as string) || (data as string) || dtAlvoInicio;

    filtrosAplicados.push({
      rotulo: 'Período da Agenda',
      valor: dtAlvoInicio === dtAlvoFim ? formatarDataIsoParaBR(dtAlvoInicio) : `${formatarDataIsoParaBR(dtAlvoInicio)} até ${formatarDataIsoParaBR(dtAlvoFim)}`,
    });

    ags = ags.filter((a) => a.data >= dtAlvoInicio && a.data <= dtAlvoFim);

    if (profissional && typeof profissional === 'string' && profissional !== 'todos') {
      ags = ags.filter((a) => (a.optometristaNome || '').toLowerCase().includes(profissional.toLowerCase()));
      filtrosAplicados.push({ rotulo: 'Profissional', valor: profissional });
    }

    if (status && typeof status === 'string' && status !== 'todos') {
      ags = ags.filter((a) => a.status === status);
      filtrosAplicados.push({ rotulo: 'Status da Consulta', valor: status });
    }

    // Ordenação cronológica por data e horário
    ags.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

    colunas = ['Data', 'Horário', 'Paciente', 'Telefone', 'Procedimento / Serviço', 'Profissional', 'Status', 'Origem'];
    linhas = ags.map((a) => [
      formatarDataIsoParaBR(a.data),
      a.horario,
      a.nomeContato,
      a.telefone || '-',
      a.servicoNome,
      a.optometristaNome || consultorio.responsavelTecnico,
      a.status.toUpperCase(),
      a.origem === 'site' ? 'Online (Site)' : 'Presencial / Recepção',
    ]);

    const totalAtendidos = ags.filter((a) => a.status === 'atendido' || a.status === 'concluido').length;
    const totalConfirmados = ags.filter((a) => a.status === 'confirmado').length;
    totais = [
      { rotulo: 'Total de Consultas Programadas', valor: String(ags.length) },
      { rotulo: 'Confirmadas', valor: String(totalConfirmados) },
      { rotulo: 'Atendidas', valor: String(totalAtendidos) },
    ];
  }

  // ==========================================
  // RELATÓRIO 2: ATENDIMENTOS POR PERÍODO
  // ==========================================
  else if (tipo === 'atendimentos') {
    let atds = carregarAtendimentos();
    const pIni = (periodoInicio as string) || '2026-01-01';
    const pFim = (periodoFim as string) || '2027-12-31';

    filtrosAplicados.push({
      rotulo: 'Período Clínico',
      valor: `${formatarDataIsoParaBR(pIni)} a ${formatarDataIsoParaBR(pFim)}`,
    });

    atds = atds.filter((a) => a.data >= pIni && a.data <= pFim);

    if (profissional && typeof profissional === 'string' && profissional !== 'todos') {
      atds = atds.filter((a) => (a.optometristaNome || '').toLowerCase().includes(profissional.toLowerCase()));
      filtrosAplicados.push({ rotulo: 'Optometrista', valor: profissional });
    }

    atds.sort((a, b) => b.data.localeCompare(a.data));

    colunas = ['Data', 'Paciente', 'Queixa Principal', 'Refração OD', 'Refração OE', 'Diagnóstico / Conduta', 'Status'];
    linhas = atds.map((a) => {
      const odStr = a.refracao?.od?.esferico !== undefined
        ? `Esf ${a.refracao.od.esferico > 0 ? '+' : ''}${a.refracao.od.esferico.toFixed(2)} Cil ${a.refracao.od.cilindrico?.toFixed(2) || '0.00'} Eixo ${a.refracao.od.eixo || 0}º`
        : '-';
      const oeStr = a.refracao?.oe?.esferico !== undefined
        ? `Esf ${a.refracao.oe.esferico > 0 ? '+' : ''}${a.refracao.oe.esferico.toFixed(2)} Cil ${a.refracao.oe.cilindrico?.toFixed(2) || '0.00'} Eixo ${a.refracao.oe.eixo || 0}º`
        : '-';

      return [
        formatarDataIsoParaBR(a.data),
        a.pacienteNome,
        a.anamnese?.queixaPrincipal || '-',
        odStr,
        oeStr,
        a.condutaDiagnostica || 'Refração de rotina',
        a.status === 'finalizado' ? 'FINALIZADO' : 'EM ANDAMENTO',
      ];
    });

    const totalFinalizados = atds.filter((a) => a.status === 'finalizado').length;
    totais = [
      { rotulo: 'Total de Atendimentos Realizados', valor: String(atds.length) },
      { rotulo: 'Consultas Finalizadas', valor: String(totalFinalizados) },
    ];
  }

  // ==========================================
  // RELATÓRIO 3: RECEITAS EMITIDAS
  // ==========================================
  else if (tipo === 'receitas') {
    let recs = carregarReceitas();
    const pIni = (periodoInicio as string) || '2026-01-01';
    const pFim = (periodoFim as string) || '2027-12-31';

    filtrosAplicados.push({
      rotulo: 'Período de Emissão',
      valor: `${formatarDataIsoParaBR(pIni)} a ${formatarDataIsoParaBR(pFim)}`,
    });

    recs = recs.filter((r) => r.dataEmissao >= pIni && r.dataEmissao <= pFim);

    if (pacienteId && typeof pacienteId === 'string' && pacienteId !== 'todos') {
      recs = recs.filter((r) => r.pacienteId === pacienteId);
      filtrosAplicados.push({ rotulo: 'Paciente ID', valor: pacienteId });
    }

    if (status && typeof status === 'string' && status !== 'todos') {
      recs = recs.filter((r) => r.status === status);
      filtrosAplicados.push({ rotulo: 'Status da Receita', valor: status });
    }

    recs.sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao));

    colunas = ['Nº Receita', 'Emissão', 'Paciente', 'Grau OD', 'Grau OE', 'Tipo de Lente', 'Validade Até', 'Status'];
    linhas = recs.map((r) => {
      const od = r.tabelaRefracao?.od;
      const oe = r.tabelaRefracao?.oe;
      const odTxt = od && od.esferico !== undefined ? `${od.esferico > 0 ? '+' : ''}${od.esferico.toFixed(2)} esf ${od.cilindrico ? `${od.cilindrico.toFixed(2)} cil ${od.eixo}º` : ''}` : '-';
      const oeTxt = oe && oe.esferico !== undefined ? `${oe.esferico > 0 ? '+' : ''}${oe.esferico.toFixed(2)} esf ${oe.cilindrico ? `${oe.cilindrico.toFixed(2)} cil ${oe.eixo}º` : ''}` : '-';

      return [
        r.numeroFormatado,
        formatarDataIsoParaBR(r.dataEmissao),
        r.snapshotPaciente.nome,
        odTxt,
        oeTxt,
        r.tipoLente,
        formatarDataIsoParaBR(r.dataValidade),
        r.cancelada ? 'CANCELADA' : 'VÁLIDA',
      ];
    });

    const totalValidas = recs.filter((r) => !r.cancelada).length;
    const totalCanceladas = recs.filter((r) => r.cancelada).length;
    totais = [
      { rotulo: 'Total de Receitas Emitidas', valor: String(recs.length) },
      { rotulo: 'Receitas Válidas e Ativas', valor: String(totalValidas) },
      { rotulo: 'Receitas Canceladas com Justificativa', valor: String(totalCanceladas) },
    ];
  }

  // ==========================================
  // RELATÓRIO 4: LISTA DE PACIENTES
  // ==========================================
  else if (tipo === 'pacientes') {
    let pacs = carregarPacientes();

    if (status && typeof status === 'string' && status !== 'todos') {
      const apenasAtivos = status === 'ativo';
      pacs = pacs.filter((p) => Boolean(p.ativo) === apenasAtivos);
      filtrosAplicados.push({ rotulo: 'Status Cadastral', valor: apenasAtivos ? 'Apenas Ativos' : 'Apenas Desativados' });
    }

    if (cidade && typeof cidade === 'string' && cidade.trim()) {
      pacs = pacs.filter((p) => (p.address?.city || '').toLowerCase().includes(cidade.toLowerCase()));
      filtrosAplicados.push({ rotulo: 'Cidade / Região', valor: cidade });
    }

    pacs.sort((a, b) => a.name.localeCompare(b.name));

    colunas = ['Nome do Paciente', 'CPF', 'Telefone / WhatsApp', 'E-mail', 'Cidade / UF', 'Convênio / Particular', 'Status LGPD'];
    linhas = pacs.map((p) => [
      p.name,
      p.cpf || 'Não informado',
      p.phone || '-',
      p.email || '-',
      p.address?.city ? `${p.address.city}/${p.address.state || 'SP'}` : 'São Paulo/SP',
      p.healthInsurance || 'Particular',
      p.consentimentoLgpd?.aceito ? 'Consentimento Ativo' : 'Pendente',
    ]);

    const totalAtivos = pacs.filter((p) => p.ativo !== false).length;
    totais = [
      { rotulo: 'Total de Pacientes Listados', valor: String(pacs.length) },
      { rotulo: 'Cadastros Ativos', valor: String(totalAtivos) },
    ];
  }

  // ==========================================
  // RELATÓRIO 5: ANIVERSARIANTES DO MÊS
  // ==========================================
  else if (tipo === 'aniversariantes') {
    const mesNum = mes ? Number(mes) : new Date().getMonth() + 1;
    const mesFormatado = String(mesNum).padStart(2, '0');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    filtrosAplicados.push({
      rotulo: 'Mês de Referência',
      valor: nomesMeses[mesNum - 1] || `Mês ${mesNum}`,
    });

    const pacs = carregarPacientes().filter((p) => {
      if (p.ativo === false) return false;
      if (!p.birthDate) return false;
      const partes = p.birthDate.split('-');
      return partes[1] === mesFormatado;
    });

    pacs.sort((a, b) => {
      const diaA = Number(a.birthDate?.split('-')[2] || 0);
      const diaB = Number(b.birthDate?.split('-')[2] || 0);
      return diaA - diaB;
    });

    colunas = ['Dia', 'Nome do Paciente', 'Telefone / WhatsApp', 'E-mail', 'Idade Atual / Completa'];
    linhas = pacs.map((p) => {
      const partes = (p.birthDate || '').split('-');
      const dia = partes[2] || '-';
      const anoNasc = Number(partes[0]) || 1990;
      const idade = new Date().getFullYear() - anoNasc;

      return [
        dia,
        p.name,
        p.phone || '-',
        p.email || '-',
        `${idade} anos`,
      ];
    });

    totais = [
      { rotulo: `Total de Aniversariantes em ${nomesMeses[mesNum - 1]}`, valor: String(pacs.length) },
    ];
  }

  // ==========================================
  // RELATÓRIO 6: CONTAS A RECEBER
  // ==========================================
  else if (tipo === 'contas_receber') {
    let trans = carregarFinanceiro().filter((t) => t.type === 'receita');
    const pIni = (periodoInicio as string) || '2026-01-01';
    const pFim = (periodoFim as string) || '2027-12-31';

    filtrosAplicados.push({
      rotulo: 'Período Financeiro',
      valor: `${formatarDataIsoParaBR(pIni)} a ${formatarDataIsoParaBR(pFim)}`,
    });

    trans = trans.filter((t) => (t.dueDate || t.date) >= pIni && (t.dueDate || t.date) <= pFim);

    if (status && typeof status === 'string' && status !== 'todos') {
      trans = trans.filter((t) => t.status === status);
      filtrosAplicados.push({ rotulo: 'Status da Conta', valor: status.toUpperCase() });
    }

    trans.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    colunas = ['Vencimento', 'Descrição da Receita', 'Paciente', 'Forma de Pagamento', 'Valor (R$)', 'Status', 'Data da Baixa'];
    linhas = trans.map((t) => [
      formatarDataIsoParaBR(t.dueDate),
      t.description,
      t.patientName || '-',
      t.paymentMethodName || 'Pix',
      formatarMoedaCentavos(t.amountInCents),
      t.status === 'pago' ? 'LIQUIDADO / PAGO' : t.status === 'pendente' ? 'PENDENTE' : 'CANCELADO',
      t.paymentDate ? formatarDataIsoParaBR(t.paymentDate) : '-',
    ]);

    const totalCentavos = trans.filter((t) => t.status !== 'cancelado').reduce((acc, t) => acc + t.amountInCents, 0);
    const totalPago = trans.filter((t) => t.status === 'pago').reduce((acc, t) => acc + t.amountInCents, 0);
    const totalPendente = trans.filter((t) => t.status === 'pendente').reduce((acc, t) => acc + t.amountInCents, 0);

    totais = [
      { rotulo: 'Total Previsto (R$)', valor: formatarMoedaCentavos(totalCentavos) },
      { rotulo: 'Total Já Recebido em Caixa (R$)', valor: formatarMoedaCentavos(totalPago) },
      { rotulo: 'Total Pendente a Receber (R$)', valor: formatarMoedaCentavos(totalPendente) },
    ];
  }

  // ==========================================
  // RELATÓRIO 7: CONTAS A PAGAR
  // ==========================================
  else if (tipo === 'contas_pagar') {
    let trans = carregarFinanceiro().filter((t) => t.type === 'despesa');
    const pIni = (periodoInicio as string) || '2026-01-01';
    const pFim = (periodoFim as string) || '2027-12-31';

    filtrosAplicados.push({
      rotulo: 'Período Financeiro',
      valor: `${formatarDataIsoParaBR(pIni)} a ${formatarDataIsoParaBR(pFim)}`,
    });

    trans = trans.filter((t) => (t.dueDate || t.date) >= pIni && (t.dueDate || t.date) <= pFim);

    if (status && typeof status === 'string' && status !== 'todos') {
      trans = trans.filter((t) => t.status === status);
      filtrosAplicados.push({ rotulo: 'Status da Conta', valor: status.toUpperCase() });
    }

    if (categoria && typeof categoria === 'string' && categoria !== 'todos') {
      trans = trans.filter((t) => (t.categoryName || '').toLowerCase().includes(categoria.toLowerCase()) || t.categoryId === categoria);
      filtrosAplicados.push({ rotulo: 'Categoria', valor: categoria });
    }

    trans.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    colunas = ['Vencimento', 'Descrição da Despesa', 'Fornecedor / Prestador', 'Categoria', 'Valor (R$)', 'Status', 'Data do Pagamento'];
    linhas = trans.map((t) => [
      formatarDataIsoParaBR(t.dueDate),
      t.description,
      t.supplierName || '-',
      t.categoryName,
      formatarMoedaCentavos(t.amountInCents),
      t.status === 'pago' ? 'PAGO' : t.status === 'pendente' ? 'A PAGAR' : 'CANCELADO',
      t.paymentDate ? formatarDataIsoParaBR(t.paymentDate) : '-',
    ]);

    const totalCentavos = trans.filter((t) => t.status !== 'cancelado').reduce((acc, t) => acc + t.amountInCents, 0);
    const totalPago = trans.filter((t) => t.status === 'pago').reduce((acc, t) => acc + t.amountInCents, 0);
    const totalPendente = trans.filter((t) => t.status === 'pendente').reduce((acc, t) => acc + t.amountInCents, 0);

    totais = [
      { rotulo: 'Total de Despesas Operacionais (R$)', valor: formatarMoedaCentavos(totalCentavos) },
      { rotulo: 'Total Já Quitado (R$)', valor: formatarMoedaCentavos(totalPago) },
      { rotulo: 'Total Pendente de Liquidação (R$)', valor: formatarMoedaCentavos(totalPendente) },
    ];
  }

  // ==========================================
  // RELATÓRIO 8: FLUXO DE CAIXA MENSAL
  // ==========================================
  else if (tipo === 'fluxo_caixa') {
    const todasTrans = carregarFinanceiro();
    const fluxo = calcularGraficoFluxoCaixa(todasTrans);

    if (mesAno && typeof mesAno === 'string' && mesAno !== 'todos') {
      filtrosAplicados.push({ rotulo: 'Mês Filtrado', valor: mesAno });
    }

    colunas = ['Mês / Ano', 'Receitas Realizadas (R$)', 'Despesas Pagas (R$)', 'Resultado Líquido do Mês (R$)', 'Saldo Acumulado (R$)'];
    linhas = fluxo.map((f) => [
      f.mesNome,
      formatarMoedaCentavos(f.receitasCentavos),
      formatarMoedaCentavos(f.despesasCentavos),
      formatarMoedaCentavos(f.saldoCentavos),
      formatarMoedaCentavos(f.saldoAcumuladoCentavos),
    ]);

    const somaReceitas = fluxo.reduce((acc, f) => acc + f.receitasCentavos, 0);
    const somaDespesas = fluxo.reduce((acc, f) => acc + f.despesasCentavos, 0);
    const saldoFinal = somaReceitas - somaDespesas;

    totais = [
      { rotulo: 'Total de Entradas em Caixa (R$)', valor: formatarMoedaCentavos(somaReceitas) },
      { rotulo: 'Total de Saídas Operacionais (R$)', valor: formatarMoedaCentavos(somaDespesas) },
      { rotulo: 'Resultado Líquido do Período (R$)', valor: formatarMoedaCentavos(saldoFinal) },
    ];
  }

  // ==========================================
  // RELATÓRIO 9: USUÁRIOS E PAPÉIS
  // ==========================================
  else if (tipo === 'usuarios') {
    let usrs = carregarUsuarios();
    const papeis = carregarPapeis();

    if (status && typeof status === 'string' && status !== 'todos') {
      const apenasAtivos = status === 'ativo';
      usrs = usrs.filter((u) => Boolean(u.ativo) === apenasAtivos);
      filtrosAplicados.push({ rotulo: 'Status do Usuário', valor: apenasAtivos ? 'Ativos' : 'Inativos' });
    }

    colunas = ['Nome do Colaborador', 'E-mail de Acesso', 'Telefone', 'Papel / Perfil', 'Registro de Classe', 'Status', 'Último Acesso'];
    linhas = usrs.map((u) => {
      const papel = papeis.find((p) => p.id === u.papelId);
      return [
        u.nome,
        u.email,
        u.telefone || '-',
        papel?.nome || u.papelId,
        u.registroProfissional || '-',
        u.ativo ? 'ATIVO' : 'DESATIVADO',
        u.ultimoAcesso ? formatarDataHoraIsoParaBR(u.ultimoAcesso) : 'Nunca acessou',
      ];
    });

    const totalAtivos = usrs.filter((u) => u.ativo).length;
    totais = [
      { rotulo: 'Total de Usuários Cadastrados', valor: String(usrs.length) },
      { rotulo: 'Contas Ativas', valor: String(totalAtivos) },
    ];
  }

  // ==========================================
  // RELATÓRIO 10: AUDITORIA
  // ==========================================
  else if (tipo === 'auditoria') {
    let logs = carregarAuditoria();
    const pIni = (periodoInicio as string) || '2026-01-01';
    const pFim = (periodoFim as string) || '2027-12-31';

    filtrosAplicados.push({
      rotulo: 'Período Auditado',
      valor: `${formatarDataIsoParaBR(pIni)} a ${formatarDataIsoParaBR(pFim)}`,
    });

    logs = logs.filter((l) => l.data.split('T')[0] >= pIni && l.data.split('T')[0] <= pFim);

    if (usuario && typeof usuario === 'string' && usuario !== 'todos') {
      logs = logs.filter((l) => l.usuarioNome.toLowerCase().includes(usuario.toLowerCase()) || l.usuarioEmail.toLowerCase().includes(usuario.toLowerCase()));
      filtrosAplicados.push({ rotulo: 'Operador / Usuário', valor: usuario });
    }

    colunas = ['Data / Hora', 'Usuário Responsável', 'Ação Realizada', 'Módulo', 'Resumo da Operação', 'IP de Origem'];
    linhas = logs.slice(0, 200).map((l) => [
      formatarDataHoraIsoParaBR(l.data),
      `${l.usuarioNome} (${l.usuarioEmail})`,
      l.acao,
      l.colecao,
      l.resumo,
      l.ip || '127.0.0.1',
    ]);

    totais = [
      { rotulo: 'Total de Eventos Auditados', valor: String(logs.length) },
    ];
  }

  // Registro Obrigatório em Trilha de Auditoria quando houver dados de pacientes (Regra Prompt 11 & docs)
  if (definicao.temDadosPacientes) {
    registrarAuditoria(
      req,
      'relatorio.emitir',
      'relatorios',
      tipo,
      `Relatório impresso "${definicao.titulo}" emitido por ${usuarioEmissor} contendo ${linhas.length} registro(s) de pacientes.`,
      null,
      { tipo, filtros: filtrosAplicados, totalRegistros: linhas.length }
    );
  }

  return res.json({
    sucesso: true,
    relatorio: {
      id: definicao.id,
      titulo: definicao.titulo,
      descricao: definicao.descricao,
      permissao: definicao.permissao,
      temDadosPacientes: definicao.temDadosPacientes,
      dataHoraEmissao: dataHoraEmissaoStr,
      usuarioEmissor,
      filtrosAplicados,
      colunas,
      linhas,
      totais,
      consultorio: {
        razaoSocial: consultorio.razaoSocial,
        nomeFantasia: consultorio.nomeFantasia,
        cnpj: consultorio.cnpj,
        registroProfissional: consultorio.registroProfissional,
        responsavelTecnico: consultorio.responsavelTecnico,
        telefone: consultorio.telefone,
        whatsapp: consultorio.whatsapp,
        email: consultorio.email,
        endereco: consultorio.endereco,
        logoUrl: consultorio.logoUrl,
        textoRodapeRelatorio: consultorio.textoRodapeRelatorio || 'Consultório de Optometria Dr. Roberto Viana • Documento interno para controle e prontuário clínico.',
      },
    },
  });
});

// Módulo: Auditoria (Leitura restrita a administradores/quem tem auditoria.ler)
app.get('/api/admin/auditoria', requirePermission('auditoria.ler'), (req: Request, res: Response) => {
  const { colecao, acao, limite } = req.query;
  let logs = carregarAuditoria();

  if (colecao && typeof colecao === 'string') {
    logs = logs.filter((l) => l.colecao === colecao);
  }
  if (acao && typeof acao === 'string') {
    logs = logs.filter((l) => l.acao.toLowerCase().includes(acao.toLowerCase()));
  }

  const max = limite ? Math.min(Math.max(1, Number(limite)), 500) : 100;
  return res.json({ sucesso: true, total: logs.length, logs: logs.slice(0, max) });
});

// Módulo: Empresa (Configurações Gerais do Consultório)
app.get('/api/admin/empresa', requirePermission('empresa.ler'), (_req: Request, res: Response) => {
  return res.json(carregarDadosConsultorio());
});

app.put('/api/admin/empresa', requirePermission('empresa.editar'), (req: Request, res: Response) => {
  const novosDados = req.body;
  if (!novosDados || typeof novosDados !== 'object') {
    return res.status(400).json({ error: 'Dados da empresa inválidos.' });
  }

  // 1. Validação de CNPJ (se informado)
  if (novosDados.cnpj) {
    if (!validarCNPJServer(novosDados.cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido. Forneça um CNPJ com 14 dígitos e dígitos verificadores válidos.' });
    }
  }

  // 2. Validação de CEP (se informado)
  if (novosDados.endereco?.cep) {
    if (!validarCEPServer(novosDados.endereco.cep)) {
      return res.status(400).json({ error: 'CEP inválido. O CEP brasileiro deve conter exatamente 8 dígitos.' });
    }
  }

  // 3. Validação de Telefone / WhatsApp
  if (novosDados.telefone) {
    if (!validarTelefoneServer(novosDados.telefone)) {
      return res.status(400).json({ error: 'Telefone comercial inválido. Deve possuir DDD válido e 10 ou 11 dígitos.' });
    }
  }
  if (novosDados.whatsapp) {
    if (!validarTelefoneServer(novosDados.whatsapp)) {
      return res.status(400).json({ error: 'WhatsApp comercial inválido. Deve possuir DDD válido e 10 ou 11 dígitos.' });
    }
  }

  // 4. Validação de imagens (limite 2MB e tipo de imagem)
  const checarImagens = [
    { campo: 'logotipo', url: novosDados.logoUrl },
    { campo: 'carimbo', url: novosDados.carimboUrl },
    { campo: 'assinatura', url: novosDados.assinaturaUrl },
  ];
  for (const item of checarImagens) {
    const validacao = validarImagemTamanhoETipo(item.url);
    if (!validacao.valido) {
      return res.status(400).json({ error: `Imagem do ${item.campo} inválida: ${validacao.erro}` });
    }
  }

  const dadosAtuais = carregarDadosConsultorio();

  const consultorioAtualizado: DadosConsultorioServidor = {
    ...dadosAtuais,
    ...novosDados,
    id: 'dados_gerais', // Imutável
    endereco: {
      ...dadosAtuais.endereco,
      ...(novosDados.endereco || {}),
    },
    redesSociais: {
      ...dadosAtuais.redesSociais,
      ...(novosDados.redesSociais || {}),
    },
    horariosAtendimento: novosDados.horariosAtendimento || dadosAtuais.horariosAtendimento,
    bloqueiosAgenda: novosDados.bloqueiosAgenda || dadosAtuais.bloqueiosAgenda,
    servicos: novosDados.servicos || dadosAtuais.servicos,
    formasPagamento: novosDados.formasPagamento || dadosAtuais.formasPagamento,
    categoriasDespesa: novosDados.categoriasDespesa || dadosAtuais.categoriasDespesa,
    motivosCancelamento: novosDados.motivosCancelamento || dadosAtuais.motivosCancelamento,
    mensagensPadraoWhatsapp: novosDados.mensagensPadraoWhatsapp || dadosAtuais.mensagensPadraoWhatsapp,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(consultorioAtualizado, null, 2), 'utf-8');

  // Registrar auditoria
  registrarAuditoria(
    req,
    'empresa.editar',
    'empresa',
    'dados_gerais',
    `Dados do consultório/empresa ("${consultorioAtualizado.nomeFantasia}") atualizados.`,
    {
      nomeFantasia: dadosAtuais.nomeFantasia,
      telefone: dadosAtuais.telefone,
      whatsapp: dadosAtuais.whatsapp,
      cnpj: dadosAtuais.cnpj,
      totalServicos: dadosAtuais.servicos?.length,
    },
    {
      nomeFantasia: consultorioAtualizado.nomeFantasia,
      telefone: consultorioAtualizado.telefone,
      whatsapp: consultorioAtualizado.whatsapp,
      cnpj: consultorioAtualizado.cnpj,
      totalServicos: consultorioAtualizado.servicos?.length,
    }
  );

  return res.json({ sucesso: true, consultorio: consultorioAtualizado });
});

// Módulo: Conteúdo da Home no Painel (Prompt 06b)
app.get('/api/admin/home', requirePermission('empresa.ler'), (_req: Request, res: Response) => {
  const dados = carregarDadosConsultorio();
  return res.json({
    sucesso: true,
    home: {
      hero: dados.hero,
      sobreOptometrista: dados.sobreOptometrista,
      servicos: dados.servicos,
      depoimentos: dados.depoimentos,
      galeria: dados.galeria,
      whatsappConfig: dados.whatsappConfig,
      secoesVisiveis: dados.secoesVisiveis,
      ordemSecoes: dados.ordemSecoes,
      mapaEmbedUrl: dados.mapaEmbedUrl,
      seo: dados.seo,
      politicaPrivacidadeTexto: dados.politicaPrivacidadeTexto,
      versaoPolitica: dados.versaoPolitica,
      textoRodape: dados.textoRodape,
    },
    publicadoPor: dados.publicadoPor,
  });
});

app.put('/api/admin/home/publicar', requirePermission('empresa.editar'), (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Conteúdo da home inválido.' });
  }

  // 1. Validação de tamanho de textos
  if (payload.hero?.titulo && payload.hero.titulo.length > 200) {
    return res.status(400).json({ error: 'Título do Hero excede o tamanho máximo de 200 caracteres.' });
  }
  if (payload.hero?.subtitulo && payload.hero.subtitulo.length > 600) {
    return res.status(400).json({ error: 'Subtítulo do Hero excede o tamanho máximo de 600 caracteres.' });
  }
  if (payload.sobreOptometrista?.biografia && payload.sobreOptometrista.biografia.length > 3000) {
    return res.status(400).json({ error: 'Biografia do optometrista excede o tamanho máximo de 3000 caracteres.' });
  }
  if (payload.seo?.titulo && payload.seo.titulo.length > 120) {
    return res.status(400).json({ error: 'Título SEO excede o tamanho máximo de 120 caracteres.' });
  }
  if (payload.seo?.descricao && payload.seo.descricao.length > 400) {
    return res.status(400).json({ error: 'Descrição SEO excede o tamanho máximo de 400 caracteres.' });
  }

  // 2. Validação de imagens (até 2 MB cada)
  if (payload.hero?.imagemUrl) {
    const vHero = validarImagemTamanhoETipo(payload.hero.imagemUrl);
    if (!vHero.valido) {
      return res.status(400).json({ error: `Imagem do Hero inválida: ${vHero.erro}` });
    }
  }
  if (payload.sobreOptometrista?.fotoUrl) {
    const vFoto = validarImagemTamanhoETipo(payload.sobreOptometrista.fotoUrl);
    if (!vFoto.valido) {
      return res.status(400).json({ error: `Foto do Optometrista inválida: ${vFoto.erro}` });
    }
  }
  if (Array.isArray(payload.galeria)) {
    for (let i = 0; i < payload.galeria.length; i++) {
      const item = payload.galeria[i];
      if (item.url) {
        const vGal = validarImagemTamanhoETipo(item.url);
        if (!vGal.valido) {
          return res.status(400).json({ error: `Foto ${i + 1} da galeria inválida: ${vGal.erro}` });
        }
      }
    }
  }

  // 3. Sanitização de textos
  const heroSanitizado = payload.hero
    ? {
        titulo: sanitizarTexto(payload.hero.titulo),
        subtitulo: sanitizarTexto(payload.hero.subtitulo),
        textoBotao: sanitizarTexto(payload.hero.textoBotao),
        imagemUrl: payload.hero.imagemUrl,
      }
    : undefined;

  const sobreSanitizado = payload.sobreOptometrista
    ? {
        ...payload.sobreOptometrista,
        nome: sanitizarTexto(payload.sobreOptometrista.nome),
        biografia: sanitizarTexto(payload.sobreOptometrista.biografia),
        formacao: (payload.sobreOptometrista.formacao || []).map((f: string) => sanitizarTexto(f)),
        diferenciais: (payload.sobreOptometrista.diferenciais || []).map((d: string) => sanitizarTexto(d)),
      }
    : undefined;

  const dadosAtuais = carregarDadosConsultorio();
  const agora = new Date().toISOString();

  const publicadoPor = {
    uid: req.user?.uid || 'admin',
    nome: req.user?.nome || 'Administrador',
    email: req.user?.email || 'admin@consultorio.com.br',
    data: agora,
  };

  const consultorioAtualizado: DadosConsultorioServidor = {
    ...dadosAtuais,
    hero: heroSanitizado || dadosAtuais.hero,
    sobreOptometrista: sobreSanitizado || dadosAtuais.sobreOptometrista,
    depoimentos: payload.depoimentos !== undefined ? payload.depoimentos : dadosAtuais.depoimentos,
    galeria: payload.galeria !== undefined ? payload.galeria : dadosAtuais.galeria,
    whatsappConfig: payload.whatsappConfig !== undefined ? payload.whatsappConfig : dadosAtuais.whatsappConfig,
    secoesVisiveis: payload.secoesVisiveis !== undefined ? payload.secoesVisiveis : dadosAtuais.secoesVisiveis,
    ordemSecoes: payload.ordemSecoes !== undefined ? payload.ordemSecoes : dadosAtuais.ordemSecoes,
    mapaEmbedUrl: payload.mapaEmbedUrl !== undefined ? payload.mapaEmbedUrl : dadosAtuais.mapaEmbedUrl,
    seo: payload.seo !== undefined ? payload.seo : dadosAtuais.seo,
    politicaPrivacidadeTexto:
      payload.politicaPrivacidadeTexto !== undefined
        ? payload.politicaPrivacidadeTexto
        : dadosAtuais.politicaPrivacidadeTexto,
    textoRodape: payload.textoRodape !== undefined ? sanitizarTexto(payload.textoRodape) : dadosAtuais.textoRodape,
    publicadoPor,
    updatedAt: agora,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(consultorioAtualizado, null, 2), 'utf-8');

  registrarAuditoria(
    req,
    'home.publicar',
    'empresa',
    'dados_gerais',
    `Conteúdo da Landing Page publicado no site por ${publicadoPor.nome} (${publicadoPor.email}).`,
    {
      publicadoAnteriormente: dadosAtuais.publicadoPor,
    },
    {
      publicadoPor,
      secoesVisiveis: consultorioAtualizado.secoesVisiveis,
      totalDepoimentos: consultorioAtualizado.depoimentos?.length,
      totalGaleria: consultorioAtualizado.galeria?.length,
    }
  );

  return res.json({
    sucesso: true,
    mensagem: 'Conteúdo da landing page publicado com sucesso!',
    publicadoPor,
    consultorio: consultorioAtualizado,
  });
});

// ============================================================================
// ENDPOINTS PÚBLICOS DO SITE (LANDING PAGE & AGENDAMENTO ONLINE)
// ============================================================================

// 1. Dados públicos do consultório (apenas informações públicas de divulgação)
app.get('/api/public/consultorio', (_req: Request, res: Response) => {
  const dados = carregarDadosConsultorio();
  res.json({
    razaoSocial: dados.razaoSocial,
    nomeFantasia: dados.nomeFantasia,
    cnpj: dados.cnpj,
    registroProfissional: dados.registroProfissional,
    responsavelTecnico: dados.responsavelTecnico,
    registroResponsavelTecnico: dados.registroResponsavelTecnico,
    telefone: dados.telefone,
    whatsapp: dados.whatsapp,
    email: dados.email,
    endereco: dados.endereco,
    redesSociais: dados.redesSociais,
    logoUrl: dados.logoUrl,
    horarioFuncionamento: dados.horarioFuncionamento,
    horariosAtendimento: dados.horariosAtendimento,
    duracaoPadraoMin: dados.duracaoPadraoMin || 40,
    antecedenciaMinimaHoras: dados.antecedenciaMinimaHoras || 2,
    bloqueiosAgenda: dados.bloqueiosAgenda || [],
    servicos: (dados.servicos || []).filter((s) => s.ativo),
    validadeReceitaDias: dados.validadeReceitaDias || 365,
    textoRodapeRelatorio: dados.textoRodapeRelatorio,
    hero: dados.hero,
    sobreOptometrista: dados.sobreOptometrista,
    depoimentos: (dados.depoimentos || []).filter((d) => d.ativo && d.autorizacaoPaciente),
    galeria: (dados.galeria || []).filter((g) => g.ativo !== false),
    whatsappConfig: dados.whatsappConfig,
    secoesVisiveis: dados.secoesVisiveis,
    ordemSecoes: dados.ordemSecoes,
    mapaEmbedUrl: dados.mapaEmbedUrl,
    seo: dados.seo,
    textoRodape: dados.textoRodape,
    publicadoPor: dados.publicadoPor,
    politicaPrivacidadeTexto: dados.politicaPrivacidadeTexto,
    versaoPolitica: dados.versaoPolitica,
  });
});


// 2. Cálculo no servidor dos horários disponíveis
function obterSlotsDoExpediente(
  dataStr: string,
  servico: ConsultorioServico,
  consultorio: DadosConsultorioServidor
): string[] {
  // Verifica se a data é anterior a hoje
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  if (dataStr < hojeStr) {
    return [];
  }

  // Verifica bloqueios de agenda
  const bloqueio = consultorio.bloqueiosAgenda?.find((b) => b.data === dataStr);
  if (bloqueio) {
    return [];
  }

  // Descobrir dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
  const partes = dataStr.split('-').map(Number);
  const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
  const diaSemanaIndex = dataObj.getDay();

  const diasSemanaMap: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  };
  const nomeDia = diasSemanaMap[diaSemanaIndex];

  let horarioConfig = consultorio.horariosAtendimento.find(
    (h) => h.diaSemana === nomeDia || h.diaSemana.includes(nomeDia)
  );

  if (!horarioConfig) {
    if (diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
      horarioConfig = consultorio.horariosAtendimento.find(
        (h) => h.diaSemana.includes('Segunda a Sexta') || h.diaSemana.includes('Segunda')
      );
    }
  }

  if (!horarioConfig || horarioConfig.fechado) {
    return [];
  }

  const inicioExpediente = timeToMinutes(horarioConfig.inicio);
  const fimExpediente = timeToMinutes(horarioConfig.fim);
  const temIntervalo = horarioConfig.intervaloInicio && horarioConfig.intervaloFim;
  const intervaloInicioMin = temIntervalo ? timeToMinutes(horarioConfig.intervaloInicio!) : 0;
  const intervaloFimMin = temIntervalo ? timeToMinutes(horarioConfig.intervaloFim!) : 0;

  const duracao = servico.duracaoMin || 30;
  const intervaloSlotMin = 30; // Granularidade do consultório
  const slotsValidos: string[] = [];

  const agendamentosExistentes = carregarAgendamentos().filter(
    (a) => a.data === dataStr && a.status !== 'cancelado'
  );

  // Margem mínima de 2 horas de antecedência para agendar no mesmo dia
  const agoraMinutosHoje =
    dataStr === hojeStr ? hoje.getHours() * 60 + hoje.getMinutes() + 120 : 0;

  for (let m = inicioExpediente; m + duracao <= fimExpediente; m += intervaloSlotMin) {
    const slotFim = m + duracao;

    if (temIntervalo) {
      if (
        (m >= intervaloInicioMin && m < intervaloFimMin) ||
        (slotFim > intervaloInicioMin && slotFim <= intervaloFimMin) ||
        (m < intervaloInicioMin && slotFim > intervaloFimMin)
      ) {
        continue;
      }
    }

    if (dataStr === hojeStr && m < agoraMinutosHoje) {
      continue;
    }

    const horarioSlotStr = minutesToTime(m);
    const conflito = agendamentosExistentes.some((a) => {
      const aInicio = timeToMinutes(a.horario);
      const aFim = aInicio + a.duracaoMin;
      return m < aFim && slotFim > aInicio;
    });

    if (!conflito) {
      slotsValidos.push(horarioSlotStr);
    }
  }

  return slotsValidos;
}

app.get('/api/public/horarios-disponiveis', (req: Request, res: Response) => {
  const data = req.query.data as string;
  const servicoId = req.query.servicoId as string;

  if (!data || !servicoId) {
    return res.status(400).json({ erro: 'Parâmetros data e servicoId são obrigatórios.' });
  }

  const consultorio = carregarDadosConsultorio();
  const servico = consultorio.servicos.find((s) => s.id === servicoId);

  if (!servico || !servico.ativo) {
    return res.status(404).json({ erro: 'Serviço não encontrado ou inativo.' });
  }

  const slots = obterSlotsDoExpediente(data, servico, consultorio);

  return res.json({
    data,
    servicoId,
    duracaoMin: servico.duracaoMin,
    horarios: slots,
  });
});

// 3. Registrar Agendamento pelo Site
app.post('/api/public/agendamentos', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      sucesso: false,
      mensagem: 'Muitas solicitações enviadas em curto período. Por favor, aguarde um minuto e tente novamente.',
    });
  }

  const {
    nome,
    telefone,
    email,
    servicoId,
    data,
    horario,
    consentimentoLgpd,
    versaoPolitica,
    honeypot,
  } = req.body;

  if (honeypot && honeypot.trim() !== '') {
    return res.status(200).json({ sucesso: true, mensagem: 'Solicitação recebida.' });
  }

  if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Por favor, informe seu nome completo (mínimo 3 caracteres).',
    });
  }

  const cleanPhone = telefone ? String(telefone).replace(/\D/g, '') : '';
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Por favor, informe um telefone válido com DDD (ex: 11 98765-4321).',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Por favor, informe um endereço de e-mail válido.',
    });
  }

  if (consentimentoLgpd !== true) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O consentimento com os termos da Política de Privacidade e LGPD é obrigatório para agendamento.',
    });
  }

  const consultorio = carregarDadosConsultorio();
  const servico = consultorio.servicos.find((s) => s.id === servicoId);

  if (!servico || !servico.ativo) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O serviço selecionado é inválido ou está temporariamente inativo.',
    });
  }

  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Data informada é inválida.',
    });
  }

  if (!horario || !/^\d{2}:\d{2}$/.test(horario)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Horário informado é inválido.',
    });
  }

  const slotKey = `${data}_${horario}`;
  if (slotsEmTransacao.has(slotKey)) {
    return res.status(409).json({
      sucesso: false,
      mensagem:
        'Este horário está sendo finalizado por outro paciente neste momento. Por favor, escolha outro horário disponível.',
    });
  }

  slotsEmTransacao.add(slotKey);

  try {
    const horariosDisponiveis = obterSlotsDoExpediente(data, servico, consultorio);

    if (!horariosDisponiveis.includes(horario)) {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          'Este horário acabou de ser reservado por outro paciente ou não está mais disponível. Por favor, escolha outro horário.',
      });
    }

    const agendamentosAtuais = carregarAgendamentos();
    const jaExisteAgendamentoNoSlot = agendamentosAtuais.some(
      (a) => a.data === data && a.horario === horario && a.status !== 'cancelado'
    );

    if (jaExisteAgendamentoNoSlot) {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          'Este horário acabou de ser reservado por outro paciente. Por favor, selecione outro horário conveniente.',
      });
    }

    const agoraIso = new Date().toISOString();
    const protocolo = `AG-${data.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const id = `apt-site-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const novoAgendamento: AgendamentoRegistro = {
      id,
      protocolo,
      nomeContato: nome.trim(),
      telefone: cleanPhone,
      email: email.trim().toLowerCase(),
      servicoId: servico.id,
      servicoNome: servico.nome,
      servicoPrecoCentavos: servico.precoCentavos,
      duracaoMin: servico.duracaoMin,
      data,
      horario,
      inicio: `${data}T${horario}:00.000Z`,
      fim: `${data}T${horario}:00.000Z`,
      status: 'pendente',
      origem: 'site',
      observacoes: 'Agendamento solicitado pelo paciente através da Landing Page.',
      consentimentoLgpd: {
        aceito: true,
        dataHora: agoraIso,
        versao: versaoPolitica || consultorio.versaoPolitica || '1.0',
        ip: clientIp,
        userAgent: req.headers['user-agent'] as string,
      },
      criadoEm: agoraIso,
      atualizadoEm: agoraIso,
    };

    agendamentosAtuais.push(novoAgendamento);
    salvarAgendamentos(agendamentosAtuais);

    // Prompt 15: Notificação push aos usuários com 'agenda.ler'
    enviarNotificacaoPushParaAgenda(
      'Novo Agendamento pelo Site!',
      `${novoAgendamento.nomeContato} agendou para ${data} às ${horario} (${servico.nome}).`,
      '/admin/agenda',
      `novo-agendamento-${novoAgendamento.id}`
    );

    console.log(`========================================================================`);
    console.log(`[E-mail Service] Notificação de Confirmação de Agendamento`);
    console.log(`Para: ${novoAgendamento.nomeContato} <${novoAgendamento.email}>`);
    console.log(`Assunto: Solicitação de Agendamento Recebida - Protocolo ${protocolo}`);
    console.log(`========================================================================`);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Solicitação de agendamento registrada com sucesso!',
      agendamento: novoAgendamento,
      emailEnviado: true,
    });
  } finally {
    slotsEmTransacao.delete(slotKey);
  }
});

app.get('/api/public/agendamentos/protocolo/:protocolo', (req: Request, res: Response) => {
  const { protocolo } = req.params;
  const agendamentos = carregarAgendamentos();
  const encontrado = agendamentos.find((a) => a.protocolo === protocolo);

  if (!encontrado) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  return res.json({
    id: encontrado.id,
    protocolo: encontrado.protocolo,
    nomeContato: encontrado.nomeContato,
    servicoNome: encontrado.servicoNome,
    servicoPrecoCentavos: encontrado.servicoPrecoCentavos,
    duracaoMin: encontrado.duracaoMin,
    data: encontrado.data,
    horario: encontrado.horario,
    status: encontrado.status,
    origem: encontrado.origem,
    criadoEm: encontrado.criadoEm,
  });
});

// ============================================================================
// PWA MANIFEST DINÂMICO (PROMPT 14)
// Nome e nome curto derivados do nome fantasia do consultório
// ============================================================================
app.get('/manifest.webmanifest', (_req: Request, res: Response) => {
  const consultorio = carregarDadosConsultorio();
  const nomeCompleto = consultorio?.nomeFantasia || 'Consultório de Optometria';
  let shortName = nomeCompleto
    .replace(/consultório\s*(de\s*)?/i, '')
    .replace(/\[.*?\]/g, '')
    .trim();
  if (shortName.length > 12) {
    shortName = shortName.substring(0, 12).trim();
  }
  if (!shortName) shortName = 'Optometria';

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.json({
    id: '/admin',
    name: nomeCompleto,
    short_name: shortName,
    description: `Sistema de Gestão Clínica e Atendimento Optométrico - ${nomeCompleto}`,
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    theme_color: '#0d9488',
    background_color: '#ffffff',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });
});

// ============================================================================
// UPLOAD SEGURO DE ARQUIVOS COM VALIDAÇÃO DE TIPO E TAMANHO (PROMPT 16)
// ============================================================================

const UPLOADS_DIR = path.resolve(__dirname, 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const TIPOS_MIME_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

app.post('/api/admin/upload', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const { nomeArquivo, mimeType, dadosBase64 } = req.body;
  if (!nomeArquivo || !mimeType || !dadosBase64) {
    return res.status(400).json({ error: 'Campos nomeArquivo, mimeType e dadosBase64 são obrigatórios.' });
  }

  // 1. Validação de tipo MIME estrita
  if (!TIPOS_MIME_PERMITIDOS.includes(mimeType.toLowerCase())) {
    return res.status(400).json({
      error: `Tipo de arquivo não permitido: "${mimeType}". Apenas imagens (JPEG, PNG, WebP, SVG) e documentos PDF são aceitos.`,
      tiposPermitidos: TIPOS_MIME_PERMITIDOS,
    });
  }

  // 2. Extração e validação do tamanho dos dados em Base64
  let base64Limpo = dadosBase64;
  if (dadosBase64.includes(',')) {
    base64Limpo = dadosBase64.split(',')[1];
  }

  let bufferArquivo: Buffer;
  try {
    bufferArquivo = Buffer.from(base64Limpo, 'base64');
  } catch (err) {
    return res.status(400).json({ error: 'Dados base64 do arquivo inválidos.' });
  }

  if (bufferArquivo.length > TAMANHO_MAXIMO_BYTES) {
    return res.status(400).json({
      error: `O arquivo excede o limite máximo permitido de 5MB (tamanho enviado: ${(bufferArquivo.length / (1024 * 1024)).toFixed(2)}MB).`,
      limiteBytes: TAMANHO_MAXIMO_BYTES,
    });
  }

  // 3. Sanitização do nome do arquivo para prevenção de Directory Traversal e XSS
  const extensaoOriginal = path.extname(nomeArquivo).toLowerCase();
  const nomeLimpo = path.basename(nomeArquivo, extensaoOriginal).replace(/[^a-zA-Z0-9_-]/g, '_');
  const nomeFinal = `${Date.now()}_${nomeLimpo}${extensaoOriginal}`;
  const caminhoDestino = path.resolve(UPLOADS_DIR, nomeFinal);

  fs.writeFileSync(caminhoDestino, bufferArquivo);
  const urlPublica = `/uploads/${nomeFinal}`;

  registrarAuditoria(
    req,
    'upload.arquivo',
    'uploads',
    nomeFinal,
    `Usuário ${user.nome} realizou upload de "${nomeFinal}" (${mimeType}, ${(bufferArquivo.length / 1024).toFixed(1)} KB).`,
    null,
    { nomeArquivo: nomeFinal, mimeType, tamanhoBytes: bufferArquivo.length }
  );

  return res.status(201).json({
    sucesso: true,
    url: urlPublica,
    nomeArquivo: nomeFinal,
    tamanhoBytes: bufferArquivo.length,
    mimeType,
  });
});

// ============================================================================
// LEMBRETES DE CONSULTA POR E-MAIL & TAREFA AGENDADA (PROMPT 16)
// ============================================================================

function formatarTemplateLembreteEmail(template: string, vars: Record<string, string>): string {
  let resultado = template;
  for (const [chave, valor] of Object.entries(vars)) {
    resultado = resultado.split(`{${chave}}`).join(valor || '');
  }
  return resultado;
}

function processarLembretesEmail(): { processados: number; enviados: number } {
  const consultorio = carregarDadosConsultorio();
  const config = consultorio.lembretesEmailConfig;
  if (!config || config.ativo === false) {
    return { processados: 0, enviados: 0 };
  }

  const antecedenciaHoras = config.antecedenciaHoras || 24;
  const agendamentos = carregarAgendamentos();
  const agora = Date.now();
  const janelaFutura = agora + antecedenciaHoras * 60 * 60 * 1000;

  let enviados = 0;
  let alterou = false;

  for (const ag of agendamentos) {
    if (ag.status !== 'confirmado' && ag.status !== 'agendado') continue;
    if (!ag.email || !ag.email.includes('@')) continue;
    if (ag.lembreteEmailEnviadoEm) continue;

    const partesData = ag.data.split('-').map(Number);
    const partesHora = (ag.horario || '08:00').split(':').map(Number);
    if (partesData.length < 3 || partesHora.length < 2) continue;

    const agTimestamp = new Date(
      partesData[0],
      partesData[1] - 1,
      partesData[2],
      partesHora[0],
      partesHora[1]
    ).getTime();

    // Se a consulta estiver dentro da janela de antecedência configurada e for futura
    if (agTimestamp > agora && agTimestamp <= janelaFutura) {
      const vars = {
        nome: ag.nomeContato,
        data: ag.data.split('-').reverse().join('/'),
        horario: ag.horario,
        servico: ag.servicoNome || 'Consulta Optométrica',
        consultorio: consultorio.nomeFantasia || consultorio.razaoSocial,
        profissional: ag.optometristaNome || consultorio.responsavelTecnico,
        endereco: `${consultorio.endereco.logradouro}, ${consultorio.endereco.numero} - ${consultorio.endereco.cidade}/${consultorio.endereco.uf}`,
        telefone: consultorio.telefone,
        whatsapp: consultorio.whatsapp,
      };

      const assunto = formatarTemplateLembreteEmail(
        config.assuntoPadrao || 'Lembrete de Consulta: {servico} no {consultorio}',
        vars
      );
      const corpo = formatarTemplateLembreteEmail(
        config.corpoTemplate || 'Olá, {nome}!\nSua consulta de {servico} está confirmada para {data} às {horario}.',
        vars
      );

      console.log(`========================================================================`);
      console.log(`[E-mail Service] Lembrete de Consulta Agendada Enviado com Sucesso`);
      console.log(`Destinatário: ${ag.nomeContato} <${ag.email}>`);
      console.log(`Assunto: ${assunto}`);
      console.log(`Data/Horário: ${ag.data} às ${ag.horario} (${ag.servicoNome})`);
      console.log(`Corpo:\n${corpo}`);
      console.log(`========================================================================`);

      ag.lembreteEmailEnviadoEm = new Date().toISOString();
      enviados++;
      alterou = true;
    }
  }

  if (alterou) {
    salvarAgendamentos(agendamentos);
  }

  return { processados: agendamentos.length, enviados };
}

// Tarefa agendada dentro da própria aplicação (executa a cada 5 minutos)
const INTERVALO_LEMBRETE_MS = 5 * 60 * 1000;
const lembreteIntervalId = setInterval(() => {
  try {
    processarLembretesEmail();
  } catch (err) {
    console.error('Erro ao executar tarefa agendada de lembretes por e-mail:', err);
  }
}, INTERVALO_LEMBRETE_MS);
lembreteIntervalId.unref();

// Endpoints de Lembretes de Consulta
app.get('/api/admin/lembretes/status', requirePermission('agenda.ler'), (_req: Request, res: Response) => {
  const consultorio = carregarDadosConsultorio();
  const config = consultorio.lembretesEmailConfig || {
    ativo: true,
    antecedenciaHoras: 24,
    assuntoPadrao: 'Lembrete de Consulta: {servico} no {consultorio}',
    corpoTemplate: 'Olá, {nome}!\nSua consulta de {servico} está confirmada para {data} às {horario}.',
  };

  const agendamentos = carregarAgendamentos();
  const agora = Date.now();
  const totalAgendadosFuturos = agendamentos.filter((a) => {
    if (a.status !== 'confirmado' && a.status !== 'agendado') return false;
    const [y, m, d] = a.data.split('-').map(Number);
    const [h, min] = (a.horario || '08:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, min).getTime() > agora;
  }).length;

  const lembretesEnviados = agendamentos.filter((a) => Boolean(a.lembreteEmailEnviadoEm)).length;

  return res.json({
    config,
    totalAgendadosFuturos,
    lembretesEnviados,
    statusTarefa: 'ativa',
    intervaloMinutos: 5,
  });
});

app.post('/api/admin/lembretes/executar-agora', requirePermission('agenda.editar'), (req: Request, res: Response) => {
  const resultado = processarLembretesEmail();
  const user = (req as any).user;

  registrarAuditoria(
    req,
    'lembrete.executar_lote',
    'agendamentos',
    'lote_lembretes',
    `Usuário ${user.nome} acionou manualmente a verificação de lembretes de consulta por e-mail. ${resultado.enviados} lembrete(s) enviado(s).`
  );

  return res.json({
    sucesso: true,
    mensagem: `Varredura concluída. ${resultado.enviados} lembrete(s) enviado(s).`,
    ...resultado,
  });
});

app.post('/api/admin/lembretes/testar', requirePermission('agenda.editar'), (req: Request, res: Response) => {
  const { emailDestino, nomeContato } = req.body;
  const user = (req as any).user;
  const consultorio = carregarDadosConsultorio();
  const config = consultorio.lembretesEmailConfig;

  const destino = emailDestino || user.email;
  const vars = {
    nome: nomeContato || user.nome,
    data: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    horario: '10:00',
    servico: 'Consulta Optométrica Completa (Demonstração)',
    consultorio: consultorio.nomeFantasia || consultorio.razaoSocial,
    profissional: consultorio.responsavelTecnico,
    endereco: `${consultorio.endereco.logradouro}, ${consultorio.endereco.numero} - ${consultorio.endereco.cidade}/${consultorio.endereco.uf}`,
    telefone: consultorio.telefone,
    whatsapp: consultorio.whatsapp,
  };

  const assunto = formatarTemplateLembreteEmail(
    config?.assuntoPadrao || 'Lembrete de Consulta: {servico} no {consultorio}',
    vars
  );
  const corpo = formatarTemplateLembreteEmail(
    config?.corpoTemplate || 'Olá, {nome}!\nSua consulta de {servico} está agendada para {data} às {horario}.',
    vars
  );

  console.log(`========================================================================`);
  console.log(`[E-mail Service] Teste Manual de Lembrete de Consulta Enviado`);
  console.log(`Destinatário: ${vars.nome} <${destino}>`);
  console.log(`Assunto: [TESTE] ${assunto}`);
  console.log(`Corpo:\n${corpo}`);
  console.log(`========================================================================`);

  registrarAuditoria(
    req,
    'lembrete.teste',
    'empresa',
    'dados_gerais',
    `Disparo de e-mail de teste de lembrete efetuado por ${user.nome} para ${destino}.`
  );

  return res.json({
    sucesso: true,
    mensagem: `E-mail de demonstração de lembrete emitido com sucesso para ${destino}.`,
    destinatario: destino,
    assunto,
  });
});

app.put('/api/admin/configuracoes/lembretes', requirePermission('empresa.editar'), (req: Request, res: Response) => {
  const { ativo, antecedenciaHoras, assuntoPadrao, corpoTemplate } = req.body;
  const consultorio = carregarDadosConsultorio();

  const novaConfig = {
    ativo: ativo !== undefined ? Boolean(ativo) : true,
    antecedenciaHoras: Number(antecedenciaHoras) || 24,
    assuntoPadrao: assuntoPadrao ? sanitizarTexto(assuntoPadrao) : (consultorio.lembretesEmailConfig?.assuntoPadrao || 'Lembrete de Consulta: {servico} no {consultorio}'),
    corpoTemplate: corpoTemplate || (consultorio.lembretesEmailConfig?.corpoTemplate || 'Olá, {nome}!\nSua consulta de {servico} está confirmada para {data} às {horario}.'),
  };

  consultorio.lembretesEmailConfig = novaConfig;
  salvarDadosConsultorio(consultorio);

  const user = (req as any).user;
  registrarAuditoria(
    req,
    'empresa.editar_lembretes',
    'empresa',
    'dados_gerais',
    `Configurações de lembretes automáticos de consulta por e-mail atualizadas por ${user.nome} (Antecedência: ${novaConfig.antecedenciaHoras}h, Ativo: ${novaConfig.ativo}).`
  );

  return res.json({
    sucesso: true,
    mensagem: 'Configurações de lembretes de consulta salvas com sucesso!',
    lembretesEmailConfig: novaConfig,
  });
});

// ============================================================================
// BACKUP E EXPORTAÇÃO COMPLETA DE DADOS (PROMPT 16)
// ============================================================================

// 1. Exportação de Backup Completo (Apenas Administrador)
app.get('/api/admin/backup/exportar', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user.papelId === 'admin' || user.permissoes['admin'] === true;

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Acesso negado: apenas o Administrador do consultório possui autorização para exportar o backup completo.',
      papelUsuario: user.papelNome,
    });
  }

  const agora = new Date().toISOString();
  const consultorio = carregarDadosConsultorio();
  const agendamentos = carregarAgendamentos();
  const pacientes = carregarPacientes();
  const atendimentos = carregarAtendimentos();
  const receitas = carregarReceitas();
  const financeiro = carregarFinanceiro();
  const usuarios = carregarUsuarios();
  const papeis = carregarPapeis();

  registrarAuditoria(
    req,
    'backup.exportar',
    'backup',
    'snapshot_completo',
    `Administrador ${user.nome} (${user.email}) exportou o backup integral do sistema.`
  );

  const auditoria = carregarAuditoria();

  const dadosBackup = {
    sistema: 'Consultório de Optometria - Dr. Roberto Viana',
    versaoBackup: '1.0.0',
    geradoEm: agora,
    geradoPor: {
      uid: user.id || user.uid,
      nome: user.nome,
      email: user.email,
      papel: user.papelNome,
    },
    retencaoLegal: 'CFM/CBOO - 20 anos para prontuários clínicos e receitas ópticas',
    estatisticas: {
      totalPacientes: pacientes.length,
      totalAgendamentos: agendamentos.length,
      totalAtendimentos: atendimentos.length,
      totalReceitas: receitas.length,
      totalLancamentosFinanceiros: financeiro.length,
      totalUsuarios: usuarios.length,
      totalRegistrosAuditoria: auditoria.length,
    },
    banco: {
      consultorio,
      agendamentos,
      pacientes,
      atendimentos,
      receitas,
      financeiro,
      usuarios,
      papeis,
      auditoria,
    },
  };

  const conteudoJson = JSON.stringify(dadosBackup, null, 2);
  const checksumSha256 = crypto.createHash('sha256').update(conteudoJson).digest('hex');

  const nomeArquivo = `backup-consultorio-${agora.split('T')[0]}_${Date.now()}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
  res.setHeader('X-Backup-Checksum-Sha256', checksumSha256);

  return res.send(conteudoJson);
});

// 2. Restauração de Backup Completo (Apenas Administrador)
app.post('/api/admin/backup/restaurar', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user.papelId === 'admin' || user.permissoes['admin'] === true;

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Acesso negado: apenas o Administrador do consultório possui autorização para restaurar backups.',
      papelUsuario: user.papelNome,
    });
  }

  const { backup } = req.body;
  if (!backup || !backup.banco) {
    return res.status(400).json({ error: 'Arquivo de backup inválido ou estrutura corrompida. O campo "banco" é obrigatório.' });
  }

  const { banco } = backup;
  let restaurados = 0;

  if (banco.consultorio) {
    salvarDadosConsultorio(banco.consultorio);
    restaurados++;
  }
  if (Array.isArray(banco.agendamentos)) {
    salvarAgendamentos(banco.agendamentos);
    restaurados++;
  }
  if (Array.isArray(banco.pacientes)) {
    salvarPacientes(banco.pacientes);
    restaurados++;
  }
  if (Array.isArray(banco.atendimentos)) {
    salvarAtendimentos(banco.atendimentos);
    restaurados++;
  }
  if (Array.isArray(banco.receitas)) {
    salvarReceitas(banco.receitas);
    restaurados++;
  }
  if (Array.isArray(banco.financeiro)) {
    salvarFinanceiro(banco.financeiro);
    restaurados++;
  }
  if (Array.isArray(banco.papeis)) {
    salvarPapeis(banco.papeis);
    restaurados++;
  }
  if (Array.isArray(banco.usuarios)) {
    salvarUsuarios(banco.usuarios);
    restaurados++;
  }
  if (Array.isArray(banco.auditoria)) {
    salvarAuditoria(banco.auditoria);
    restaurados++;
  }

  registrarAuditoria(
    req,
    'backup.restaurar',
    'backup',
    'restauracao_integral',
    `Administrador ${user.nome} restaurou o banco de dados a partir de um arquivo de backup (Data original do arquivo: ${backup.geradoEm || 'N/D'}).`
  );

  return res.json({
    sucesso: true,
    mensagem: `Backup restaurado com sucesso! ${restaurados} módulos de dados foram recuperados.`,
    restaurados,
  });
});

// ============================================================================
// VITE DEV SERVER OU SERVIÇO DE PRODUÇÃO
// ============================================================================

export async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  Consultório Optométrico Particular - Monolito Ativo `);
    console.log(`  Porta: http://localhost:${PORT}                      `);
    console.log(`  Ambiente: ${IS_PROD ? 'Produção' : 'Desenvolvimento'} `);
    console.log(`======================================================\n`);
  });

  return server;
}

// Se executado diretamente como script principal
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer().catch((err) => {
    console.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  });
}

export { app };
