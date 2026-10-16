import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Patient } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_PATIENTS,
} from './storage-local';

class PatientsService {
  private collectionName = 'patients';

  public async getAll(): Promise<Patient[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const patients = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Patient[];
        return patients;
      } catch (e) {
        console.warn('Erro ao consultar pacientes no Firestore, usando dados locais:', e);
      }
    }
    return getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  }

  public async getById(id: string): Promise<Patient | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Patient;
        }
      } catch (e) {
        console.warn(`Erro ao buscar paciente ${id} no Firestore:`, e);
      }
    }
    const list = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    return list.find((p) => p.id === id) || null;
  }

  public async create(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, this.collectionName), {
          ...patientData,
          createdAt: now,
          updatedAt: now,
        });
        newPatient.id = docRef.id;
        return newPatient;
      } catch (e) {
        console.warn('Erro ao salvar paciente no Firestore, gravando localmente:', e);
      }
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const updated = [newPatient, ...current];
    setStoredData(STORAGE_KEYS.PATIENTS, updated);
    return newPatient;
  }

  public async update(id: string, partial: Partial<Patient>): Promise<Patient> {
    const now = new Date().toISOString();
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
          ...partial,
          updatedAt: now,
        });
      } catch (e) {
        console.warn(`Erro ao atualizar paciente ${id} no Firestore:`, e);
      }
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Paciente não encontrado');
    }
    const updatedPatient = { ...current[index], ...partial, updatedAt: now };
    current[index] = updatedPatient;
    setStoredData(STORAGE_KEYS.PATIENTS, current);
    return updatedPatient;
  }

  public async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch (e) {
        console.warn(`Erro ao remover paciente ${id} no Firestore:`, e);
      }
    }

    const current = getStoredData<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const updated = current.filter((p) => p.id !== id);
    setStoredData(STORAGE_KEYS.PATIENTS, updated);
  }

  public async search(term: string): Promise<Patient[]> {
    const all = await this.getAll();
    const normalized = term.toLowerCase().trim();
    if (!normalized) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        (p.cpf && p.cpf.includes(normalized)) ||
        p.phone.includes(normalized) ||
        (p.email && p.email.toLowerCase().includes(normalized))
    );
  }
}

export const patientsService = new PatientsService();
