import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ForcePasswordChangeModal: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user?.trocarSenhaNoPrimeiroAcesso) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senhaAtual) {
      setError('Informe a senha temporária atual.');
      return;
    }

    if (novaSenha.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setError('A confirmação da senha não coincide com a nova senha digitada.');
      return;
    }

    if (novaSenha === senhaAtual) {
      setError('A nova senha não pode ser idêntica à senha temporária.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(senhaAtual, novaSenha);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar a senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-center text-white mb-1">
          Troca Obrigatória de Senha
        </h3>
        <p className="text-xs text-center text-slate-400 mb-6">
          Por motivos de segurança em seu primeiro acesso, defina uma nova senha confidencial para sua conta ({user.email}).
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-emerald-400">Senha atualizada com sucesso!</p>
            <p className="text-xs text-slate-400">Você já pode utilizar o sistema normalmente.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Senha Temporária Atual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Senha informada no ambiente"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nova Senha (Mínimo 8 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirme a Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex items-center gap-1.5 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Ocultar senhas' : 'Exibir senhas'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <span>{loading ? 'Salvando nova senha...' : 'Definir Senha e Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
