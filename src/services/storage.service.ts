import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

class StorageService {
  public async uploadExamAttachment(
    patientId: string,
    file: File
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `patients/${patientId}/exams/${timestamp}_${sanitizedName}`;

    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return {
          url: downloadUrl,
          fileName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.warn('Erro ao enviar arquivo para o Firebase Storage, usando DataURL de contingência:', e);
      }
    }

    // Fallback: Converte para DataURL para pré-visualização instantânea e persistência de demonstração
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          fileName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });
  }

  public async deleteFile(filePath: string): Promise<void> {
    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Erro ao remover arquivo do Storage:', e);
      }
    }
  }
}

export const storageService = new StorageService();
