import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Award,
  Clock,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Usuario, Papel } from '../../types';
import { usersRolesService } from '../../services/users-roles.service';
import { useAuth } from '../../contexts/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estado do Modal de Criar/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formPapelId, setFormPapelId] = useState('recepcao');
  const [formRegistro, setFormRegistro] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal de Link de Ativação / Definição de Senha (apresentado uma única vez ao Admin)
  const [createdUserSuccess, setCreatedUserSuccess] = useState<{
    nome: string;
    email: string;
    definicaoUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal de Confirmação de Desativação
  const [userToDeactivate, setUserToDeactivate] = useState<Usuario | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Permissões do usuário logado
  const canCreate = hasPermission('usuarios.criar');
  const canEdit = hasPermission('usuarios.editar');
  const canDelete = hasPermission('usuarios.excluir');

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, rolesData] = await Promise.all([
        usersRolesService.getUsuarios(),
        usersRolesService.getPapeis(),
      ]);
      setUsuarios(usersData);
      setPapeis(rolesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Mapeamento de nome de papéis
  const papeisMap = useMemo(() => {
    const map = new Map<string, string>();
    papeis.forEach((p) => map.set(p.id, p.nome));
    return map;
  }, [papeis]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      // Busca textual
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        u.nome.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.telefone && u.telefone.toLowerCase().includes(search)) ||
        (u.registroProfissional && u.registroProfissional.toLowerCase().includes(search));

      // Filtro por papel
      const matchRole = filterRole === 'todos' || u.papelId === filterRole;

      // Filtro por status
      const matchStatus =
        filterStatus === 'todos' ||
        (filterStatus === 'ativo' && u.ativo) ||
        (filterStatus === 'inativo' && !u.ativo);

      return matchSearch && matchRole && matchStatus;
    });
  }, [usuarios, searchTerm, filterRole, filterStatus]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Abrir Modal de Novo Usuário
  const handleOpenNewModal = () => {
    setEditingUser(null);
    setFormNome('');
    setFormEmail('');
    setFormTelefone('');
    setFormPapelId(papeis[0]?.id || 'recepcao');
    setFormRegistro('');
    setFormAtivo(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (u: Usuario) => {
    setEditingUser(u);
    setFormNome(u.nome);
    setFormEmail(u.email);
    setFormTelefone(u.telefone || '');
    setFormPapelId(u.papelId);
    setFormRegistro(u.registroProfissional || '');
    setFormAtivo(u.ativo);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submissão do Formulário
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formNome.trim() || !formEmail.trim() || !formPapelId) {
      setModalError('Nome, e-mail e papel são obrigatórios.');
      return;
    }

    try {
      setModalSubmitting(true);
      if (editingUser) {
        // Atualização
        await usersRolesService.atualizarUsuario(editingUser.uid, {
          nome: formNome.trim(),
          telefone: formTelefone.trim() || undefined,
          papelId: formPapelId,
          ativo: formAtivo,
          registroProfissional: formRegistro.trim() || undefined,
        });
        setIsModalOpen(false);
        await carregarDados();
      } else {
        // Criação de novo usuário
        const res = await usersRolesService.criarUsuario({
          nome: formNome.trim(),
          email: formEmail.trim().toLowerCase(),
          papelId: formPapelId,
          telefone: formTelefone.trim() || undefined,
          registroProfissional: formRegistro.trim() || undefined,
          ativo: formAtivo,
        });

        setIsModalOpen(false);
        await carregarDados();

        // Se o servidor retornou o link de definição de senha, exibe ao admin em modal único
        if (res.definicaoUrl) {
          const fullUrl = `${window.location.origin}${res.definicaoUrl}`;
          setCreatedUserSuccess({
            nome: formNome.trim(),
            email: formEmail.trim(),
            definicaoUrl: fullUrl,
          });
        }
      }
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao salvar usuário.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Executar desativação segura
  const handleConfirmDeactivation = async () => {
    if (!userToDeactivate) return;
    try {
      setDeactivating(true);
      await usersRolesService.desativarUsuario(userToDeactivate.uid);
      setUserToDeactivate(null);
      await carregarDados();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao desativar usuário.');
    } finally {
      setDeactivating(false);
    }
  };

  // Copiar link de definição
  const handleCopyLink = () => {
    if (!createdUserSuccess) return;
    navigator.clipboard.writeText(createdUserSuccess.definicaoUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão da Equipe & Usuários
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de acessos, papéis e permissões para o consultório de optometria
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarDados}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          {canCreate && (
            <button
              onClick={handleOpenNewModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow-teal-500/20 active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, telefone ou registro..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Filtro por Papel */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Shield className="w-4 h-4 text-slate-400" />
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
          >
            <option value="todos">Todos os Papéis</option>
            {papeis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-2 min-w-[170px]">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as 'todos' | 'ativo' | 'inativo');
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Erro Geral */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && usuarios.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm">Carregando usuários da equipe...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-base font-medium text-slate-700">Nenhum usuário encontrado</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Não encontramos colaboradores correspondentes aos filtros aplicados.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Papel & Acesso</th>
                  <th className="py-3.5 px-4">Contato</th>
                  <th className="py-3.5 px-4">Registro Profissional</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Último Acesso</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map((u) => {
                  const isSelf = currentUser?.uid === u.uid;
                  const papelNome = papeisMap.get(u.papelId) || u.papelId;

                  // Estilo da tag do papel
                  const getRoleBadgeStyle = (papelId: string) => {
                    switch (papelId) {
                      case 'admin':
                        return 'bg-purple-50 text-purple-700 border-purple-200';
                      case 'optometrista':
                        return 'bg-teal-50 text-teal-700 border-teal-200';
                      case 'financeiro':
                        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'recepcao':
                        return 'bg-blue-50 text-blue-700 border-blue-200';
                      default:
                        return 'bg-slate-100 text-slate-700 border-slate-200';
                    }
                  };

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !u.ativo ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Colaborador */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm border border-slate-200">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{u.nome}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Papel */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeStyle(
                            u.papelId
                          )}`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{papelNome}</span>
                        </span>
                      </td>

                      {/* Contato */}
                      <td className="py-3.5 px-4">
                        {u.telefone ? (
                          <div className="text-xs text-slate-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.telefone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">–</span>
                        )}
                      </td>

                      {/* Registro Profissional */}
                      <td className="py-3.5 px-4">
                        {u.registroProfissional ? (
                          <div className="inline-flex items-center gap-1 text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Award className="w-3 h-3 text-teal-600" />
                            <span>{u.registroProfissional}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">–</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Último Acesso */}
                      <td className="py-3.5 px-4">
                        {u.ultimoAcesso ? (
                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(u.ultimoAcesso).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Nunca acessou</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Editar colaborador"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && u.ativo && !isSelf && (
                            <button
                              onClick={() => setUserToDeactivate(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Desativar usuário (encerrar sessões)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile (< 1024px): Cards de Colaborador com toque >= 44px */}
          <div className="lg:hidden divide-y divide-slate-100 p-3 space-y-3">
            {paginatedUsers.map((u) => {
              const isSelf = currentUser?.uid === u.uid;
              const papelNome = papeisMap.get(u.papelId) || u.papelId;

              const getRoleBadgeStyle = (papelId: string) => {
                switch (papelId) {
                  case 'admin':
                    return 'bg-purple-50 text-purple-700 border-purple-200';
                  case 'optometrista':
                    return 'bg-teal-50 text-teal-700 border-teal-200';
                  case 'financeiro':
                    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  case 'recepcao':
                    return 'bg-blue-50 text-blue-700 border-blue-200';
                  default:
                    return 'bg-slate-100 text-slate-700 border-slate-200';
                }
              };

              return (
                <div
                  key={`mobile-user-${u.uid}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    !u.ativo
                      ? 'bg-slate-50/60 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm border border-slate-200">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <span>{u.nome}</span>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadgeStyle(
                        u.papelId
                      )}`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{papelNome}</span>
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato</span>
                      {u.telefone ? (
                        <a
                          href={`tel:${u.telefone.replace(/\D/g, '')}`}
                          className="font-medium text-teal-700 hover:underline flex items-center gap-1 mt-0.5 min-h-[30px]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{u.telefone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 block mt-0.5">–</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                      <div className="mt-0.5">
                        {u.ativo ? (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações Mobile com alvo >= 44px */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                        <span>Editar Colaborador</span>
                      </button>
                    )}

                    {canDelete && u.ativo && !isSelf && (
                      <button
                        onClick={() => setUserToDeactivate(u)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                        title="Desativar"
                        aria-label="Desativar colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

        {/* Rodapé da Tabela com Paginação */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Mostrando{' '}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span>{' '}
              de <span className="font-semibold text-slate-800">{filteredUsers.length}</span> usuários
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <span className="px-3 py-1 font-medium text-slate-700">
                Página {currentPage} de {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1"
              >
                <span>Próxima</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">
                  {editingUser ? 'Editar Colaborador' : 'Novo Colaborador da Equipe'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Camila Rocha"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail de Acesso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingUser)} // e-mail do usuário não é mutável após criação para integridade
                  placeholder="exemplo@consultorio.com.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
                {!editingUser && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Um link seguro de primeiro acesso para definição de senha será gerado para este e-mail.
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              {/* Papel no Sistema */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Papel no Consultório <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPapelId}
                  onChange={(e) => setFormPapelId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                >
                  {papeis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} - {p.descricao.slice(0, 50)}...
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-teal-600 font-medium mt-1">
                  A troca de papel entra em vigor na próxima requisição do usuário, sem necessidade de novo login.
                </p>
              </div>

              {/* Registro Profissional (opcional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registro Profissional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CBO 3223-05 ou CBOO 14.892-SP"
                  value={formRegistro}
                  onChange={(e) => setFormRegistro(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recomendado para optometristas clínicos assinarem receitas ópticas.
                </p>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Usuário Ativo</span>
                  <span className="text-xs text-slate-500">
                    Ao desativar, o usuário não consegue fazer login e suas sessões ativas são encerradas.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    disabled={editingUser?.uid === currentUser?.uid}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Ações do Modal */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO: LINK DE DEFINIÇÃO DE SENHA (EXIBIDO UMA ÚNICA VEZ) */}
      {createdUserSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Colaborador Cadastrado com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Como o serviço de envio de e-mails em tempo real pode estar em modo de desenvolvimento,
                  o link de uso único e com validade de 48h é apresentado abaixo{' '}
                  <strong className="text-slate-700">uma única vez</strong>:
                </p>
              </div>

              {/* Caixa com o Link */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Link de Definição de Senha:</span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Uso Único (48h)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdUserSuccess.definicaoUrl}
                    className="w-full text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-left text-xs text-blue-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Instruções para o Colaborador:
                </p>
                <p className="text-blue-700 leading-relaxed">
                  Envie este link para <strong>{createdUserSuccess.email}</strong>. Ao acessar a página, o
                  colaborador definirá sua senha pessoal de acesso e poderá entrar no sistema imediatamente.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setCreatedUserSuccess(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE DESATIVAÇÃO (EXCLUIR) */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  Desativar Colaborador?
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tem certeza de que deseja desativar o usuário{' '}
                  <strong>{userToDeactivate.nome}</strong> ({userToDeactivate.email})?
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 text-left">
                  <strong>Efeito Imediato:</strong> De acordo com a política de segurança, o usuário terá
                  todas as suas sessões ativas encerradas no servidor e não conseguirá mais efetuar login.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setUserToDeactivate(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={deactivating}
                  onClick={handleConfirmDeactivation}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {deactivating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Confirmar Desativação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersPage;
