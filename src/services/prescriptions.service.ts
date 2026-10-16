import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Prescription } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_PRESCRIPTIONS,
} from './storage-local';

class PrescriptionsService {
  private collectionName = 'prescriptions';

  public async getAll(): Promise<Prescription[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Prescription[];
      } catch (e) {
        console.warn('Erro ao consultar prescrições no Firestore:', e);
      }
    }
    return getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
  }

  public async getById(id: string): Promise<Prescription | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Prescription;
        }
      } catch (e) {
        console.warn(`Erro ao buscar prescrição ${id}:`, e);
      }
    }
    const all = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    return all.find((p) => p.id === id) || null;
  }

  public async getByPatientId(patientId: string): Promise<Prescription[]> {
    const all = await this.getAll();
    return all.filter((p) => p.patientId === patientId);
  }

  public async create(data: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> {
    const now = new Date().toISOString();
    const newPrescription: Prescription = {
      ...data,
      id: `prx-${Date.now().toString(36)}`,
      createdAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, this.collectionName), {
          ...data,
          createdAt: now,
        });
        newPrescription.id = docRef.id;
        return newPrescription;
      } catch (e) {
        console.warn('Erro ao salvar receita no Firestore:', e);
      }
    }

    const current = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const updated = [newPrescription, ...current];
    setStoredData(STORAGE_KEYS.PRESCRIPTIONS, updated);
    return newPrescription;
  }

  public async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch (e) {
        console.warn(`Erro ao deletar prescrição ${id}:`, e);
      }
    }

    const current = getStoredData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const updated = current.filter((p) => p.id !== id);
    setStoredData(STORAGE_KEYS.PRESCRIPTIONS, updated);
  }
}

export const prescriptionsService = new PrescriptionsService();
