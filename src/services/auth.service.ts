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
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  DEMO_USER_OPTOMETRIST,
  DEMO_USER_SECRETARY,
} from './storage-local';

class AuthService {
  private currentUserProfile: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];

  constructor() {
    this.currentUserProfile = getStoredData<UserProfile | null>(
      STORAGE_KEYS.CURRENT_USER,
      DEMO_USER_OPTOMETRIST
    );

    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await this.fetchUserProfile(firebaseUser);
          this.currentUserProfile = profile;
          setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
          this.notifyListeners(profile);
        } else {
          if (this.currentUserProfile && !this.isDemoUser(this.currentUserProfile.uid)) {
            this.currentUserProfile = null;
            setStoredData(STORAGE_KEYS.CURRENT_USER, null);
            this.notifyListeners(null);
          }
        }
      });
    }
  }

  private isDemoUser(uid: string): boolean {
    return uid === 'optometrista-01' || uid === 'secretaria-01' || uid.startsWith('demo-');
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

  private async fetchUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        }
      } catch (e) {
        console.warn('Erro ao buscar perfil no Firestore, usando fallback:', e);
      }
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Membro da Equipe',
      role: 'optometrista',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
    };
  }

  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await this.fetchUserProfile(cred.user);
      this.currentUserProfile = profile;
      setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
      this.notifyListeners(profile);
      return profile;
    }

    // Modo local para desenvolvimento/demonstração
    if (email.toLowerCase().includes('secretaria') || email.toLowerCase().includes('recepcao')) {
      return this.mockLoginAs('secretaria');
    }
    const profile: UserProfile = {
      uid: `local-${Date.now()}`,
      email,
      displayName: email.split('@')[0].replace('.', ' '),
      role: 'optometrista',
      createdAt: new Date().toISOString(),
    };
    this.currentUserProfile = profile;
    setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
    this.notifyListeners(profile);
    return profile;
  }

  public async loginWithGoogle(): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const profile = await this.fetchUserProfile(cred.user);
      this.currentUserProfile = profile;
      setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
      this.notifyListeners(profile);
      return profile;
    }

    return this.mockLoginAs('optometrista');
  }

  public async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    console.info(`[Simulado] E-mail de redefinição de senha enviado para: ${email}`);
  }

  public async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Erro ao sair do Firebase:', e);
      }
    }
    this.currentUserProfile = null;
    setStoredData(STORAGE_KEYS.CURRENT_USER, null);
    this.notifyListeners(null);
  }

  public mockLoginAs(role: UserRole): UserProfile {
    let profile: UserProfile;
    if (role === 'secretaria') {
      profile = { ...DEMO_USER_SECRETARY };
    } else {
      profile = { ...DEMO_USER_OPTOMETRIST };
    }
    this.currentUserProfile = profile;
    setStoredData(STORAGE_KEYS.CURRENT_USER, profile);
    this.notifyListeners(profile);
    return profile;
  }
}

export const authService = new AuthService();
