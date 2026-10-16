import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Exam } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_EXAMS,
} from './storage-local';

class ExamsService {
  private collectionName = 'exams';

  public async getAll(): Promise<Exam[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Exam[];
      } catch (e) {
        console.warn('Erro ao consultar exames no Firestore:', e);
      }
    }
    return getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  }

  public async getById(id: string): Promise<Exam | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Exam;
        }
      } catch (e) {
        console.warn(`Erro ao buscar exame ${id} no Firestore:`, e);
      }
    }
    const all = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    return all.find((e) => e.id === id) || null;
  }

  public async getByPatientId(patientId: string): Promise<Exam[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, this.collectionName),
          where('patientId', '==', patientId),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Exam[];
      } catch (e) {
        console.warn(`Erro ao buscar exames do paciente ${patientId}:`, e);
      }
    }
    const all = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    return all.filter((e) => e.patientId === patientId);
  }

  public async create(data: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const now = new Date().toISOString();
    const newExam: Exam = {
      ...data,
      id: `ex-${Date.now().toString(36)}`,
      createdAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, this.collectionName), {
          ...data,
          createdAt: now,
        });
        newExam.id = docRef.id;
        return newExam;
      } catch (e) {
        console.warn('Erro ao salvar exame no Firestore:', e);
      }
    }

    const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const updated = [newExam, ...current];
    setStoredData(STORAGE_KEYS.EXAMS, updated);
    return newExam;
  }

  public async update(id: string, partial: Partial<Exam>): Promise<Exam> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, partial);
      } catch (e) {
        console.warn(`Erro ao atualizar exame ${id} no Firestore:`, e);
      }
    }

    const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const index = current.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('Exame não encontrado');
    }
    const updated = { ...current[index], ...partial };
    current[index] = updated;
    setStoredData(STORAGE_KEYS.EXAMS, current);
    return updated;
  }

  public async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch (e) {
        console.warn(`Erro ao remover exame ${id}:`, e);
      }
    }

    const current = getStoredData<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const updated = current.filter((e) => e.id !== id);
    setStoredData(STORAGE_KEYS.EXAMS, updated);
  }
}

export const examsService = new ExamsService();
