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
import { Appointment, AppointmentStatus } from '../types';
import {
  getStoredData,
  setStoredData,
  STORAGE_KEYS,
  INITIAL_APPOINTMENTS,
} from './storage-local';

class AppointmentsService {
  private collectionName = 'appointments';

  public async getAll(): Promise<Appointment[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Appointment[];
      } catch (e) {
        console.warn('Erro ao consultar agendamentos no Firestore:', e);
      }
    }
    return getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  public async getByDate(dateStr: string): Promise<Appointment[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, this.collectionName),
          where('date', '==', dateStr),
          orderBy('time', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Appointment[];
      } catch (e) {
        console.warn(`Erro ao consultar agendamentos da data ${dateStr}:`, e);
      }
    }
    const all = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    return all.filter((a) => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  }

  public async getByPatientId(patientId: string): Promise<Appointment[]> {
    const all = await this.getAll();
    return all.filter((a) => a.patientId === patientId);
  }

  public async create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now().toString(36)}`,
      createdAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, this.collectionName), {
          ...data,
          createdAt: now,
        });
        newAppointment.id = docRef.id;
        return newAppointment;
      } catch (e) {
        console.warn('Erro ao salvar agendamento no Firestore:', e);
      }
    }

    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = [newAppointment, ...current];
    setStoredData(STORAGE_KEYS.APPOINTMENTS, updated);
    return newAppointment;
  }

  public async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, { status });
      } catch (e) {
        console.warn(`Erro ao atualizar status de agendamento ${id}:`, e);
      }
    }

    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Agendamento não encontrado');
    }
    current[index] = { ...current[index], status };
    setStoredData(STORAGE_KEYS.APPOINTMENTS, current);
    return current[index];
  }

  public async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch (e) {
        console.warn(`Erro ao remover agendamento ${id}:`, e);
      }
    }

    const current = getStoredData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = current.filter((a) => a.id !== id);
    setStoredData(STORAGE_KEYS.APPOINTMENTS, updated);
  }
}

export const appointmentsService = new AppointmentsService();
