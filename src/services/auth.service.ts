import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { hasPermission, PAPEIS_PADRAO } from '../utils/permissions';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  DEMO_USER_OPTOMETRIST,
  DEMO_USER_SECRETARY,
} from './storage-local';

const DEMO_USER_ADMIN: UserProfile = {
  uid: 'admin-01',
  email: 'admin@consultoriorobertoviana.com.br',
  displayName: 'Administrador do Sistema',
  role: 'admin',
  papelId: 'admin',
  papelNome: 'Admin',
  permissoes: PAPEIS_PADRAO.admin.permissoes,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const DEMO_USER_FINANCIAL: UserProfile = {
  uid: 'financeiro-01',
  email: 'financeiro@consultoriorobertoviana.com.br',
  displayName: 'Marcos Finanças',
  role: 'financeiro',
  papelId: 'financeiro',
  papelNome: 'Financeiro',
  permissoes: PAPEIS_PADRAO.financeiro.permissoes,
  createdAt: '2026-01-15T00:00:00.000Z',
};

const SESSION_TOKEN_KEY = 'consultorio_auth_token_v1';

class AuthService {
  private currentUserProfile: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];
  private sessionToken: string | null = null;

  constructor() {
    this.sessionToken = typeof window !== 'undefined' ? localStorage.getItem(SESSION_TOKEN_KEY) : null;
    this.currentUserProfile = getStoredData<UserProfile | null>(
      STORAGE_KEYS.CURRENT_USER,
      DEMO_USER_OPTOMETRIST
    );

    // Se temos um usuário armazenado mas ele não tem papelId/permissoes, sincroniza com papel padrão
    if (this.currentUserProfile && !this.currentUserProfile.permissoes) {
      this.attachDefaultPermissions(this.currentUserProfile);
    }

    // Inicializa sincronização em tempo real com a API do servidor se estiver logado
    if (typeof window !== 'undefined') {
      this.refreshServerProfile().catch(() => {});
    }

    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await this.fetchUserProfile(firebaseUser);
          this.setCurrentUser(profile);
        } else {
          if (this.currentUserProfile && !this.isDemoUser(this.currentUserProfile.uid) && !this.sessionToken) {
            this.setCurrentUser(null);
          }
        }
      });
    }
  }

  private isDemoUser(uid: string): boolean {
    return uid === 'optometrista-01' || uid === 'secretaria-01' || uid === 'admin-01' || uid === 'financeiro-01' || uid.startsWith('demo-');
  }

  private attachDefaultPermissions(profile: UserProfile): void {
    const papelId = profile.papelId || (profile.role === 'admin' ? 'admin' : profile.role === 'financeiro' ? 'financeiro' : (profile.role === 'secretaria' || (profile.role as string) === 'recepcao') ? 'recepcao' : 'optometrista');
    profile.papelId = papelId;
    const defaultPapel = PAPEIS_PADRAO[papelId] || PAPEIS_PADRAO.optometrista;
    profile.papelNome = defaultPapel.nome;
    profile.permissoes = defaultPapel.permissoes;
  }

  private setCurrentUser(profile: UserProfile | null): void {
    this.currentUserProfile = profile;
    setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
    this.notifyListeners(profile);
  }

  private notifyListeners(user: UserProfile | null) {
    this.listeners.forEach((listener) => listener(user));
  }

  public onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUserProfile);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUserProfile;
  }

  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  public hasUserPermission(requiredPerm: string): boolean {
    if (!this.currentUserProfile) return false;
    return hasPermission(this.currentUserProfile.permissoes, requiredPerm);
  }

  /**
   * Sincroniza em tempo real as permissões e perfil do usuário logado diretamente com o servidor
   */
  public async refreshServerProfile(): Promise<UserProfile | null> {
    try {
      const headers: Record<string, string> = {};
      if (this.sessionToken) {
        headers['Authorization'] = `Bearer ${this.sessionToken}`;
      }
      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const profile: UserProfile = {
            uid: data.user.uid,
            email: data.user.email,
            displayName: data.user.nome || data.user.email,
            role: data.user.papelId === 'admin' ? 'admin' : data.user.papelId === 'financeiro' ? 'financeiro' : data.user.papelId === 'recepcao' ? 'recepcao' : 'optometrista',
            papelId: data.user.papelId,
            papelNome: data.user.papelNome,
            permissoes: data.user.permissoes || {},
            trocarSenhaNoPrimeiroAcesso: data.user.trocarSenhaNoPrimeiroAcesso,
            phone: data.user.telefone,
            photoURL: data.user.fotoUrl,
            registerNumber: data.user.registroProfissional,
            createdAt: data.user.criadoEm,
          };
          this.setCurrentUser(profile);
          return profile;
        }
      }
    } catch {
      // Ignora falha silenciosa de sincronização offline
    }
    return this.currentUserProfile;
  }

  private async fetchUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          this.attachDefaultPermissions(data);
          return data;
        }
      } catch (e) {
        console.warn('Erro ao buscar perfil no Firestore, usando fallback:', e);
      }
    }

    const defaultProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Membro da Equipe',
      role: 'optometrista',
      papelId: 'optometrista',
      papelNome: 'Optometrista',
      permissoes: PAPEIS_PADRAO.optometrista.permissoes,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
    };
    return defaultProfile;
  }

  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    // 1. Tenta autenticação real com a API do servidor (sessão segura + hash de senha + rate limit)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      if (data.sessionToken) {
        this.sessionToken = data.sessionToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
        }
      }

      const user = data.user;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.nome,
        role: user.papelId === 'admin' ? 'admin' : user.papelId === 'financeiro' ? 'financeiro' : user.papelId === 'recepcao' ? 'recepcao' : 'optometrista',
        papelId: user.papelId,
        papelNome: user.papelNome,
        permissoes: user.permissoes,
        trocarSenhaNoPrimeiroAcesso: user.trocarSenhaNoPrimeiroAcesso,
        phone: user.telefone,
        photoURL: user.fotoUrl,
        registerNumber: user.registroProfissional,
        createdAt: user.criadoEm,
      };

      this.setCurrentUser(profile);
      return profile;
    } catch (serverErr: unknown) {
      const serverErrMsg = serverErr instanceof Error ? serverErr.message : String(serverErr);
      if (serverErrMsg.includes('Limite de tentativas') || serverErrMsg.includes('Senha incorreta') || serverErrMsg.includes('Usuário não encontrado') || serverErrMsg.includes('desativada')) {
        throw serverErr;
      }

      // Se Firebase estiver configurado e o servidor falhou por rede, tenta Firebase
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const profile = await this.fetchUserProfile(cred.user);
        this.setCurrentUser(profile);
        return profile;
      }

      // Fallback local caso o endpoint não esteja acessível
      if (email.toLowerCase().includes('admin')) {
        return this.mockLoginAs('admin');
      }
      if (email.toLowerCase().includes('financeiro')) {
        return this.mockLoginAs('financeiro');
      }
      if (email.toLowerCase().includes('secretaria') || email.toLowerCase().includes('recepcao')) {
        return this.mockLoginAs('recepcao');
      }

      const fallbackProfile: UserProfile = {
        uid: `local-${Date.now()}`,
        email,
        displayName: email.split('@')[0].replace('.', ' '),
        role: 'optometrista',
        papelId: 'optometrista',
        papelNome: 'Optometrista',
        permissoes: PAPEIS_PADRAO.optometrista.permissoes,
        createdAt: new Date().toISOString(),
      };
      this.setCurrentUser(fallbackProfile);
      return fallbackProfile;
    }
  }

  public async loginWithGoogle(): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const profile = await this.fetchUserProfile(cred.user);
      this.setCurrentUser(profile);
      return profile;
    }

    return this.mockLoginAs('optometrista');
  }

  public async resetPassword(email: string): Promise<{ success: boolean; message: string; devResetUrl?: string }> {
    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao solicitar recuperação.');
      }
      return data;
    } catch (e) {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: 'E-mail enviado via Firebase' };
      }
      console.info(`[Simulado] E-mail de redefinição de senha enviado para: ${email}`);
      return { success: true, message: 'Instruções enviadas com sucesso para o e-mail cadastrado.' };
    }
  }

  public async resetPasswordWithToken(token: string, novaSenha: string): Promise<void> {
    const res = await fetch('/api/auth/redefinir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, novaSenha }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao redefinir a senha.');
    }
  }

  public async changePassword(senhaAtual: string, novaSenha: string): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const res = await fetch('/api/auth/trocar-senha', {
      method: 'POST',
      headers,
      body: JSON.stringify({ senhaAtual, novaSenha }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao atualizar a senha.');
    }

    if (this.currentUserProfile) {
      this.currentUserProfile.trocarSenhaNoPrimeiroAcesso = false;
      this.setCurrentUser({ ...this.currentUserProfile, trocarSenhaNoPrimeiroAcesso: false });
    }
  }

  public async logout(): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (this.sessionToken) {
        headers['Authorization'] = `Bearer ${this.sessionToken}`;
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch {
      // Ignora erro de rede no logout
    }

    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Erro ao sair do Firebase:', e);
      }
    }

    this.sessionToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    this.setCurrentUser(null);
  }

  public mockLoginAs(role: UserRole | string): UserProfile {
    let profile: UserProfile;
    if (role === 'admin') {
      profile = { ...DEMO_USER_ADMIN };
    } else if (role === 'financeiro') {
      profile = { ...DEMO_USER_FINANCIAL };
    } else if (role === 'secretaria' || role === 'recepcao') {
      profile = {
        ...DEMO_USER_SECRETARY,
        role: 'recepcao',
        papelId: 'recepcao',
        papelNome: 'Recepção',
        permissoes: PAPEIS_PADRAO.recepcao.permissoes,
      };
    } else {
      profile = {
        ...DEMO_USER_OPTOMETRIST,
        role: 'optometrista',
        papelId: 'optometrista',
        papelNome: 'Optometrista',
        permissoes: PAPEIS_PADRAO.optometrista.permissoes,
      };
    }

    this.attachDefaultPermissions(profile);
    this.setCurrentUser(profile);
    return profile;
  }
}

export const authService = new AuthService();
