import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/auth.service';
import { isFirebaseConfigured } from '../services/firebase';
import { hasPermission as checkPerm } from '../utils/permissions';
import { ForcePasswordChangeModal } from '../components/auth/ForcePasswordChangeModal';
import { offlineStorageService } from '../services/offline-storage.service';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string; devResetUrl?: string }>;
  resetPasswordWithToken: (token: string, novaSenha: string) => Promise<void>;
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<void>;
  quickLoginAs: (role: UserRole | string) => UserProfile;
  hasPermission: (perm: string) => boolean;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((userProfile) => {
      setUser(userProfile);
      setLoading(false);
    });

    // Atualiza permissões do servidor em tempo real
    authService.refreshServerProfile().catch(() => {});

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithEmail(email, pass);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle();
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      // LGPD: Limpeza total do cache local/IndexedDB no logout
      await offlineStorageService.limparTudoNoLogout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email);
  };

  const resetPasswordWithToken = async (token: string, novaSenha: string) => {
    await authService.resetPasswordWithToken(token, novaSenha);
  };

  const changePassword = async (senhaAtual: string, novaSenha: string) => {
    await authService.changePassword(senhaAtual, novaSenha);
  };

  const quickLoginAs = (role: UserRole | string) => {
    const loggedUser = authService.mockLoginAs(role);
    setUser(loggedUser);
    return loggedUser;
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    return checkPerm(user.permissoes, perm);
  };

  const refreshProfile = async () => {
    const updated = await authService.refreshServerProfile();
    if (updated) setUser(updated);
    return updated;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isFirebaseConnected: isFirebaseConfigured,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      resetPasswordWithToken,
      changePassword,
      quickLoginAs,
      hasPermission,
      refreshProfile,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {user?.trocarSenhaNoPrimeiroAcesso && <ForcePasswordChangeModal />}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
