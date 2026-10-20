import { Usuario, Papel, AuditoriaLog } from '../types';
import { authService } from './auth.service';

function getAuthHeaders(): Record<string, string> {
  const token = authService.getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const usersRolesService = {
  // ==========================================
  // USUÁRIOS
  // ==========================================
  async getUsuarios(): Promise<Usuario[]> {
    const res = await fetch('/api/admin/usuarios', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao carregar lista de usuários.');
    }
    return res.json();
  },

  async criarUsuario(dados: {
    nome: string;
    email: string;
    papelId: string;
    telefone?: string;
    registroProfissional?: string;
    ativo?: boolean;
    senhaInicial?: string;
  }): Promise<{ usuario: Usuario; definicaoUrl?: string; mensagem: string }> {
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dados),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao criar usuário.');
    }
    return result;
  },

  async atualizarUsuario(
    uid: string,
    dados: {
      nome?: string;
      telefone?: string;
      papelId?: string;
      ativo?: boolean;
      registroProfissional?: string;
    }
  ): Promise<{ usuario: Usuario }> {
    const res = await fetch(`/api/admin/usuarios/${uid}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dados),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao atualizar usuário.');
    }
    return result;
  },

  async desativarUsuario(uid: string): Promise<{ mensagem: string; usuario: Usuario }> {
    const res = await fetch(`/api/admin/usuarios/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao desativar usuário.');
    }
    return result;
  },

  // ==========================================
  // PAPÉIS
  // ==========================================
  async getPapeis(): Promise<Papel[]> {
    const res = await fetch('/api/admin/papeis', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao carregar papéis.');
    }
    return res.json();
  },

  async criarPapel(dados: {
    id?: string;
    nome: string;
    descricao?: string;
    permissoes: Record<string, boolean>;
  }): Promise<{ papel: Papel }> {
    const res = await fetch('/api/admin/papeis', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dados),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao criar papel.');
    }
    return result;
  },

  async atualizarPapel(
    id: string,
    dados: {
      nome?: string;
      descricao?: string;
      permissoes?: Record<string, boolean>;
      ativo?: boolean;
    }
  ): Promise<{ papel: Papel }> {
    const res = await fetch(`/api/admin/papeis/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dados),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao atualizar papel.');
    }
    return result;
  },

  async excluirPapel(id: string): Promise<{ mensagem: string }> {
    const res = await fetch(`/api/admin/papeis/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao excluir papel.');
    }
    return result;
  },

  // ==========================================
  // AUDITORIA
  // ==========================================
  async getAuditoria(filtros?: { colecao?: string; acao?: string; limite?: number }): Promise<AuditoriaLog[]> {
    const params = new URLSearchParams();
    if (filtros?.colecao) params.append('colecao', filtros.colecao);
    if (filtros?.acao) params.append('acao', filtros.acao);
    if (filtros?.limite) params.append('limite', String(filtros.limite));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/admin/auditoria${qs}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao consultar auditoria.');
    }
    const data = await res.json();
    return data.logs || [];
  },
};
