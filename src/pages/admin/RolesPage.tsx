import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Lock,
  RefreshCw,
  Check,
  Calendar,
  UserCheck,
  Eye,
  FileText,
  DollarSign,
  BarChart3,
  History,
  Building2,
  Layers,
  Settings,
} from 'lucide-react';
import { Papel, Usuario } from '../../types';
import { usersRolesService } from '../../services/users-roles.service';
import { useAuth } from '../../contexts/AuthContext';

// Definição da Matriz de Módulos e Ações conforme docs/04-seguranca-e-permissoes.md
interface ModuloConfig {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  acoes: {
    chave: string; // ex: 'agenda.ler'
    rotulo: string; // ex: 'Visualizar'
    descricao?: string;
  }[];
}

const MODULOS_SISTEMA: ModuloConfig[] = [
  {
    id: 'agenda',
    nome: 'Agenda & Consultas',
    descricao: 'Gestão da grade de horários, bloqueios e agendamentos de pacientes',
    icon: Calendar,
    acoes: [
      { chave: 'agenda.ler', rotulo: 'Visualizar', descricao: 'Consultar agendamentos e horários' },
      { chave: 'agenda.criar', rotulo: 'Criar', descricao: 'Marcar novas consultas' },
      { chave: 'agenda.editar', rotulo: 'Editar', descricao: 'Remarcar e atualizar status' },
      { chave: 'agenda.excluir', rotulo: 'Cancelar', descricao: 'Cancelar consultas' },
    ],
  },
  {
    id: 'pacientes',
    nome: 'Pacientes & Prontuários',
    descricao: 'Fichas cadastrais, dados de contato e prontuário optométrico',
    icon: Users,
    acoes: [
      { chave: 'pacientes.ler', rotulo: 'Visualizar', descricao: 'Consultar prontuários' },
      { chave: 'pacientes.criar', rotulo: 'Cadastrar', descricao: 'Novo cadastro de paciente' },
      { chave: 'pacientes.editar', rotulo: 'Editar', descricao: 'Atualizar dados cadastrais' },
      { chave: 'pacientes.excluir', rotulo: 'Excluir', descricao: 'Desativar pacientes' },
    ],
  },
  {
    id: 'atendimento',
    nome: 'Atendimento & Refração',
    descricao: 'Anamnese, acuidade visual, motilidade ocular, retinoscopia e refração',
    icon: Eye,
    acoes: [
      { chave: 'atendimento.ler', rotulo: 'Visualizar', descricao: 'Consultar exames anteriores' },
      { chave: 'atendimento.criar', rotulo: 'Realizar', descricao: 'Iniciar novo atendimento' },
      { chave: 'atendimento.editar', rotulo: 'Editar', descricao: 'Alterar apontamentos' },
      { chave: 'atendimento.excluir', rotulo: 'Excluir', descricao: 'Excluir registro clínico' },
      { chave: 'atendimento.imprimir', rotulo: 'Imprimir', descricao: 'Gerar laudo de exame' },
    ],
  },
  {
    id: 'receitas',
    nome: 'Receituário Óptico',
    descricao: 'Prescrição óptica de longe, perto e intermediário com validade',
    icon: FileText,
    acoes: [
      { chave: 'receitas.ler', rotulo: 'Visualizar', descricao: 'Consultar receitas emitidas' },
      { chave: 'receitas.criar', rotulo: 'Emitir', descricao: 'Emitir nova prescrição' },
      { chave: 'receitas.editar', rotulo: 'Editar', descricao: 'Retificar prescrição' },
      { chave: 'receitas.excluir', rotulo: 'Cancelar', descricao: 'Cancelar receita emitida' },
      { chave: 'receitas.imprimir', rotulo: 'Imprimir', descricao: 'Imprimir receita oficial' },
    ],
  },
  {
    id: 'financeiro',
    nome: 'Financeiro & Caixa',
    descricao: 'Contas a pagar, contas a receber, fluxo de caixa e formas de pagamento',
    icon: DollarSign,
    acoes: [
      { chave: 'financeiro.ler', rotulo: 'Visualizar', descricao: 'Ver fluxo e transações' },
      { chave: 'financeiro.criar', rotulo: 'Registrar', descricao: 'Lançar receitas e despesas' },
      { chave: 'financeiro.editar', rotulo: 'Editar', descricao: 'Baixar e atualizar lançamentos' },
      { chave: 'financeiro.excluir', rotulo: 'Excluir', descricao: 'Remover lançamento' },
    ],
  },
  {
    id: 'relatorios',
    nome: 'Relatórios Gerenciais',
    descricao: 'Estatísticas de consultas, indicadores clínicos e relatórios contábeis',
    icon: BarChart3,
    acoes: [
      { chave: 'relatorios.ler', rotulo: 'Geral', descricao: 'Acesso básico aos relatórios' },
      { chave: 'relatorios.clinicos', rotulo: 'Clínicos', descricao: 'Patologias e refrações' },
      { chave: 'relatorios.agenda', rotulo: 'Agenda', descricao: 'Faltas e ocupação de agenda' },
      { chave: 'relatorios.financeiros', rotulo: 'Financeiros', descricao: 'DRE e fluxo de caixa' },
      { chave: 'relatorios.todos', rotulo: 'Todos', descricao: 'Acesso irrestrito a relatórios' },
    ],
  },
  {
    id: 'empresa',
    nome: 'Dados do Consultório',
    descricao: 'Dados cadastrais, logo, horários de atendimento e termos LGPD',
    icon: Building2,
    acoes: [
      { chave: 'empresa.ler', rotulo: 'Visualizar', descricao: 'Consultar configurações' },
      { chave: 'empresa.editar', rotulo: 'Editar', descricao: 'Alterar dados da empresa' },
    ],
  },
  {
    id: 'usuarios',
    nome: 'Gestão de Usuários',
    descricao: 'Criação e manutenção de contas da equipe e atribuição de papéis',
    icon: UserCheck,
    acoes: [
      { chave: 'usuarios.ler', rotulo: 'Visualizar', descricao: 'Listar colaboradores' },
      { chave: 'usuarios.criar', rotulo: 'Criar', descricao: 'Cadastrar novo colaborador' },
      { chave: 'usuarios.editar', rotulo: 'Editar', descricao: 'Editar dados e papéis' },
      { chave: 'usuarios.excluir', rotulo: 'Desativar', descricao: 'Desativar contas' },
    ],
  },
  {
    id: 'papeis',
    nome: 'Papéis & Permissões',
    descricao: 'Edição de permissões dos papéis e criação de perfis personalizados',
    icon: Shield,
    acoes: [
      { chave: 'papeis.ler', rotulo: 'Visualizar', descricao: 'Consultar papéis' },
      { chave: 'papeis.criar', rotulo: 'Criar', descricao: 'Criar novo papel' },
      { chave: 'papeis.editar', rotulo: 'Editar', descricao: 'Salvar matriz de permissões' },
      { chave: 'papeis.excluir', rotulo: 'Excluir', descricao: 'Excluir papéis customizados' },
    ],
  },
  {
    id: 'auditoria',
    nome: 'Trilha de Auditoria',
    descricao: 'Rastreabilidade de alterações com histórico de quem, quando e valores',
    icon: History,
    acoes: [
      { chave: 'auditoria.ler', rotulo: 'Visualizar', descricao: 'Consultar logs de auditoria' },
    ],
  },
];

export const RolesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Papel atualmente selecionado para edição
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');

  // Estado das permissões do papel em edição
  const [activePermissoes, setActivePermissoes] = useState<Record<string, boolean>>({});
  const [roleNome, setRoleNome] = useState('');
  const [roleDescricao, setRoleDescricao] = useState('');

  // Estados de feedback de gravação
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal para criar novo papel personalizado
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleNome, setNewRoleNome] = useState('');
  const [newRoleDescricao, setNewRoleDescricao] = useState('');
  const [newRoleBaseId, setNewRoleBaseId] = useState('recepcao');
  const [newRoleError, setNewRoleError] = useState<string | null>(null);

  // Modal para confirmar exclusão de papel personalizado
  const [roleToDelete, setRoleToDelete] = useState<Papel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canEditRoles = hasPermission('papeis.editar');
  const canCreateRoles = hasPermission('papeis.criar');
  const canDeleteRoles = hasPermission('papeis.excluir');

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [papeisData, usersData] = await Promise.all([
        usersRolesService.getPapeis(),
        usersRolesService.getUsuarios(),
      ]);
      setPapeis(papeisData);
      setUsuarios(usersData);

      // Define papel selecionado inicial
      if (papeisData.length > 0) {
        const adminRole = papeisData.find((p) => p.id === 'admin') || papeisData[0];
        setSelectedRoleId(adminRole.id);
        setActivePermissoes(adminRole.permissoes || {});
        setRoleNome(adminRole.nome);
        setRoleDescricao(adminRole.descricao);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados de papéis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const selectedRole = useMemo(() => {
    return papeis.find((p) => p.id === selectedRoleId);
  }, [papeis, selectedRoleId]);

  // Contagem de usuários associados a cada papel
  const usuariosPorPapel = useMemo(() => {
    const map = new Map<string, number>();
    usuarios.forEach((u) => {
      const count = map.get(u.papelId) || 0;
      map.set(u.papelId, count + 1);
    });
    return map;
  }, [usuarios]);

  // Ao trocar de papel selecionado
  const handleSelectRole = (papel: Papel) => {
    setSelectedRoleId(papel.id);
    setActivePermissoes({ ...(papel.permissoes || {}) });
    setRoleNome(papel.nome);
    setRoleDescricao(papel.descricao);
    setSaveSuccess(false);
  };

  // Alternar checkbox de uma permissão individual
  const handleTogglePermission = (chave: string) => {
    if (selectedRoleId === 'admin') return; // Admin é protegido contra alterações

    setActivePermissoes((prev) => {
      const next = { ...prev };
      if (next[chave]) {
        delete next[chave];
      } else {
        next[chave] = true;
      }
      return next;
    });
    setSaveSuccess(false);
  };

  // Alternar todas as ações de um módulo
  const handleToggleModulo = (modulo: ModuloConfig, marcarTodos: boolean) => {
    if (selectedRoleId === 'admin') return;

    setActivePermissoes((prev) => {
      const next = { ...prev };
      modulo.acoes.forEach((acao) => {
        if (marcarTodos) {
          next[acao.chave] = true;
        } else {
          delete next[acao.chave];
        }
      });
      // Também atualiza chave curinga modulo.*
      if (marcarTodos) {
        next[`${modulo.id}.*`] = true;
      } else {
        delete next[`${modulo.id}.*`];
      }
      return next;
    });
    setSaveSuccess(false);
  };

  // Salvar alterações no papel atual
  const handleSaveRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.id === 'admin') {
      alert('As permissões do Administrador são protegidas e não podem ser alteradas.');
      return;
    }

    try {
      setSaving(true);
      await usersRolesService.atualizarPapel(selectedRole.id, {
        nome: roleNome.trim(),
        descricao: roleDescricao.trim(),
        permissoes: activePermissoes,
      });

      // Atualiza localmente
      setPapeis((prev) =>
        prev.map((p) =>
          p.id === selectedRole.id
            ? { ...p, nome: roleNome.trim(), descricao: roleDescricao.trim(), permissoes: activePermissoes }
            : p
        )
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar permissões do papel.');
    } finally {
      setSaving(false);
    }
  };

  // Criar novo papel personalizado
  const handleCreateNewRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewRoleError(null);

    if (!newRoleNome.trim()) {
      setNewRoleError('Informe o nome do novo papel.');
      return;
    }

    try {
      // Clona permissões de um papel base existente para facilidade do usuário
      const basePapel = papeis.find((p) => p.id === newRoleBaseId);
      const permissoesBase = basePapel?.permissoes ? { ...basePapel.permissoes } : {};

      const res = await usersRolesService.criarPapel({
        nome: newRoleNome.trim(),
        descricao: newRoleDescricao.trim() || `Papel personalizado baseado em ${basePapel?.nome || 'Recepção'}`,
        permissoes: permissoesBase,
      });

      setPapeis((prev) => [...prev, res.papel]);
      setIsNewRoleModalOpen(false);
      setNewRoleNome('');
      setNewRoleDescricao('');

      // Seleciona o novo papel para edição
      handleSelectRole(res.papel);
    } catch (err: unknown) {
      setNewRoleError(err instanceof Error ? err.message : 'Erro ao criar papel.');
    }
  };

  // Excluir papel personalizado
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setDeleting(true);
      await usersRolesService.excluirPapel(roleToDelete.id);
      setPapeis((prev) => prev.filter((p) => p.id !== roleToDelete.id));
      setRoleToDelete(null);

      // Redireciona para o admin
      const adminRole = papeis.find((p) => p.id === 'admin');
      if (adminRole) handleSelectRole(adminRole);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir papel.');
    } finally {
      setDeleting(false);
    }
  };

  const isAdminRole = selectedRoleId === 'admin';
  const roleUserCount = selectedRole ? usuariosPorPapel.get(selectedRole.id) || 0 : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Papéis & Matriz de Permissões
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle granular de acesso no modelo (módulo × ação) com efeito imediato
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarDados}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          {canCreateRoles && (
            <button
              onClick={() => setIsNewRoleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all shadow-sm active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Papel Personalizado</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Principal: Lista de Papéis à Esquerda + Matriz de Permissões à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Lista de Papéis */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">
              Papéis do Sistema ({papeis.length})
            </h2>

            <div className="space-y-2">
              {papeis.map((papel) => {
                const isSelected = papel.id === selectedRoleId;
                const count = usuariosPorPapel.get(papel.id) || 0;

                return (
                  <button
                    key={papel.id}
                    onClick={() => handleSelectRole(papel)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {papel.nome}
                        </span>
                        {papel.sistema ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Sistema
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {papel.descricao}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1"
                        title={`${count} usuário(s) associado(s)`}
                      >
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{count}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dica de Segurança */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Regras de Governança:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>
                <strong>Admin:</strong> Possui acesso total e irrestrito. Suas permissões são protegidas
                contra desmarcação.
              </li>
              <li>
                <strong>Papéis de Sistema:</strong> Não podem ser excluídos, mas suas permissões podem
                ser refinadas.
              </li>
              <li>
                <strong>Papéis em uso:</strong> Não podem ser excluídos enquanto houver usuários
                associados.
              </li>
              <li>
                <strong>Efeito em Tempo Real:</strong> Alterações nas permissões passam a valer na
                próxima requisição dos usuários.
              </li>
            </ul>
          </div>
        </div>

        {/* Painel Direito: Matriz de Permissões */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRole ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Barra do Papel Selecionado */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900">{selectedRole.nome}</h2>
                    {isAdminRole ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                        <Lock className="w-3 h-3" />
                        Acesso Total & Protegido
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Editável
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    {selectedRole.descricao}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Excluir papel personalizado (se não for de sistema) */}
                  {!selectedRole.sistema && canDeleteRoles && (
                    <button
                      onClick={() => setRoleToDelete(selectedRole)}
                      disabled={roleUserCount > 0}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title={
                        roleUserCount > 0
                          ? `Não é possível excluir: ${roleUserCount} usuário(s) associado(s)`
                          : 'Excluir este papel'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Papel</span>
                    </button>
                  )}

                  {/* Salvar Permissões */}
                  {canEditRoles && !isAdminRole && (
                    <button
                      onClick={handleSaveRole}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Salvar Permissões</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback de Gravação */}
              {saveSuccess && (
                <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Permissões de <strong>{selectedRole.nome}</strong> salvas com sucesso! As alterações
                    já surtem efeito imediato para todos os usuários associados.
                  </span>
                </div>
              )}

              {isAdminRole && (
                <div className="m-4 p-3.5 bg-purple-50/70 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Administrador com Acesso Completo:</strong> Conforme definido na especificação
                    técnica, o papel Administrador possui permissão irrestrita (curinga <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">*.*</code>)
                    em todos os módulos e não pode ter suas permissões desativadas.
                  </div>
                </div>
              )}

              {/* Matriz de Permissões: Módulo x Ação */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Módulo do Sistema</span>
                  <span className="text-[11px]">Ações Permitidas (Marque para conceder)</span>
                </div>

                <div className="space-y-3">
                  {MODULOS_SISTEMA.map((modulo) => {
                    const Icon = modulo.icon;
                    // Verifica quantas ações estão ativas
                    const activeCount = modulo.acoes.filter(
                      (a) => isAdminRole || activePermissoes[a.chave] || activePermissoes[`${modulo.id}.*`]
                    ).length;
                    const allSelected = activeCount === modulo.acoes.length;

                    return (
                      <div
                        key={modulo.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900">{modulo.nome}</h3>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  {modulo.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{modulo.descricao}</p>
                            </div>
                          </div>

                          {!isAdminRole && canEditRoles && (
                            <div className="flex items-center gap-1 text-xs shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleModulo(modulo, true)}
                                className="px-2 py-1 text-[11px] font-medium rounded-md hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                Todos
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => handleToggleModulo(modulo, false)}
                                className="px-2 py-1 text-[11px] font-medium rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                Nenhum
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Grade de Ações em Checkboxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3">
                          {modulo.acoes.map((acao) => {
                            const isChecked =
                              isAdminRole ||
                              Boolean(activePermissoes[acao.chave]) ||
                              Boolean(activePermissoes[`${modulo.id}.*`]);

                            return (
                              <label
                                key={acao.chave}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? 'bg-purple-50/60 border-purple-200 text-purple-900 font-medium'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                } ${isAdminRole ? 'cursor-default opacity-85' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isAdminRole}
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(acao.chave)}
                                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer disabled:cursor-default"
                                />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{acao.rotulo}</div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    {acao.chave.split('.')[1]}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Shield className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>Selecione um papel à esquerda para visualizar e configurar a matriz de permissões.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA CRIAR NOVO PAPEL */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">Novo Papel Personalizado</h3>
              </div>
              <button
                onClick={() => setIsNewRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewRole} className="p-6 space-y-4">
              {newRoleError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{newRoleError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Papel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultor Óptico Especialista"
                  value={newRoleNome}
                  onChange={(e) => setNewRoleNome(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição das Atribuições
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Responsável por conferência de armações e suporte a exames..."
                  value={newRoleDescricao}
                  onChange={(e) => setNewRoleDescricao(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clonar permissões iniciais de:
                </label>
                <select
                  value={newRoleBaseId}
                  onChange={(e) => setNewRoleBaseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white"
                >
                  {papeis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.descricao.slice(0, 40)}...)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Você poderá ajustar a matriz de permissões logo após a criação.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all shadow-sm"
                >
                  Criar Papel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PARA EXCLUIR PAPEL PERSONALIZADO */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Papel Personalizado?
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tem certeza de que deseja excluir permanentemente o papel{' '}
                  <strong>{roleToDelete.nome}</strong>?
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setRoleToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={deleting}
                  onClick={handleConfirmDeleteRole}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {deleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RolesPage;
