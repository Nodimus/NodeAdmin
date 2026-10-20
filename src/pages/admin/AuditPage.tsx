import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  ShieldAlert,
  ArrowRight,
  Database,
  FileCode,
} from 'lucide-react';
import { AuditoriaLog } from '../../types';
import { usersRolesService } from '../../services/users-roles.service';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterColecao, setFilterColecao] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersRolesService.getAuditoria({
        colecao: filterColecao !== 'todas' ? filterColecao : undefined,
        limite: 150,
      });
      setLogs(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar trilha de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, [filterColecao]);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      l.usuarioNome.toLowerCase().includes(s) ||
      l.usuarioEmail.toLowerCase().includes(s) ||
      l.acao.toLowerCase().includes(s) ||
      l.resumo.toLowerCase().includes(s) ||
      l.docId.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Trilha de Auditoria & Segurança
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreamento imutável de alterações cadastrais, concessões de papéis e segurança
            </p>
          </div>
        </div>

        <button
          onClick={carregarLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Atualizar Trilha</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, resumo ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterColecao}
            onChange={(e) => setFilterColecao(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
          >
            <option value="todas">Todas as Coleções</option>
            <option value="usuarios">Usuários</option>
            <option value="papeis">Papéis & Permissões</option>
            <option value="receitas">Receituário</option>
            <option value="financeiro">Financeiro</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Registros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm">Carregando trilha de auditoria...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Database className="w-10 h-10 text-slate-300" />
            <p className="text-base font-medium text-slate-700">Nenhum evento registrado</p>
            <p className="text-xs text-slate-400 max-w-sm">
              As ações de criação, edição e desativação serão gravadas e exibidas aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = Boolean(log.valorAnterior || log.valorNovo);

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {log.acao}
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {log.colecao}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.usuarioNome} ({log.usuarioEmail})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(log.data).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed">
                    {log.resumo}
                  </p>

                  {hasDiff && (
                    <div className="mt-2.5">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{isExpanded ? 'Ocultar detalhes (JSON)' : 'Ver valores alterados'}</span>
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 p-3 bg-slate-900 rounded-xl text-slate-200 text-[11px] font-mono overflow-x-auto">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 border-b border-slate-800 pb-1">
                              Valor Anterior:
                            </div>
                            <pre className="text-rose-300">
                              {log.valorAnterior ? JSON.stringify(log.valorAnterior, null, 2) : 'null (criação)'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 border-b border-slate-800 pb-1">
                              Valor Novo:
                            </div>
                            <pre className="text-emerald-300">
                              {log.valorNovo ? JSON.stringify(log.valorNovo, null, 2) : 'null (exclusão)'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default AuditPage;
