import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Image as ImageIcon,
  Clock,
  Glasses,
  FileText,
  ListPlus,
  Save,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  ShieldCheck,
  Send,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
  Info,
  Mail,
  Database,
  Download,
  UploadCloud,
  HardDrive,
  Play,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import {
  validarCNPJ,
  formatarCNPJ,
  validarCEP,
  formatarCEP,
  validarTelefoneBR,
  formatarTelefoneBR,
  validarEmail,
  validarArquivoImagem,
} from '../../utils/validators';
import { formatCurrencyFromCents, parseToCents } from '../../utils/formatters';
import {
  Consultorio,
  ConsultorioHorario,
  ConsultorioServico,
  BloqueioAgenda,
  FormaPagamento,
  CategoriaDespesa,
  MotivoCancelamento,
  MensagemPadraoWhatsapp,
} from '../../types';

type TabKey =
  | 'identificacao'
  | 'contato'
  | 'marca'
  | 'atendimento'
  | 'servicos'
  | 'receita'
  | 'auxiliares'
  | 'lembretes'
  | 'backup';

export const CompanySettingsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { consultorio, atualizarConsultorio } = useConsultorio();
  const podeSalvar = hasPermission('empresa.editar');
  const isAdmin = user?.role === 'admin' || user?.papelId === 'admin' || hasPermission('admin') || hasPermission('usuarios.gerenciar');

  const [activeTab, setActiveTab] = useState<TabKey>('identificacao');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // 1. Identificação
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavelTecnico, setResponsavelTecnico] = useState('');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [registroResponsavelTecnico, setRegistroResponsavelTecnico] = useState('');

  // 2. Contato e Endereço
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // 3. Marca
  const [logoUrl, setLogoUrl] = useState('');
  const [carimboUrl, setCarimboUrl] = useState('');
  const [assinaturaUrl, setAssinaturaUrl] = useState('');

  // 4. Atendimento
  const [horariosAtendimento, setHorariosAtendimento] = useState<ConsultorioHorario[]>([]);
  const [intervaloMin, setIntervaloMin] = useState<number>(15);
  const [duracaoPadraoMin, setDuracaoPadraoMin] = useState<number>(40);
  const [antecedenciaMinimaHoras, setAntecedenciaMinimaHoras] = useState<number>(2);
  const [bloqueiosAgenda, setBloqueiosAgenda] = useState<BloqueioAgenda[]>([]);

  // 5. Serviços
  const [servicos, setServicos] = useState<ConsultorioServico[]>([]);
  const [servicoModalAberto, setServicoModalAberto] = useState(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<ConsultorioServico | null>(null);

  // 6. Receita e Relatórios
  const [validadeReceitaDias, setValidadeReceitaDias] = useState<number>(365);
  const [camposObrigatoriosReceita, setCamposObrigatoriosReceita] = useState<string[]>([]);
  const [textoRodapeRelatorio, setTextoRodapeRelatorio] = useState('');

  // 7. Cadastros Auxiliares
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [categoriasDespesa, setCategoriasDespesa] = useState<CategoriaDespesa[]>([]);
  const [motivosCancelamento, setMotivosCancelamento] = useState<MotivoCancelamento[]>([]);
  const [mensagensPadraoWhatsapp, setMensagensPadraoWhatsapp] = useState<MensagemPadraoWhatsapp[]>([]);
  const [subAbaAuxiliar, setSubAbaAuxiliar] = useState<'pagamento' | 'despesas' | 'cancelamento' | 'whatsapp'>('pagamento');

  // Modal para Bloqueio de Agenda
  const [bloqueioModalAberto, setBloqueioModalAberto] = useState(false);
  const [novoBloqueioDataInicio, setNovoBloqueioDataInicio] = useState('');
  const [novoBloqueioDataFim, setNovoBloqueioDataFim] = useState('');
  const [novoBloqueioMotivo, setNovoBloqueioMotivo] = useState('');

  // 8. Lembretes por E-mail (Prompt 16)
  const [lembretesAtivo, setLembretesAtivo] = useState(true);
  const [lembretesAntecedencia, setLembretesAntecedencia] = useState(24);
  const [lembretesAssunto, setLembretesAssunto] = useState('Lembrete de Consulta: {servico} no {consultorio}');
  const [lembretesCorpo, setLembretesCorpo] = useState(
    'Olá, {nome}!\n\nEste é um lembrete amigável de que seu exame de {servico} está agendado para amanhã, {data}, às {horario}, com {profissional} no {consultorio}.\n\nEndereço: {endereco}\nTelefone: {telefone} / WhatsApp: {whatsapp}\n\nRecomendações importantes:\n- Se você já utiliza óculos de grau ou lentes de contato atuais, traga-os consigo no momento da consulta.\n- Chegue com 10 minutos de antecedência.\n\nCaso necessite reagendar, favor entrar em contato antecipadamente pelo telefone ou WhatsApp.\n\nAtenciosamente,\nEquipe {consultorio}'
  );
  const [emailTesteDestino, setEmailTesteDestino] = useState('');
  const [enviandoTesteEmail, setEnviandoTesteEmail] = useState(false);
  const [executandoLembretes, setExecutandoLembretes] = useState(false);

  // 9. Backup & Exportação (Prompt 16)
  const [exportandoBackup, setExportandoBackup] = useState(false);
  const [restaurandoBackup, setRestaurandoBackup] = useState(false);
  const [backupFileInput, setBackupFileInput] = useState<File | null>(null);

  // Inicialização do estado a partir do context
  useEffect(() => {
    if (consultorio) {
      setRazaoSocial(consultorio.razaoSocial || '');
      setNomeFantasia(consultorio.nomeFantasia || '');
      setCnpj(consultorio.cnpj || '');
      setResponsavelTecnico(consultorio.responsavelTecnico || '');
      setRegistroProfissional(consultorio.registroProfissional || '');
      setRegistroResponsavelTecnico(consultorio.registroResponsavelTecnico || '');

      setTelefone(consultorio.telefone || '');
      setWhatsapp(consultorio.whatsapp || '');
      setEmail(consultorio.email || '');

      const end = consultorio.endereco || {};
      setCep(end.cep || '');
      setLogradouro(end.logradouro || '');
      setNumero(end.numero || '');
      setComplemento(end.complemento || '');
      setBairro(end.bairro || '');
      setCidade(end.cidade || '');
      setUf(end.uf || '');

      const redes = consultorio.redesSociais || {};
      setInstagram(redes.instagram || '');
      setFacebook(redes.facebook || '');
      setLinkedin(redes.linkedin || '');
      setWebsite(redes.website || '');

      setLogoUrl(consultorio.logoUrl || '');
      setCarimboUrl(consultorio.carimboUrl || '');
      setAssinaturaUrl(consultorio.assinaturaUrl || '');

      setHorariosAtendimento(consultorio.horariosAtendimento || []);
      setIntervaloMin(consultorio.intervaloMin || 15);
      setDuracaoPadraoMin(consultorio.duracaoPadraoMin || 40);
      setAntecedenciaMinimaHoras(consultorio.antecedenciaMinimaHoras || 2);
      setBloqueiosAgenda(consultorio.bloqueiosAgenda || []);

      setServicos(consultorio.servicos || []);

      setValidadeReceitaDias(consultorio.validadeReceitaDias || 365);
      setCamposObrigatoriosReceita(
        consultorio.camposObrigatoriosReceita || [
          'od_esferico',
          'od_cilindrico',
          'od_eixo',
          'oe_esferico',
          'oe_cilindrico',
          'oe_eixo',
          'adicao',
          'dnp',
          'validadeAte',
        ]
      );
      setTextoRodapeRelatorio(
        consultorio.textoRodapeRelatorio ||
          'Consultório Clínico de Optometria Dr. Roberto Viana • Atendimento primário da saúde visual refrativa individualizada. Exclusividade clínica de optometria sem venda de óculos ou lentes corretivas.'
      );

      setFormasPagamento(
        consultorio.formasPagamento || [
          { id: 'fp-01', nome: 'Pix (Chave ou QR Code)', ativo: true, padrao: true },
          { id: 'fp-02', nome: 'Dinheiro em Espécie', ativo: true },
          { id: 'fp-03', nome: 'Cartão de Débito', ativo: true },
          { id: 'fp-04', nome: 'Cartão de Crédito à Vista', ativo: true },
          { id: 'fp-05', nome: 'Cartão de Crédito Parcelado', ativo: true },
        ]
      );

      setCategoriasDespesa(
        consultorio.categoriasDespesa || [
          { id: 'cd-01', nome: 'Aluguel & Condomínio', ativo: true },
          { id: 'cd-02', nome: 'Energia & Água', ativo: true },
          { id: 'cd-03', nome: 'Internet & Telefonia', ativo: true },
          { id: 'cd-04', nome: 'Insumos Clínicos & Esterilização', ativo: true },
          { id: 'cd-05', nome: 'Softwares & TI', ativo: true },
          { id: 'cd-06', nome: 'Manutenção de Equipamentos', ativo: true },
          { id: 'cd-07', nome: 'Impostos e Anuidades CBOO', ativo: true },
          { id: 'cd-08', nome: 'Pessoal & Honorários', ativo: true },
        ]
      );

      setMotivosCancelamento(
        consultorio.motivosCancelamento || [
          { id: 'mc-01', nome: 'Desistência do paciente', ativo: true },
          { id: 'mc-02', nome: 'Imprevisto de saúde / emergência', ativo: true },
          { id: 'mc-03', nome: 'Conflito de horário de trabalho', ativo: true },
          { id: 'mc-04', nome: 'Falta sem justificativa prévia', ativo: true },
          { id: 'mc-05', nome: 'Reagendamento solicitado para outra data', ativo: true },
        ]
      );

      setMensagensPadraoWhatsapp(
        consultorio.mensagensPadraoWhatsapp || [
          {
            id: 'mp-01',
            tipo: 'confirmacao',
            titulo: 'Confirmação de Agendamento',
            template:
              'Olá {nome}! Sua consulta de {servico} no Consultório de Optometria está confirmada para {data} às {hora}. Em caso de dúvidas, estamos à disposição!',
            ativo: true,
          },
          {
            id: 'mp-02',
            tipo: 'lembrete',
            titulo: 'Lembrete de Consulta (24h antes)',
            template:
              'Olá {nome}, lembrete do seu exame de {servico} amanhã, {data}, às {hora}. Traga seus óculos ou lentes de contato atuais se utilizar. Responda 1 para confirmar.',
            ativo: true,
          },
          {
            id: 'mp-03',
            tipo: 'retorno',
            titulo: 'Aviso de Retorno Preventivo',
            template:
              'Olá {nome}! Já se aproxima a data do seu retorno preventivo de {servico}. Gostaria de verificar os horários disponíveis para sua avaliação visual?',
            ativo: true,
          },
          {
            id: 'mp-04',
            tipo: 'cancelamento',
            titulo: 'Confirmação de Cancelamento',
            template:
              'Olá {nome}, confirmamos o cancelamento da sua consulta de {servico} prevista para {data} às {hora}. Quando quiser reagendar, estamos prontos para lhe atender.',
            ativo: true,
          },
        ]
      );

      if (consultorio.lembretesEmailConfig) {
        setLembretesAtivo(consultorio.lembretesEmailConfig.ativo !== false);
        setLembretesAntecedencia(consultorio.lembretesEmailConfig.antecedenciaHoras || 24);
        if (consultorio.lembretesEmailConfig.assuntoPadrao) {
          setLembretesAssunto(consultorio.lembretesEmailConfig.assuntoPadrao);
        }
        if (consultorio.lembretesEmailConfig.corpoTemplate) {
          setLembretesCorpo(consultorio.lembretesEmailConfig.corpoTemplate);
        }
      }
    }
  }, [consultorio]);

  // Busca de Endereço via ViaCEP
  const handleBuscarCep = async () => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) {
      setMensagemErro('Informe um CEP válido com 8 dígitos para realizar a busca.');
      return;
    }
    setBuscandoCep(true);
    setMensagemErro('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        setMensagemErro('CEP não encontrado na base dos Correios.');
      } else {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setUf(data.uf || '');
      }
    } catch {
      setMensagemErro('Erro ao conectar com o serviço de busca de CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Upload e Validação de Imagem com Leitura em Base64
  const handleUploadImagem = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    campoNome: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validacao = validarArquivoImagem(file);
    if (!validacao.valido) {
      setMensagemErro(validacao.erro || `Erro ao carregar imagem para ${campoNome}.`);
      e.target.value = '';
      return;
    }

    setMensagemErro('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.onerror = () => {
      setMensagemErro(`Falha ao ler o arquivo para ${campoNome}.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Salvar alterações gerais
  const handleSalvar = async () => {
    if (!podeSalvar) {
      setMensagemErro('Seu papel de usuário não possui permissão para editar os dados da empresa (empresa.editar).');
      return;
    }

    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    // Validações
    if (cnpj && !validarCNPJ(cnpj)) {
      setMensagemErro('CNPJ informado é inválido. Verifique os dígitos verificadores.');
      setActiveTab('identificacao');
      setSalvando(false);
      return;
    }

    if (cep && !validarCEP(cep)) {
      setMensagemErro('CEP informado deve conter exatamente 8 dígitos.');
      setActiveTab('contato');
      setSalvando(false);
      return;
    }

    if (telefone && !validarTelefoneBR(telefone)) {
      setMensagemErro('Telefone comercial informado é inválido.');
      setActiveTab('contato');
      setSalvando(false);
      return;
    }

    if (whatsapp && !validarTelefoneBR(whatsapp)) {
      setMensagemErro('WhatsApp comercial informado é inválido.');
      setActiveTab('contato');
      setSalvando(false);
      return;
    }

    if (email && !validarEmail(email)) {
      setMensagemErro('E-mail informado possui formato incorreto.');
      setActiveTab('contato');
      setSalvando(false);
      return;
    }

    try {
      const payload: Partial<Omit<Consultorio, 'id'>> = {
        razaoSocial,
        nomeFantasia,
        cnpj,
        responsavelTecnico,
        registroProfissional,
        registroResponsavelTecnico,
        telefone,
        whatsapp,
        email,
        endereco: {
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          cep,
        },
        redesSociais: {
          instagram,
          facebook,
          linkedin,
          website,
        },
        logoUrl,
        carimboUrl,
        assinaturaUrl,
        horariosAtendimento,
        intervaloMin,
        duracaoPadraoMin,
        antecedenciaMinimaHoras,
        bloqueiosAgenda,
        servicos,
        validadeReceitaDias,
        camposObrigatoriosReceita,
        textoRodapeRelatorio,
        formasPagamento,
        categoriasDespesa,
        motivosCancelamento,
        mensagensPadraoWhatsapp,
        lembretesEmailConfig: {
          ativo: lembretesAtivo,
          antecedenciaHoras: Number(lembretesAntecedencia) || 24,
          assuntoPadrao: lembretesAssunto,
          corpoTemplate: lembretesCorpo,
        },
      };

      await atualizarConsultorio(payload);
      setMensagemSucesso('Dados do consultório atualizados com sucesso! A landing page e os agendamentos já refletem as novas informações.');
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar dados no servidor.';
      setMensagemErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  // Gerenciamento de Horários
  const handleHorarioChange = (
    index: number,
    campo: keyof ConsultorioHorario,
    valor: string | boolean
  ) => {
    setHorariosAtendimento((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Adicionar Bloqueio de Agenda
  const handleAdicionarBloqueio = () => {
    if (!novoBloqueioDataInicio) {
      setMensagemErro('Informe a data de início do bloqueio.');
      return;
    }
    const novo: BloqueioAgenda = {
      id: `blq-${Date.now()}`,
      dataInicio: novoBloqueioDataInicio,
      dataFim: novoBloqueioDataFim || novoBloqueioDataInicio,
      data: novoBloqueioDataInicio,
      motivo: novoBloqueioMotivo.trim() || 'Bloqueio de Agenda / Feriado',
    };
    setBloqueiosAgenda((prev) => [...prev, novo]);
    setNovoBloqueioDataInicio('');
    setNovoBloqueioDataFim('');
    setNovoBloqueioMotivo('');
    setBloqueioModalAberto(false);
    setMensagemSucesso('Período de bloqueio adicionado na lista. Clique em Salvar para persistir.');
  };

  const handleRemoverBloqueio = (id?: string, data?: string) => {
    setBloqueiosAgenda((prev) => prev.filter((b) => (b.id ? b.id !== id : b.data !== data)));
  };

  // Salvar Serviço (Modal)
  const handleSalvarServico = (servico: ConsultorioServico) => {
    setServicos((prev) => {
      const idx = prev.findIndex((s) => s.id === servico.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = servico;
        return copia;
      }
      return [...prev, servico];
    });
    setServicoModalAberto(false);
    setServicoEmEdicao(null);
  };

  const handleRemoverServico = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço? Registros de agendamento anteriores permanecerão arquivados.')) {
      setServicos((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Alternar campo obrigatório da receita
  const handleToggleCampoReceita = (campoId: string) => {
    setCamposObrigatoriosReceita((prev) =>
      prev.includes(campoId) ? prev.filter((c) => c !== campoId) : [...prev, campoId]
    );
  };

  // Helpers de Cadastros Auxiliares
  const handleAdicionarAuxiliar = (tipo: 'pagamento' | 'despesas' | 'cancelamento') => {
    const nome = prompt('Informe o nome do novo item:');
    if (!nome || !nome.trim()) return;

    const id = `${tipo.slice(0, 2)}-${Date.now()}`;
    if (tipo === 'pagamento') {
      setFormasPagamento((prev) => [...prev, { id, nome: nome.trim(), ativo: true }]);
    } else if (tipo === 'despesas') {
      setCategoriasDespesa((prev) => [...prev, { id, nome: nome.trim(), ativo: true }]);
    } else if (tipo === 'cancelamento') {
      setMotivosCancelamento((prev) => [...prev, { id, nome: nome.trim(), ativo: true }]);
    }
  };

  // Ações de Lembrete por E-mail (Prompt 16)
  const handleTestarLembreteEmail = async () => {
    if (!emailTesteDestino || !validarEmail(emailTesteDestino)) {
      setMensagemErro('Informe um e-mail de destino válido para o envio do teste.');
      return;
    }
    setEnviandoTesteEmail(true);
    setMensagemErro('');
    try {
      const res = await fetch('/api/admin/lembretes/testar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ emailDestino: emailTesteDestino }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar e-mail de teste.');
      setMensagemSucesso(`E-mail de lembrete de teste disparado com sucesso para ${emailTesteDestino}! Verifique a caixa de entrada.`);
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err: unknown) {
      setMensagemErro(err instanceof Error ? err.message : 'Falha ao disparar teste de lembrete.');
    } finally {
      setEnviandoTesteEmail(false);
    }
  };

  const handleExecutarLembretesAgora = async () => {
    setExecutandoLembretes(true);
    setMensagemErro('');
    try {
      const res = await fetch('/api/admin/lembretes/executar-agora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar lembretes.');
      setMensagemSucesso(data.mensagem || `Verificação concluída. ${data.enviados} lembrete(s) enviado(s).`);
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err: unknown) {
      setMensagemErro(err instanceof Error ? err.message : 'Falha ao executar varredura.');
    } finally {
      setExecutandoLembretes(false);
    }
  };

  // Ações de Backup e Exportação (Prompt 16)
  const handleExportarBackup = async () => {
    setExportandoBackup(true);
    setMensagemErro('');
    try {
      const res = await fetch('/api/admin/backup/exportar', {
        headers: {
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao exportar backup.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-consultorio-${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMensagemSucesso('Backup completo do consultório exportado com sucesso! Arquivo JSON seguro gerado com Checksum SHA-256.');
      setTimeout(() => setMensagemSucesso(''), 6000);
    } catch (err: unknown) {
      setMensagemErro(err instanceof Error ? err.message : 'Falha ao exportar backup.');
    } finally {
      setExportandoBackup(false);
    }
  };

  const handleRestaurarBackupArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: A restauração do backup irá substituir as coleções atuais pelos dados do arquivo. Esta operação é irreversível. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    setRestaurandoBackup(true);
    setMensagemErro('');
    try {
      const text = await file.text();
      const backupJson = JSON.parse(text);
      const res = await fetch('/api/admin/backup/restaurar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ backup: backupJson }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao restaurar backup.');
      setMensagemSucesso(`Backup restaurado com sucesso! ${data.restaurados} módulos foram recuperados com integridade.`);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: unknown) {
      setMensagemErro(err instanceof Error ? err.message : 'Arquivo de backup inválido ou corrompido.');
    } finally {
      setRestaurandoBackup(false);
      e.target.value = '';
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'identificacao', label: '1. Identificação', icon: Building2 },
    { key: 'contato', label: '2. Contato & Endereço', icon: MapPin },
    { key: 'marca', label: '3. Marca & Assinatura', icon: ImageIcon },
    { key: 'atendimento', label: '4. Atendimento & Bloqueios', icon: Clock },
    { key: 'servicos', label: '5. Serviços Clínicos', icon: Glasses },
    { key: 'receita', label: '6. Receituário & Relatórios', icon: FileText },
    { key: 'auxiliares', label: '7. Cadastros Auxiliares', icon: ListPlus },
    { key: 'lembretes', label: '8. Lembretes por E-mail', icon: Mail },
    { key: 'backup', label: '9. Backup & Exportação', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dados da Empresa & Consultório
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Exclusividade Clínica Optometrista
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestão dos dados institucionais, regras de atendimento, marca, serviços e cadastros auxiliares do consultório particular.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || !podeSalvar}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition-all ${
              !podeSalvar
                ? 'bg-slate-400 cursor-not-allowed'
                : salvando
                ? 'bg-teal-400 cursor-wait'
                : 'bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-teal-600/20'
            }`}
          >
            {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {mensagemSucesso && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{mensagemSucesso}</div>
          <button onClick={() => setMensagemSucesso('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{mensagemErro}</div>
          <button onClick={() => setMensagemErro('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!podeSalvar && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Modo somente leitura. Seu papel de acesso atual não possui a permissão <code>empresa.editar</code>. As modificações não poderão ser salvas.
          </span>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {/* ABA 1: IDENTIFICAÇÃO */}
        {activeTab === 'identificacao' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Identificação Cadastral do Consultório</h2>
              <p className="text-xs text-slate-500">
                Informações jurídicas e registros dos órgãos de classe do consultório particular de optometria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Consultório de Optometria Dr. Roberto Viana Ltda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: Consultório de Optometria Dr. Roberto Viana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  CNPJ (14 dígitos) *
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 ${
                    cnpj && !validarCNPJ(cnpj)
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-teal-500/20 focus:border-teal-600'
                  }`}
                />
                {cnpj && !validarCNPJ(cnpj) && (
                  <p className="text-xs text-rose-600 mt-1">CNPJ inválido (dígitos verificadores incorretos).</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Responsável Técnico (Optometrista) *
                </label>
                <input
                  type="text"
                  value={responsavelTecnico}
                  onChange={(e) => setResponsavelTecnico(e.target.value)}
                  placeholder="Ex: Dr. Roberto Viana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registro Profissional da Clínica (CBOO / CROO)
                </label>
                <input
                  type="text"
                  value={registroProfissional}
                  onChange={(e) => setRegistroProfissional(e.target.value)}
                  placeholder="Ex: CBOO 14.892-SP | CBO 3223-05"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registro Profissional do RT (CBOO / CROO)
                </label>
                <input
                  type="text"
                  value={registroResponsavelTecnico}
                  onChange={(e) => setRegistroResponsavelTecnico(e.target.value)}
                  placeholder="Ex: CBOO 14.892-SP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 leading-relaxed">
              <span className="font-semibold block mb-1">Regra de Exclusividade Clínica Optométrica:</span>
              O sistema opera estritamente para clínicas e consultórios de optometria (atenção primária visual, exames de refração, ceratometria e adaptação de lentes de contato). Toda e qualquer operação de comércio óptico, venda de armações ou loja de óculos é proibida por deontologia profissional (CBO 3223-05).
            </div>
          </div>
        )}

        {/* ABA 2: CONTATO E ENDEREÇO */}
        {activeTab === 'contato' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Canais de Contato e Localização</h2>
              <p className="text-xs text-slate-500">
                Dados visíveis para pacientes na landing page, comprovantes de agendamento e cabeçalhos de receitas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone Comercial *
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefoneBR(e.target.value))}
                  placeholder="(11) 3214-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Oficial *
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatarTelefoneBR(e.target.value))}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <span className="text-[11px] text-slate-500">Atualiza o botão flutuante e de contato do site.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Oficial *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@consultorio.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Endereço com Busca por CEP */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Endereço Físico (com busca ViaCEP)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CEP (8 dígitos)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(formatarCEP(e.target.value))}
                      placeholder="01310-200"
                      maxLength={9}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCep}
                      disabled={buscandoCep}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium shrink-0 flex items-center gap-1"
                    >
                      {buscandoCep ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Buscar</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Logradouro</label>
                  <input
                    type="text"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Ex: Av. Paulista"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Número</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="1578"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Conjunto 112 - Bela Vista"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Bela Vista"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="md:col-span-1 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">UF</label>
                    <input
                      type="text"
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 text-sm text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Redes Sociais Institucionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Instagram (@perfil)</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@consultorio.optometria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="consultorio.optometria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="consultorio-optometria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://consultoriorobertoviana.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: MARCA & ASSINATURA */}
        {activeTab === 'marca' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Marca, Carimbo e Assinatura Digitalizada</h2>
              <p className="text-xs text-slate-500">
                Imagens institucionais aplicadas na interface, impressões de prontuários e receituários ópticos (limite máx. 2 MB por arquivo).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logotipo */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-sm font-semibold text-slate-800 mb-2">Logotipo do Consultório</span>
                <div className="w-36 h-36 border border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white overflow-hidden mb-3 p-2 relative shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logotipo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      Sem logo
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleUploadImagem(e, setLogoUrl, 'Logotipo')}
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2">Formatos: PNG, JPG, SVG, WEBP</span>
              </div>

              {/* Carimbo Profissional */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-sm font-semibold text-slate-800 mb-2">Carimbo do Optometrista</span>
                <div className="w-36 h-36 border border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white overflow-hidden mb-3 p-2 relative shadow-xs">
                  {carimboUrl ? (
                    <img src={carimboUrl} alt="Carimbo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      Sem carimbo
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleUploadImagem(e, setCarimboUrl, 'Carimbo')}
                    />
                  </label>
                  {carimboUrl && (
                    <button
                      type="button"
                      onClick={() => setCarimboUrl('')}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2">Aplicado no rodapé da receita óptica</span>
              </div>

              {/* Assinatura Digitalizada */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-sm font-semibold text-slate-800 mb-2">Assinatura Digitalizada</span>
                <div className="w-36 h-36 border border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white overflow-hidden mb-3 p-2 relative shadow-xs">
                  {assinaturaUrl ? (
                    <img src={assinaturaUrl} alt="Assinatura" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      Sem assinatura
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleUploadImagem(e, setAssinaturaUrl, 'Assinatura')}
                    />
                  </label>
                  {assinaturaUrl && (
                    <button
                      type="button"
                      onClick={() => setAssinaturaUrl('')}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2">Uso restrito a laudos e receitas</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: ATENDIMENTO & BLOQUEIOS */}
        {activeTab === 'atendimento' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Horários de Atendimento & Bloqueios de Agenda</h2>
              <p className="text-xs text-slate-500">
                Defina o expediente por dia da semana, intervalo entre consultas e bloqueios para feriados ou recessos.
              </p>
            </div>

            {/* Parâmetros Globais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Intervalo entre Consultas (minutos)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={5}
                  value={intervaloMin}
                  onChange={(e) => setIntervaloMin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-500">Tempo de assepsia/descanso entre consultas.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duração Padrão da Consulta (minutos)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  step={5}
                  value={duracaoPadraoMin}
                  onChange={(e) => setDuracaoPadraoMin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-500">Duração estimada padrão para novos serviços.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Antecedência Mínima para Agendar (horas)
                </label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  step={1}
                  value={antecedenciaMinimaHoras}
                  onChange={(e) => setAntecedenciaMinimaHoras(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-500">Impede agendamentos em cima da hora pelo site.</span>
              </div>
            </div>

            {/* Horários por Dia da Semana */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Expediente Semanal</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Dia da Semana</th>
                      <th className="px-4 py-3">Início</th>
                      <th className="px-4 py-3">Fim</th>
                      <th className="px-4 py-3">Intervalo (Almoço)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {horariosAtendimento.map((h, i) => (
                      <tr key={h.diaSemana || i} className={h.fechado ? 'bg-slate-50/60' : ''}>
                        <td className="px-4 py-3 font-medium text-slate-900">{h.diaSemana}</td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            disabled={h.fechado}
                            value={h.inicio || '08:00'}
                            onChange={(e) => handleHorarioChange(i, 'inicio', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-300 text-xs disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            disabled={h.fechado}
                            value={h.fim || '18:00'}
                            onChange={(e) => handleHorarioChange(i, 'fim', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-300 text-xs disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              disabled={h.fechado}
                              value={h.intervaloInicio || ''}
                              onChange={(e) => handleHorarioChange(i, 'intervaloInicio', e.target.value)}
                              placeholder="12:00"
                              className="px-2 py-1 rounded-lg border border-slate-300 text-xs disabled:opacity-50"
                            />
                            <span className="text-slate-400 text-xs">às</span>
                            <input
                              type="time"
                              disabled={h.fechado}
                              value={h.intervaloFim || ''}
                              onChange={(e) => handleHorarioChange(i, 'intervaloFim', e.target.value)}
                              placeholder="13:30"
                              className="px-2 py-1 rounded-lg border border-slate-300 text-xs disabled:opacity-50"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                            <input
                              type="checkbox"
                              checked={!h.fechado}
                              onChange={(e) => handleHorarioChange(i, 'fechado', !e.target.checked)}
                              className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className={h.fechado ? 'text-slate-400' : 'text-emerald-700 font-semibold'}>
                              {h.fechado ? 'Fechado' : 'Aberto'}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bloqueios de Agenda (Feriados, Folgas, Recessos) */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Bloqueios de Agenda (Feriados, Férias e Folgas)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Datas em que nenhum horário ficará disponível para agendamento online ou presencial.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBloqueioModalAberto(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Bloqueio
                </button>
              </div>

              {bloqueiosAgenda.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  Nenhum bloqueio de agenda configurado. O consultório opera de acordo com os horários semanais acima.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bloqueiosAgenda.map((bloqueio, idx) => {
                    const dataFormatada =
                      bloqueio.dataInicio && bloqueio.dataFim && bloqueio.dataInicio !== bloqueio.dataFim
                        ? `${bloqueio.dataInicio} até ${bloqueio.dataFim}`
                        : bloqueio.dataInicio || bloqueio.data || 'Data não definida';

                    return (
                      <div
                        key={bloqueio.id || idx}
                        className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl"
                      >
                        <div>
                          <div className="font-semibold text-xs text-amber-950">{bloqueio.motivo}</div>
                          <div className="text-[11px] text-amber-700">{dataFormatada}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverBloqueio(bloqueio.id, bloqueio.data)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover bloqueio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 5: SERVIÇOS CLÍNICOS */}
        {activeTab === 'servicos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Serviços Optométricos Oferecidos</h2>
                <p className="text-xs text-slate-500">
                  Cadastre e ordene os procedimentos clínicos. Itens inativos deixam de aparecer no agendamento, mas continuam preservados no histórico.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setServicoEmEdicao({
                    id: `srv-${Date.now()}`,
                    nome: '',
                    descricao: '',
                    duracaoMin: 40,
                    precoCentavos: 15000,
                    ativo: true,
                    destaque: false,
                    ordem: servicos.length + 1,
                  });
                  setServicoModalAberto(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Ordem</th>
                    <th className="px-4 py-3">Serviço Clínico</th>
                    <th className="px-4 py-3 w-28 text-center">Duração</th>
                    <th className="px-4 py-3 w-32 text-right">Preço</th>
                    <th className="px-4 py-3 w-24 text-center">Status</th>
                    <th className="px-4 py-3 w-28 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {servicos.map((serv, index) => (
                    <tr key={serv.id} className={!serv.ativo ? 'bg-slate-50/70 opacity-60' : ''}>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                        {serv.ordem ?? index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{serv.nome}</span>
                          {serv.destaque && (
                            <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-amber-100 text-amber-800 font-semibold">
                              Destaque
                            </span>
                          )}
                        </div>
                        {serv.descricao && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{serv.descricao}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600 font-medium">
                        {serv.duracaoMin} min
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 text-xs">
                        {serv.precoCentavos === 0 ? 'Gratuito / Retorno' : formatCurrencyFromCents(serv.precoCentavos)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            serv.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {serv.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setServicoEmEdicao({ ...serv });
                              setServicoModalAberto(true);
                            }}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                            title="Editar"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoverServico(serv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 6: RECEITUÁRIO & RELATÓRIOS */}
        {activeTab === 'receita' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Configurações de Receita e Relatórios</h2>
              <p className="text-xs text-slate-500">
                Padrões de validade da prescrição óptica, campos de preenchimento compulsório e rodapé institucional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Validade da Receita Óptica (em dias) *
                </label>
                <input
                  type="number"
                  min={30}
                  max={730}
                  step={15}
                  value={validadeReceitaDias}
                  onChange={(e) => setValidadeReceitaDias(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Padrão clínico recomendado: 365 dias (1 ano).
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Campos Obrigatórios na Emissão da Receita</h3>
              <p className="text-xs text-slate-500 mb-3">
                Marque os campos cujo preenchimento é compulsório antes de autorizar a finalização e impressão do receituário:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'od_esferico', label: 'OD: Esférico Longe' },
                  { id: 'od_cilindrico', label: 'OD: Cilíndrico Longe' },
                  { id: 'od_eixo', label: 'OD: Eixo Refrativo' },
                  { id: 'oe_esferico', label: 'OE: Esférico Longe' },
                  { id: 'oe_cilindrico', label: 'OE: Cilíndrico Longe' },
                  { id: 'oe_eixo', label: 'OE: Eixo Refrativo' },
                  { id: 'adicao', label: 'Adição Perto (Presbiopia)' },
                  { id: 'dnp', label: 'DNP (Distância Nasopupilar)' },
                  { id: 'validadeAte', label: 'Data Limite de Validade' },
                  { id: 'orientacoes_clinicas', label: 'Orientações Visuais' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={camposObrigatoriosReceita.includes(item.id)}
                      onChange={() => handleToggleCampoReceita(item.id)}
                      className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Texto de Rodapé dos Relatórios e Receituários
              </label>
              <textarea
                rows={3}
                value={textoRodapeRelatorio}
                onChange={(e) => setTextoRodapeRelatorio(e.target.value)}
                placeholder="Texto legal impresso no rodapé..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-[11px] text-slate-500">
                Lembrete legal: reforce a exclusividade clínica optométrica e ausência de venda mercantil.
              </span>
            </div>
          </div>
        )}

        {/* ABA 7: CADASTROS AUXILIARES */}
        {activeTab === 'auxiliares' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Cadastros Auxiliares e Templates</h2>
              <p className="text-xs text-slate-500">
                Listas editáveis com controle de status ativo/inativo utilizadas em toda a operação do consultório.
              </p>
            </div>

            {/* Sub-navegação auxiliar */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              {[
                { key: 'pagamento', label: 'Formas de Pagamento' },
                { key: 'despesas', label: 'Categorias de Despesa' },
                { key: 'cancelamento', label: 'Motivos de Cancelamento' },
                { key: 'whatsapp', label: 'Mensagens de WhatsApp' },
              ].map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSubAbaAuxiliar(sub.key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    subAbaAuxiliar === sub.key
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* 7.1 Formas de Pagamento */}
            {subAbaAuxiliar === 'pagamento' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Formas aceitas no fechamento de caixa:</span>
                  <button
                    type="button"
                    onClick={() => handleAdicionarAuxiliar('pagamento')}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Forma
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {formasPagamento.map((fp) => (
                    <div key={fp.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-900">{fp.nome}</span>
                        {fp.padrao && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-teal-100 text-teal-800 font-semibold">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fp.ativo}
                            onChange={(e) =>
                              setFormasPagamento((prev) =>
                                prev.map((item) => (item.id === fp.id ? { ...item, ativo: e.target.checked } : item))
                              )
                            }
                            className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{fp.ativo ? 'Ativo' : 'Inativo'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormasPagamento((prev) => prev.filter((i) => i.id !== fp.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7.2 Categorias de Despesa */}
            {subAbaAuxiliar === 'despesas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Categorias para classificação do contas a pagar:</span>
                  <button
                    type="button"
                    onClick={() => handleAdicionarAuxiliar('despesas')}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Categoria
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {categoriasDespesa.map((cd) => (
                    <div key={cd.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50/50">
                      <span className="text-xs font-medium text-slate-900">{cd.nome}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cd.ativo}
                            onChange={(e) =>
                              setCategoriasDespesa((prev) =>
                                prev.map((item) => (item.id === cd.id ? { ...item, ativo: e.target.checked } : item))
                              )
                            }
                            className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{cd.ativo ? 'Ativo' : 'Inativo'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setCategoriasDespesa((prev) => prev.filter((i) => i.id !== cd.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7.3 Motivos de Cancelamento */}
            {subAbaAuxiliar === 'cancelamento' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Justificativas padrão para cancelamento de agendamentos:</span>
                  <button
                    type="button"
                    onClick={() => handleAdicionarAuxiliar('cancelamento')}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Motivo
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {motivosCancelamento.map((mc) => (
                    <div key={mc.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50/50">
                      <span className="text-xs font-medium text-slate-900">{mc.nome}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mc.ativo}
                            onChange={(e) =>
                              setMotivosCancelamento((prev) =>
                                prev.map((item) => (item.id === mc.id ? { ...item, ativo: e.target.checked } : item))
                              )
                            }
                            className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{mc.ativo ? 'Ativo' : 'Inativo'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setMotivosCancelamento((prev) => prev.filter((i) => i.id !== mc.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7.4 Mensagens Padrão de WhatsApp */}
            {subAbaAuxiliar === 'whatsapp' && (
              <div className="space-y-5">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs leading-relaxed">
                  <span className="font-semibold block mb-1">Variáveis Dinâmicas Suportadas:</span>
                  Você pode utilizar <code className="bg-white px-1.5 py-0.5 rounded-sm font-bold text-emerald-800">{'\{nome\}'}</code>,{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded-sm font-bold text-emerald-800">{'\{data\}'}</code>,{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded-sm font-bold text-emerald-800">{'\{hora\}'}</code> e{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded-sm font-bold text-emerald-800">{'\{servico\}'}</code> no texto dos templates.
                </div>

                <div className="space-y-4">
                  {mensagensPadraoWhatsapp.map((msg, index) => (
                    <div key={msg.id} className="p-4 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{msg.titulo}</span>
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={msg.ativo}
                            onChange={(e) =>
                              setMensagensPadraoWhatsapp((prev) =>
                                prev.map((item) => (item.id === msg.id ? { ...item, ativo: e.target.checked } : item))
                              )
                            }
                            className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{msg.ativo ? 'Ativo' : 'Inativo'}</span>
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={msg.template}
                        onChange={(e) =>
                          setMensagensPadraoWhatsapp((prev) =>
                            prev.map((item) => (item.id === msg.id ? { ...item, template: e.target.value } : item))
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 8: LEMBRETES POR E-MAIL (PROMPT 16) */}
        {activeTab === 'lembretes' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-600" />
                  Lembretes de Consulta por E-mail
                </h2>
                <p className="text-xs text-slate-500">
                  Rotina agendada no servidor que envia lembretes preventivos aos pacientes com antecedência configurável.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecutarLembretesAgora}
                  disabled={executandoLembretes || !podeSalvar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {executandoLembretes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-teal-600" />}
                  <span>{executandoLembretes ? 'Processando...' : 'Executar Varredura Agora'}</span>
                </button>
              </div>
            </div>

            {/* Ativação e Antecedência */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 font-semibold text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lembretesAtivo}
                    onChange={(e) => setLembretesAtivo(e.target.checked)}
                    disabled={!podeSalvar}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Ativar Envio Automático de Lembretes</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-6">
                  Quando ativo, a aplicação verifica a cada 5 minutos as consultas confirmadas e dispara os e-mails aos pacientes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Antecedência de Envio da Notificação *
                </label>
                <select
                  value={lembretesAntecedencia}
                  onChange={(e) => setLembretesAntecedencia(Number(e.target.value))}
                  disabled={!podeSalvar || !lembretesAtivo}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value={12}>12 horas antes da consulta</option>
                  <option value={24}>24 horas antes da consulta (Padrão Recomendado)</option>
                  <option value={48}>48 horas antes da consulta (2 dias de antecedência)</option>
                  <option value={72}>72 horas antes da consulta (3 dias de antecedência)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Janela de antecedência considerada pela tarefa agendada em segundo plano.
                </p>
              </div>
            </div>

            {/* Assunto e Modelo do E-mail */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assunto do E-mail *</label>
                <input
                  type="text"
                  value={lembretesAssunto}
                  onChange={(e) => setLembretesAssunto(e.target.value)}
                  disabled={!podeSalvar}
                  placeholder="Ex: Lembrete de Consulta: {servico} no {consultorio}"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Modelo do Texto do E-mail *</label>
                  <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-mono">
                    Tags: {'{nome}'}, {'{data}'}, {'{horario}'}, {'{servico}'}, {'{profissional}'}, {'{consultorio}'}, {'{endereco}'}, {'{telefone}'}, {'{whatsapp}'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={lembretesCorpo}
                  onChange={(e) => setLembretesCorpo(e.target.value)}
                  disabled={!podeSalvar}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Caixa de Teste de E-mail */}
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-teal-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-teal-600" />
                Disparo de Demonstração / Teste de Lembrete
              </h3>
              <p className="text-xs text-slate-600">
                Envie uma mensagem de demonstração formatada com as tags do consultório para validar o template.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="email"
                  value={emailTesteDestino}
                  onChange={(e) => setEmailTesteDestino(e.target.value)}
                  placeholder="seu-email@dominio.com.br"
                  className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-teal-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleTestarLembreteEmail}
                  disabled={enviandoTesteEmail || !emailTesteDestino}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-300 transition-colors"
                >
                  {enviandoTesteEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{enviandoTesteEmail ? 'Enviando...' : 'Enviar E-mail de Teste'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 9: BACKUP & EXPORTAÇÃO COMPLETA (PROMPT 16) */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                Backup & Exportação Integral do Consultório
              </h2>
              <p className="text-xs text-slate-500">
                Gere cópias de segurança completas do banco de dados para custódia legal e proteção contra sinistros.
              </p>
            </div>

            {!isAdmin ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong>Acesso Restrito:</strong> A exportação e restauração do banco de dados completo do consultório é uma operação restrita exclusivamente ao papel de <strong>Administrador</strong> por razões de sigilo médico e LGPD.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Card de Exportação */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-teal-600" />
                      Exportar Base de Dados Completa (.JSON)
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Gera um arquivo JSON integral contendo pacientes, histórico clínico, receitas ópticas, agendamentos, movimentações financeiras, colaboradores e trilha de auditoria, assinado com Checksum SHA-256.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportarBackup}
                    disabled={exportandoBackup}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-md shadow-teal-600/20 transition-all shrink-0"
                  >
                    {exportandoBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{exportandoBackup ? 'Gerando Backup...' : 'Baixar Backup Completo'}</span>
                  </button>
                </div>

                {/* Quadro de Retenção Legal CFM / CBOO */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Diretrizes Legais de Retenção de Prontuários (CFM & CBOO)
                  </h4>
                  <ul className="text-xs text-blue-950/80 list-disc list-inside space-y-1">
                    <li>
                      <strong>Prazo Mínimo de Guarda:</strong> 20 (vinte) anos a contar do último atendimento clínico refrativo registrado (Lei Federal nº 13.787/2018 e Resolução CFM nº 1.821/2007).
                    </li>
                    <li>
                      <strong>Segurança e Criptografia:</strong> As cópias de backup devem ser mantidas em armazenamento seguro criptografado fora da máquina local do consultório.
                    </li>
                    <li>
                      <strong>Rotina Diária Recomendada:</strong> Exporte o backup semanalmente e preserve os arquivos históricos com data e hora.
                    </li>
                  </ul>
                </div>

                {/* Card de Restauração */}
                <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-rose-600" />
                    Restaurar Base de Dados a partir de Arquivo
                  </h3>
                  <p className="text-xs text-rose-800">
                    Importe um arquivo de backup previamente exportado pelo sistema. Atenção: esta ação substituirá os registros atuais pelos dados do arquivo selecionado.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                      <span>{restaurandoBackup ? 'Processando Restauração...' : 'Selecionar Arquivo de Backup (.json)'}</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestaurarBackupArquivo}
                        disabled={restaurandoBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: NOVO BLOQUEIO DE AGENDA */}
      {bloqueioModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Adicionar Bloqueio de Agenda
              </h3>
              <button onClick={() => setBloqueioModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo do Bloqueio *</label>
                <input
                  type="text"
                  value={novoBloqueioMotivo}
                  onChange={(e) => setNovoBloqueioMotivo(e.target.value)}
                  placeholder="Ex: Feriado de Carnaval, Recesso de Férias, Manutenção"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Início *</label>
                  <input
                    type="date"
                    value={novoBloqueioDataInicio}
                    onChange={(e) => setNovoBloqueioDataInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Fim (Opcional)</label>
                  <input
                    type="date"
                    value={novoBloqueioDataFim}
                    onChange={(e) => setNovoBloqueioDataFim(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBloqueioModalAberto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarBloqueio}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                Salvar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR SERVIÇO */}
      {servicoModalAberto && servicoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Glasses className="w-4 h-4 text-teal-600" />
                {servicos.some((s) => s.id === servicoEmEdicao.id) ? 'Editar Serviço Clínico' : 'Novo Serviço Clínico'}
              </h3>
              <button onClick={() => setServicoModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  value={servicoEmEdicao.nome}
                  onChange={(e) => setServicoEmEdicao({ ...servicoEmEdicao, nome: e.target.value })}
                  placeholder="Ex: Exame de Refração Completo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Clínica Curta</label>
                <textarea
                  rows={2}
                  value={servicoEmEdicao.descricao || ''}
                  onChange={(e) => setServicoEmEdicao({ ...servicoEmEdicao, descricao: e.target.value })}
                  placeholder="Explicação didática para o paciente no agendamento..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (minutos) *</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    step={5}
                    value={servicoEmEdicao.duracaoMin}
                    onChange={(e) =>
                      setServicoEmEdicao({ ...servicoEmEdicao, duracaoMin: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço em Reais (R$) *</label>
                  <input
                    type="text"
                    value={((servicoEmEdicao.precoCentavos || 0) / 100).toFixed(2).replace('.', ',')}
                    onChange={(e) =>
                      setServicoEmEdicao({
                        ...servicoEmEdicao,
                        precoCentavos: parseToCents(e.target.value),
                      })
                    }
                    placeholder="160,00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={servicoEmEdicao.ativo}
                    onChange={(e) => setServicoEmEdicao({ ...servicoEmEdicao, ativo: e.target.checked })}
                    className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Serviço Ativo</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(servicoEmEdicao.destaque)}
                    onChange={(e) => setServicoEmEdicao({ ...servicoEmEdicao, destaque: e.target.checked })}
                    className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Destaque na Home</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setServicoModalAberto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!servicoEmEdicao.nome.trim()) {
                    alert('Informe o nome do serviço clínico.');
                    return;
                  }
                  handleSalvarServico(servicoEmEdicao);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
