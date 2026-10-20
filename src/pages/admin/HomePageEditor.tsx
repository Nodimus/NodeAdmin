import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Sparkles,
  User,
  Glasses,
  Quote,
  Images,
  MapPin,
  FileText,
  Search,
  Eye,
  Send,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ShieldAlert,
  Star,
  RefreshCw,
  X,
  Clock,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';
import { validarArquivoImagem } from '../../utils/validators';
import { formatDateBR } from '../../utils/formatters';
import {
  Consultorio,
  HeroConfig,
  SobreOptometrista,
  Depoimento,
  FotoGaleria,
  SecoesVisiveis,
  SeoConfig,
  WhatsAppConfig,
} from '../../types';

export const HomePageEditor: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { consultorio, atualizarConsultorio } = useConsultorio();
  const podePublicar = hasPermission('empresa.editar');

  const [activeSection, setActiveSection] = useState<
    'secoes' | 'hero' | 'sobre' | 'servicos' | 'depoimentos' | 'galeria' | 'contato' | 'rodape' | 'seo'
  >('secoes');

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // 1. Visibilidade e Ordem das Seções
  const [secoesVisiveis, setSecoesVisiveis] = useState<SecoesVisiveis>({
    hero: true,
    servicos: true,
    sobre: true,
    galeria: true,
    depoimentos: true,
    horarios: true,
    agendamento: true,
    contato: true,
  });

  const secoesDisponiveis = [
    { key: 'hero', label: 'Apresentação (Hero)' },
    { key: 'servicos', label: 'Serviços e Exames' },
    { key: 'sobre', label: 'Sobre o Optometrista' },
    { key: 'galeria', label: 'Galeria do Consultório' },
    { key: 'depoimentos', label: 'Depoimentos de Pacientes' },
    { key: 'horarios', label: 'Horários de Atendimento' },
    { key: 'agendamento', label: 'Formulário de Agendamento' },
    { key: 'contato', label: 'Localização e Contato' },
  ];

  const [ordemSecoes, setOrdemSecoes] = useState<string[]>([
    'hero',
    'servicos',
    'sobre',
    'galeria',
    'depoimentos',
    'horarios',
    'agendamento',
    'contato',
  ]);

  // 2. Hero
  const [hero, setHero] = useState<HeroConfig>({
    titulo: '',
    subtitulo: '',
    textoBotao: '',
    imagemUrl: '',
  });

  // 3. Sobre o Optometrista
  const [sobre, setSobre] = useState<SobreOptometrista>({
    nome: '',
    registroProfissional: '',
    fotoUrl: '',
    biografia: '',
    formacao: [],
    diferenciais: [],
  });
  const [novaFormacao, setNovaFormacao] = useState('');
  const [novoDiferencial, setNovoDiferencial] = useState('');

  // 4. Serviços (destaque)
  const [servicosDestaque, setServicosDestaque] = useState(consultorio.servicos || []);

  // 5. Depoimentos
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [depoimentoModalAberto, setDepoimentoModalAberto] = useState(false);
  const [depoimentoEmEdicao, setDepoimentoEmEdicao] = useState<Depoimento | null>(null);

  // 6. Galeria
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [novaFotoLegenda, setNovaFotoLegenda] = useState('');
  const [novaFotoUrl, setNovaFotoUrl] = useState('');

  // 7. Localização e Contato
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    numero: '',
    mensagemInicial: '',
  });
  const [mapaEmbedUrl, setMapaEmbedUrl] = useState('');

  // 8. Rodapé e Política de Privacidade
  const [textoRodape, setTextoRodape] = useState('');
  const [politicaPrivacidadeTexto, setPoliticaPrivacidadeTexto] = useState('');
  const [versaoPolitica, setVersaoPolitica] = useState('1.0');

  // 9. SEO
  const [seo, setSeo] = useState<SeoConfig>({
    titulo: '',
    descricao: '',
  });

  // Informações de última publicação
  const [publicadoPor, setPublicadoPor] = useState<{
    nome: string;
    email?: string;
    data: string;
  } | null>(null);

  // Carregar dados existentes
  useEffect(() => {
    if (consultorio) {
      if (consultorio.secoesVisiveis) {
        setSecoesVisiveis(consultorio.secoesVisiveis);
      }
      if (consultorio.ordemSecoes && consultorio.ordemSecoes.length > 0) {
        setOrdemSecoes(consultorio.ordemSecoes);
      }
      if (consultorio.hero) {
        setHero(consultorio.hero);
      }
      if (consultorio.sobreOptometrista) {
        setSobre(consultorio.sobreOptometrista);
      }
      if (consultorio.servicos) {
        setServicosDestaque(consultorio.servicos);
      }
      if (consultorio.depoimentos) {
        setDepoimentos(consultorio.depoimentos);
      }
      if (consultorio.galeria) {
        setGaleria(consultorio.galeria);
      }
      if (consultorio.whatsappConfig) {
        setWhatsappConfig(consultorio.whatsappConfig);
      } else {
        setWhatsappConfig({
          numero: consultorio.whatsapp || '',
          mensagemInicial: 'Olá! Gostaria de agendar um exame de refração no consultório.',
        });
      }
      setMapaEmbedUrl(consultorio.mapaEmbedUrl || '');
      setTextoRodape(consultorio.textoRodape || '');
      setPoliticaPrivacidadeTexto(consultorio.politicaPrivacidadeTexto || '');
      setVersaoPolitica(consultorio.versaoPolitica || '1.0');
      if (consultorio.seo) {
        setSeo(consultorio.seo);
      }
      if (consultorio.publicadoPor) {
        setPublicadoPor(consultorio.publicadoPor);
      }
    }
  }, [consultorio]);

  // Upload e Validação de Imagens (máx 2 MB)
  const handleUploadImagem = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    nomeCampo: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validacao = validarArquivoImagem(file);
    if (!validacao.valido) {
      setMensagemErro(validacao.erro || `Arquivo de ${nomeCampo} inválido.`);
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
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reordenação de Seções
  const moverSecao = (index: number, direcao: 'cima' | 'baixo') => {
    const novoIndice = direcao === 'cima' ? index - 1 : index + 1;
    if (novoIndice < 0 || novoIndice >= ordemSecoes.length) return;

    const novaOrdem = [...ordemSecoes];
    const item = novaOrdem.splice(index, 1)[0];
    novaOrdem.splice(novoIndice, 0, item);
    setOrdemSecoes(novaOrdem);
  };

  // Alternar Visibilidade da Seção
  const toggleSecao = (key: keyof SecoesVisiveis) => {
    setSecoesVisiveis((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Adicionar Item de Formação / Diferencial
  const handleAdicionarFormacao = () => {
    if (!novaFormacao.trim()) return;
    setSobre((prev) => ({
      ...prev,
      formacao: [...(prev.formacao || []), novaFormacao.trim()],
    }));
    setNovaFormacao('');
  };

  const handleRemoverFormacao = (idx: number) => {
    setSobre((prev) => ({
      ...prev,
      formacao: (prev.formacao || []).filter((_, i) => i !== idx),
    }));
  };

  const handleAdicionarDiferencial = () => {
    if (!novoDiferencial.trim()) return;
    setSobre((prev) => ({
      ...prev,
      diferenciais: [...(prev.diferenciais || []), novoDiferencial.trim()],
    }));
    setNovoDiferencial('');
  };

  const handleRemoverDiferencial = (idx: number) => {
    setSobre((prev) => ({
      ...prev,
      diferenciais: (prev.diferenciais || []).filter((_, i) => i !== idx),
    }));
  };

  // Depoimentos CRUD
  const handleSalvarDepoimento = (dep: Depoimento) => {
    if (!dep.autorizacaoPaciente) {
      alert('É obrigatório que o paciente tenha concedido autorização expressa para publicação do depoimento (LGPD).');
      return;
    }
    setDepoimentos((prev) => {
      const idx = prev.findIndex((d) => d.id === dep.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = dep;
        return copia;
      }
      return [...prev, dep];
    });
    setDepoimentoModalAberto(false);
    setDepoimentoEmEdicao(null);
  };

  const handleRemoverDepoimento = (id: string) => {
    if (confirm('Tem certeza que deseja remover este depoimento?')) {
      setDepoimentos((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Galeria Adicionar / Remover
  const handleAdicionarFotoGaleria = () => {
    if (!novaFotoUrl) {
      setMensagemErro('Faça o upload de uma imagem ou informe a URL para adicionar à galeria.');
      return;
    }
    const nova: FotoGaleria = {
      id: `gal-${Date.now()}`,
      url: novaFotoUrl,
      legenda: novaFotoLegenda.trim() || 'Instalações do Consultório',
      ordem: galeria.length + 1,
      ativo: true,
    };
    setGaleria((prev) => [...prev, nova]);
    setNovaFotoUrl('');
    setNovaFotoLegenda('');
  };

  const handleRemoverFotoGaleria = (id: string) => {
    setGaleria((prev) => prev.filter((g) => g.id !== id));
  };

  // Gerar dados do rascunho completo
  const gerarDraftCompleto = (): Partial<Consultorio> => {
    return {
      ...consultorio,
      hero,
      sobreOptometrista: sobre,
      servicos: servicosDestaque,
      depoimentos,
      galeria,
      whatsappConfig,
      secoesVisiveis,
      ordemSecoes,
      mapaEmbedUrl,
      textoRodape,
      politicaPrivacidadeTexto,
      versaoPolitica,
      seo,
    };
  };

  // Pré-visualizar a home com o rascunho
  const handlePrevisualizar = () => {
    const draft = gerarDraftCompleto();
    sessionStorage.setItem('consultorio_home_preview', JSON.stringify(draft));
    window.open('/?preview=true', '_blank');
  };

  // Publicar alterações
  const handlePublicar = async () => {
    if (!podePublicar) {
      setMensagemErro('Você não possui permissão para publicar alterações (empresa.editar).');
      return;
    }

    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const payload = {
        hero,
        sobreOptometrista: sobre,
        servicos: servicosDestaque,
        depoimentos,
        galeria,
        whatsappConfig,
        secoesVisiveis,
        ordemSecoes,
        mapaEmbedUrl,
        textoRodape,
        politicaPrivacidadeTexto,
        versaoPolitica,
        seo,
      };

      const token = localStorage.getItem('consultorio_session_token');
      const res = await fetch('/api/admin/home/publicar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ao publicar (${res.status})`);
      }

      const resJson = await res.json();
      if (resJson.publicadoPor) {
        setPublicadoPor(resJson.publicadoPor);
      }
      if (resJson.consultorio) {
        await atualizarConsultorio(resJson.consultorio);
      }

      setMensagemSucesso('Conteúdo da Landing Page publicado com sucesso! As alterações já estão ao vivo.');
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao publicar conteúdo da home.';
      setMensagemErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Topo / Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conteúdo da Home</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Landing Page CMS
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Personalize textos, imagens, depoimentos e visibilidade da landing page sem alterar o código-fonte.
          </p>
          {publicadoPor && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Última publicação: <strong>{publicadoPor.nome}</strong> em{' '}
                {formatDateBR(publicadoPor.data)} às{' '}
                {new Date(publicadoPor.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevisualizar}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Pré-visualizar</span>
          </button>

          <button
            type="button"
            onClick={handlePublicar}
            disabled={salvando || !podePublicar}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
              !podePublicar
                ? 'bg-slate-400 cursor-not-allowed'
                : salvando
                ? 'bg-teal-400 cursor-wait'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-95'
            }`}
          >
            {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{salvando ? 'Publicando...' : 'Publicar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{mensagemSucesso}</div>
          <button onClick={() => setMensagemSucesso('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{mensagemErro}</div>
          <button onClick={() => setMensagemErro('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aviso Jurídico Obrigatório */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Aviso Deontológico e Jurídico:</span> A política de privacidade, os textos institucionais e o termo de consentimento dos pacientes devem ser periodicamente revisados por um profissional jurídico habilitado, em estrita conformidade com a LGPD (Lei nº 13.709/2018) e com as normas do CBOO.
        </div>
      </div>

      {/* Menu de Sub-Módulos da Home */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-2 shrink-0">
          {[
            { key: 'secoes', label: '1. Ordem & Visibilidade', icon: LayoutTemplate },
            { key: 'hero', label: '2. Hero / Apresentação', icon: Sparkles },
            { key: 'sobre', label: '3. Sobre o Optometrista', icon: User },
            { key: 'servicos', label: '4. Serviços em Destaque', icon: Glasses },
            { key: 'depoimentos', label: '5. Depoimentos', icon: Quote },
            { key: 'galeria', label: '6. Galeria de Fotos', icon: Images },
            { key: 'contato', label: '7. Contato & Mapa', icon: MapPin },
            { key: 'rodape', label: '8. Rodapé & LGPD', icon: FileText },
            { key: 'seo', label: '9. SEO & Metadados', icon: Search },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                  active
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTEÚDO DOS BLOCOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {/* BLOCO 1: SEÇÕES & VISIBILIDADE */}
        {activeSection === 'secoes' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Visibilidade e Ordem das Seções</h2>
              <p className="text-xs text-slate-500">
                Ative ou desative seções e defina a ordem de exibição na landing page do consultório.
              </p>
            </div>

            <div className="space-y-3">
              {ordemSecoes.map((secaoKey, index) => {
                const config = secoesDisponiveis.find((s) => s.key === secaoKey);
                if (!config) return null;
                const visivel = (secoesVisiveis as any)[secaoKey] !== false;

                return (
                  <div
                    key={secaoKey}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                      visivel ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{config.label}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Reordenar */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moverSecao(index, 'cima')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === ordemSecoes.length - 1}
                          onClick={() => moverSecao(index, 'baixo')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Toggle de Visibilidade */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={visivel}
                          onChange={() => toggleSecao(secaoKey as any)}
                          className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className={visivel ? 'text-teal-700' : 'text-slate-400'}>
                          {visivel ? 'Visível' : 'Oculto'}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BLOCO 2: HERO */}
        {activeSection === 'hero' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Apresentação Principal (Hero)</h2>
              <p className="text-xs text-slate-500">
                Primeira seção que os pacientes visualizam ao acessar o site do consultório.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de Impacto (Hero)</label>
                <input
                  type="text"
                  maxLength={180}
                  value={hero.titulo}
                  onChange={(e) => setHero({ ...hero, titulo: e.target.value })}
                  placeholder="Ex: Cuidando da sua saúde visual com precisão e conforto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtítulo Explicativo</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={hero.subtitulo}
                  onChange={(e) => setHero({ ...hero, subtitulo: e.target.value })}
                  placeholder="Ex: Realizamos exames refrativos completos para prescrição de óculos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Botão de Ação</label>
                <input
                  type="text"
                  maxLength={40}
                  value={hero.textoBotao}
                  onChange={(e) => setHero({ ...hero, textoBotao: e.target.value })}
                  placeholder="Ex: Agendar Exame Online"
                  className="w-full sm:w-80 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Imagem de Destaque do Hero</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-48 h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {hero.imagemUrl ? (
                      <img src={hero.imagemUrl} alt="Hero" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">Sem imagem</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      Upload de Imagem (máx 2 MB)
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => handleUploadImagem(e, (url) => setHero({ ...hero, imagemUrl: url }), 'Hero')}
                      />
                    </label>
                    {hero.imagemUrl && (
                      <button
                        type="button"
                        onClick={() => setHero({ ...hero, imagemUrl: '' })}
                        className="block text-xs text-rose-600 hover:underline"
                      >
                        Remover imagem
                      </button>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Recomendado: foto nítida do consultório ou equipamento optométrico (1200x800).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BLOCO 3: SOBRE O OPTOMETRISTA */}
        {activeSection === 'sobre' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Sobre o Optometrista Responsável</h2>
              <p className="text-xs text-slate-500">
                Biografia, títulos acadêmicos e compromissos éticos com o paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Profissional</label>
                <input
                  type="text"
                  value={sobre.nome}
                  onChange={(e) => setSobre({ ...sobre, nome: e.target.value })}
                  placeholder="Ex: Dr. Roberto Viana"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registro Profissional</label>
                <input
                  type="text"
                  value={sobre.registroProfissional}
                  onChange={(e) => setSobre({ ...sobre, registroProfissional: e.target.value })}
                  placeholder="Ex: CBO 3223-05 | CBOO 14.892-SP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Biografia Clínica</label>
              <textarea
                rows={4}
                value={sobre.biografia}
                onChange={(e) => setSobre({ ...sobre, biografia: e.target.value })}
                placeholder="Trajetória profissional, dedicação aos cuidados visuais e atendimento calmo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Foto do Optometrista</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                  {sobre.fotoUrl ? (
                    <img src={sobre.fotoUrl} alt={sobre.nome} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Foto (máx 2 MB)
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadImagem(e, (url) => setSobre({ ...sobre, fotoUrl: url }), 'Foto do Profissional')
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Listas de Formação e Diferenciais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Formação */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Formação & Habilitações
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novaFormacao}
                    onChange={(e) => setNovaFormacao(e.target.value)}
                    placeholder="Adicionar formação..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarFormacao}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {(sobre.formacao || []).map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="text-slate-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoverFormacao(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Diferenciais */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Diferenciais Clínicos
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novoDiferencial}
                    onChange={(e) => setNovoDiferencial(e.target.value)}
                    placeholder="Adicionar diferencial..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarDiferencial}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {(sobre.diferenciais || []).map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="text-slate-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoverDiferencial(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* BLOCO 4: SERVIÇOS EM DESTAQUE */}
        {activeSection === 'servicos' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Serviços em Destaque na Landing Page</h2>
              <p className="text-xs text-slate-500">
                Selecione os procedimentos prioritários com selo de destaque e edite descrições curtas.
              </p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {servicosDestaque.map((servico, index) => (
                <div key={servico.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{servico.nome}</span>
                      {servico.destaque && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-amber-100 text-amber-800 font-semibold">
                          Destaque
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={servico.descricao || ''}
                      onChange={(e) => {
                        const novaDesc = e.target.value;
                        setServicosDestaque((prev) =>
                          prev.map((s) => (s.id === servico.id ? { ...s, descricao: novaDesc } : s))
                        );
                      }}
                      placeholder="Descrição curta para a landing page..."
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                    />
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-amber-800">
                      <input
                        type="checkbox"
                        checked={Boolean(servico.destaque)}
                        onChange={(e) => {
                          const dest = e.target.checked;
                          setServicosDestaque((prev) =>
                            prev.map((s) => (s.id === servico.id ? { ...s, destaque: dest } : s))
                          );
                        }}
                        className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Destacar</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-teal-800">
                      <input
                        type="checkbox"
                        checked={servico.ativo}
                        onChange={(e) => {
                          const at = e.target.checked;
                          setServicosDestaque((prev) =>
                            prev.map((s) => (s.id === servico.id ? { ...s, ativo: at } : s))
                          );
                        }}
                        className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Ativo</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCO 5: DEPOIMENTOS */}
        {activeSection === 'depoimentos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Depoimentos de Pacientes</h2>
                <p className="text-xs text-slate-500">
                  Avaliações reais com autorização expressa em conformidade com a LGPD.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDepoimentoEmEdicao({
                    id: `dep-${Date.now()}`,
                    nome: '',
                    texto: '',
                    nota: 5,
                    ativo: true,
                    autorizacaoPaciente: true,
                    ordem: depoimentos.length + 1,
                    data: 'Fevereiro de 2026',
                  });
                  setDepoimentoModalAberto(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Depoimento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {depoimentos.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (dep.nota || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            dep.ativo && dep.autorizacaoPaciente
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {dep.ativo ? (dep.autorizacaoPaciente ? 'Publicado' : 'Sem Autorização') : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 italic">"{dep.texto}"</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{dep.nome}</span>
                      {dep.data && <span className="text-[11px] text-slate-400 block">{dep.data}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDepoimentoEmEdicao({ ...dep });
                          setDepoimentoModalAberto(true);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-600"
                        title="Editar"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoverDepoimento(dep.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCO 6: GALERIA */}
        {activeSection === 'galeria' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Galeria de Fotos do Consultório</h2>
              <p className="text-xs text-slate-500">
                Imagens do gabinete optométrico, projetores, equipamentos e sala de espera.
              </p>
            </div>

            {/* Adicionar Nova Foto */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Adicionar Nova Foto à Galeria
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Legenda Descritiva</label>
                  <input
                    type="text"
                    value={novaFotoLegenda}
                    onChange={(e) => setNovaFotoLegenda(e.target.value)}
                    placeholder="Ex: Refrator computadorizado e projetor de optotipos"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <label className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => handleUploadImagem(e, setNovaFotoUrl, 'Galeria')}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAdicionarFotoGaleria}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              {novaFotoUrl && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Foto carregada com sucesso e pronta para ser adicionada.</span>
                </div>
              )}
            </div>

            {/* Lista da Galeria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galeria.map((foto) => (
                <div key={foto.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="h-40 overflow-hidden bg-slate-100">
                    <img src={foto.url} alt={foto.legenda} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-xs text-slate-700 font-medium truncate flex-1 mr-2">{foto.legenda}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoverFotoGaleria(foto.id)}
                      className="text-slate-400 hover:text-rose-600"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCO 7: CONTATO & MAPA */}
        {activeSection === 'contato' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Localização e Mensagem de Contato</h2>
              <p className="text-xs text-slate-500">
                Configurações de mapa e mensagem inicial para início de conversa no WhatsApp.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de WhatsApp para Atendimento
                </label>
                <input
                  type="text"
                  value={whatsappConfig.numero}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, numero: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem Inicial Padrão no WhatsApp
                </label>
                <textarea
                  rows={2}
                  value={whatsappConfig.mensagemInicial}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, mensagemInicial: e.target.value })}
                  placeholder="Olá! Gostaria de agendar um exame de refração no consultório."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link ou URL de Incorporação (Embed) do Google Maps
                </label>
                <input
                  type="text"
                  value={mapaEmbedUrl}
                  onChange={(e) => setMapaEmbedUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Insira o link embed do Google Maps para exibir o mapa interativo direto na seção Onde Estamos.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BLOCO 8: RODAPÉ & LGPD */}
        {activeSection === 'rodape' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Rodapé & Política de Privacidade (LGPD)</h2>
              <p className="text-xs text-slate-500">
                Texto do rodapé institucional e termos de tratamento de dados cadastrais e clínicos.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texto de Rodapé do Site</label>
                <input
                  type="text"
                  value={textoRodape}
                  onChange={(e) => setTextoRodape(e.target.value)}
                  placeholder="Atendimento optométrico clínico em conformidade com CBO 3223-05..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Versão da Política</label>
                  <input
                    type="text"
                    value={versaoPolitica}
                    onChange={(e) => setVersaoPolitica(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto Integral da Política de Privacidade (LGPD)
                </label>
                <textarea
                  rows={8}
                  value={politicaPrivacidadeTexto}
                  onChange={(e) => setPoliticaPrivacidadeTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
                />
                <span className="text-[11px] text-amber-700 mt-1 block font-medium">
                  Lembrete: Este texto é exibido no modal público e registrado com timestamp no agendamento online.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BLOCO 9: SEO & METADADOS */}
        {activeSection === 'seo' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">SEO & Otimização nos Buscadores (Google)</h2>
              <p className="text-xs text-slate-500">
                Título e descrição exibidos no cabeçalho HTML, redes sociais e resultados de busca orgânica.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Página (&lt;title&gt;) (máx. 100 caracteres)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={seo.titulo}
                  onChange={(e) => setSeo({ ...seo, titulo: e.target.value })}
                  placeholder="Consultório de Optometria Dr. Roberto Viana | Exames de Vista em São Paulo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meta Descrição (&lt;meta name="description"&gt;) (máx. 250 caracteres)
                </label>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={seo.descricao}
                  onChange={(e) => setSeo({ ...seo, descricao: e.target.value })}
                  placeholder="Exame de refração completo, acuidade visual e adaptação de lentes de contato na Av. Paulista..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Prévia do Snippet do Google */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Pré-visualização no Google
                </span>
                <p className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                  {seo.titulo || `${consultorio.nomeFantasia} — Consultório de Optometria`}
                </p>
                <p className="text-xs text-emerald-800">https://consultoriorobertoviana.com.br</p>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {seo.descricao || 'Atendimento optométrico particular individualizado com hora marcada.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DEPOIMENTO */}
      {depoimentoModalAberto && depoimentoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-teal-600" />
                <span>{depoimentos.some((d) => d.id === depoimentoEmEdicao.id) ? 'Editar Depoimento' : 'Novo Depoimento'}</span>
              </h3>
              <button onClick={() => setDepoimentoModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome ou Iniciais do Paciente *</label>
                <input
                  type="text"
                  value={depoimentoEmEdicao.nome}
                  onChange={(e) => setDepoimentoEmEdicao({ ...depoimentoEmEdicao, nome: e.target.value })}
                  placeholder="Ex: Mariana S. ou Carlos E. Mendonça"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Depoimento *</label>
                <textarea
                  rows={3}
                  value={depoimentoEmEdicao.texto}
                  onChange={(e) => setDepoimentoEmEdicao({ ...depoimentoEmEdicao, texto: e.target.value })}
                  placeholder="Relato do paciente sobre a consulta, exame de refração ou lentes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nota (1 a 5 Estrelas)</label>
                  <select
                    value={depoimentoEmEdicao.nota || 5}
                    onChange={(e) => setDepoimentoEmEdicao({ ...depoimentoEmEdicao, nota: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value={5}>5 Estrelas (Excelente)</option>
                    <option value={4}>4 Estrelas (Muito Bom)</option>
                    <option value={3}>3 Estrelas (Bom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mês / Ano</label>
                  <input
                    type="text"
                    value={depoimentoEmEdicao.data || ''}
                    onChange={(e) => setDepoimentoEmEdicao({ ...depoimentoEmEdicao, data: e.target.value })}
                    placeholder="Ex: Fevereiro de 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-start gap-2 text-xs font-medium text-slate-800 cursor-pointer p-2 rounded-lg bg-teal-50 border border-teal-200">
                  <input
                    type="checkbox"
                    checked={depoimentoEmEdicao.autorizacaoPaciente}
                    onChange={(e) =>
                      setDepoimentoEmEdicao({ ...depoimentoEmEdicao, autorizacaoPaciente: e.target.checked })
                    }
                    className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                  />
                  <span>
                    <strong>Autorização Expressa do Paciente (Obrigatório por Lei/LGPD):</strong> O paciente autorizou formalmente a divulgação deste relato.
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depoimentoEmEdicao.ativo}
                    onChange={(e) => setDepoimentoEmEdicao({ ...depoimentoEmEdicao, ativo: e.target.checked })}
                    className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Depoimento Ativo na Landing Page</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepoimentoModalAberto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!depoimentoEmEdicao.nome.trim() || !depoimentoEmEdicao.texto.trim()) {
                    alert('Preencha o nome e o texto do depoimento.');
                    return;
                  }
                  handleSalvarDepoimento(depoimentoEmEdicao);
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
