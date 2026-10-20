import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Glasses, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultorio } from '../../contexts/ConsultorioContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { consultorio } = useConsultorio();
  const { resetPasswordWithToken } = useAuth();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Token de recuperação ausente ou inválido. Solicite uma nova recuperação.');
      return;
    }

    if (novaSenha.length < 8) {
      setError('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setError('A confirmação da senha não coincide com a nova senha digitada.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await resetPasswordWithToken(token, novaSenha);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir a senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <Glasses className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">
            {consultorio.nomeFantasia}
          </span>
        </Link>
        <h2 className="mt-4 text-center text-lg font-bold tracking-tight text-white">
          Redefinição de Senha
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Cadastre sua nova senha de acesso ao sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10 backdrop-blur-md">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Senha Redefinida!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sua senha foi atualizada com sucesso. Você já pode fazer login na plataforma.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Ir para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!token && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-2">
                  Link de redefinição incompleto. Utilize o link enviado por e-mail ou solicite novamente.
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nova Senha (Mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirme a Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmaSenha}
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                <span>{loading ? 'Redefinindo...' : 'Atualizar Minha Senha'}</span>
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
