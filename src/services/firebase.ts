import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// Suporta tanto o ambiente de desenvolvimento Vite quanto Node.js/CLI
const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Checa se as variáveis de ambiente essenciais foram fornecidas
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'AIzaSyYourApiKeyHere' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'vinnes-admin'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.info('Consultório Optometria: Firebase inicializado com sucesso.');
  } catch (error) {
    console.warn('Consultório Optometria: Falha ao inicializar Firebase nativo, operando com contingência local.', error);
  }
}

export { app, auth, db, storage };
export default firebaseConfig;
