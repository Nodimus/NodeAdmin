import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Consultorio, ConsultorioPublicData } from '../types';
import { getStoredData, setStoredData, STORAGE_KEYS, INITIAL_CONSULTORIO } from './storage-local';
import { authService } from './auth.service';

class ConsultorioService {
  private docId = 'dados_gerais';
  private collectionName = 'consultorio';
  private listeners: ((data: Consultorio) => void)[] = [];

  public async getDados(): Promise<Consultorio> {
    const token = authService.getSessionToken();
    try {
      const endpoint = token ? '/api/admin/empresa' : '/api/public/consultorio';
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        const merged: Consultorio = {
          ...INITIAL_CONSULTORIO,
          ...data,
          id: 'dados_gerais',
        };
        setStoredData(STORAGE_KEYS.CONSULTORIO, merged);
        return merged;
      }
    } catch {
      // Fallback para Firestore ou local storage se fetch falhar
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, this.docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Consultorio;
          return { ...INITIAL_CONSULTORIO, ...data };
        }
      } catch (e) {
        console.warn('Erro ao consultar dados do consultório no Firestore:', e);
      }
    }
    return getStoredData<Consultorio>(STORAGE_KEYS.CONSULTORIO, INITIAL_CONSULTORIO);
  }

  /**
   * Retorna estritamente os campos públicos de divulgação do consultório
   * para serem consumidos pela Landing Page, garantindo que dados internos ou privados não vazem.
   */
  public async getDadosPublicos(): Promise<ConsultorioPublicData> {
    try {
      const res = await fetch('/api/public/consultorio');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const dados = await this.getDados();
    const { updatedAt, ...dadosPublicos } = dados;
    return dadosPublicos;
  }

  public async atualizarDados(dados: Partial<Omit<Consultorio, 'id'>>): Promise<Consultorio> {
    const atual = await this.getDados();
    const token = authService.getSessionToken();

    // 1. Tentar salvar no servidor backend via /api/admin/empresa (valida regras e permissão empresa.editar)
    let respostaServidor: Consultorio | null = null;
    if (token) {
      const res = await fetch('/api/admin/empresa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dados),
      });

      if (!res.ok) {
        const erroJson = await res.json().catch(() => ({}));
        throw new Error(erroJson.error || `Erro ao salvar dados da empresa no servidor (${res.status})`);
      }

      const resBody = await res.json();
      if (resBody.consultorio) {
        respostaServidor = resBody.consultorio;
      }
    }

    const atualizado: Consultorio = {
      ...atual,
      ...(respostaServidor || dados),
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
