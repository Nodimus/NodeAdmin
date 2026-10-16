import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Consultorio } from '../types';
import { getStoredData, setStoredData, STORAGE_KEYS, INITIAL_CONSULTORIO } from './storage-local';

class ConsultorioService {
  private docId = 'dados_gerais';
  private collectionName = 'consultorio';
  private listeners: ((data: Consultorio) => void)[] = [];

  public async getDados(): Promise<Consultorio> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, this.docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Consultorio;
          return data;
        }
      } catch (e) {
        console.warn('Erro ao consultar dados do consultório no Firestore:', e);
      }
    }
    return getStoredData<Consultorio>(STORAGE_KEYS.CONSULTORIO, INITIAL_CONSULTORIO);
  }

  public async atualizarDados(dados: Partial<Omit<Consultorio, 'id'>>): Promise<Consultorio> {
    const atual = await this.getDados();
    const atualizado: Consultorio = {
      ...atual,
      ...dados,
      id: 'dados_gerais', // Garante estritamente que nenhum segundo registro possa ser criado
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, this.docId);
        await setDoc(docRef, atualizado, { merge: true });
      } catch (e) {
        console.warn('Erro ao atualizar dados do consultório no Firestore:', e);
      }
    }

    setStoredData(STORAGE_KEYS.CONSULTORIO, atualizado);
    this.notifyListeners(atualizado);
    return atualizado;
  }

  public subscribe(callback: (data: Consultorio) => void): () => void {
    this.listeners.push(callback);
    this.getDados().then(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(data: Consultorio) {
    this.listeners.forEach((l) => l(data));
  }
}

export const consultorioService = new ConsultorioService();
