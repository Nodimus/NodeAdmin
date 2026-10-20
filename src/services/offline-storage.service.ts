/**
 * offline-storage.service.ts
 * Implementação do Prompt 15:
 * - Cache local no dispositivo via IndexedDB para Agenda e Lista de Pacientes
 * - NUNCA armazena receitas, atendimentos nem financeiro offline (Regra estrita)
 * - Fila de mutações offline para sincronização ao reconectar com detecção de conflitos
 * - Limpeza total do cache local no logout (LGPD)
 */

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  entidade: 'agenda' | 'paciente';
  tipoOperacao: 'criar' | 'atualizar_status' | 'editar';
  dados: any;
  status: 'pendente' | 'em_sincronizacao' | 'conflito' | 'sincronizado';
  mensagemErro?: string;
}

const DB_NAME = 'optoclin_offline_db';
const DB_VERSION = 1;

// Nomes das stores permitidas — Note que receitas, atendimentos e financeiro NÃO possuem stores aqui
const STORE_AGENDA = 'agenda_cache';
const STORE_PACIENTES = 'pacientes_cache';
const STORE_FILA_SYNC = 'fila_sincronizacao';

class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB não suportado neste ambiente'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Store da Agenda (permitido)
          if (!db.objectStoreNames.contains(STORE_AGENDA)) {
            db.createObjectStore(STORE_AGENDA, { keyPath: 'id' });
          }

          // 2. Store dos Pacientes (permitido)
          if (!db.objectStoreNames.contains(STORE_PACIENTES)) {
            db.createObjectStore(STORE_PACIENTES, { keyPath: 'id' });
          }

          // 3. Fila de Sincronização (permitido)
          if (!db.objectStoreNames.contains(STORE_FILA_SYNC)) {
            db.createObjectStore(STORE_FILA_SYNC, { keyPath: 'id' });
          }

          // NOTA: NUNCA crie stores para receitas, atendimentos ou financeiro!
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // ==========================================================================
  // 1. CACHE DE AGENDA (PERMITIDO)
  // ==========================================================================
  async salvarAgendaCache(agendamentos: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_AGENDA], 'readwrite');
      const store = tx.objectStore(STORE_AGENDA);
      store.clear(); // Atualiza snapshot
      agendamentos.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async obterAgendaCache(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_AGENDA], 'readonly');
      const store = tx.objectStore(STORE_AGENDA);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ==========================================================================
  // 2. CACHE DE PACIENTES (PERMITIDO)
  // ==========================================================================
  async salvarPacientesCache(pacientes: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PACIENTES], 'readwrite');
      const store = tx.objectStore(STORE_PACIENTES);
      store.clear(); // Atualiza snapshot
      pacientes.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async obterPacientesCache(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PACIENTES], 'readonly');
      const store = tx.objectStore(STORE_PACIENTES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ==========================================================================
  // 3. FILA DE MUTAÇÕES OFFLINE
  // ==========================================================================
  async enfileirarMutacaoOffline(
    entidade: 'agenda' | 'paciente',
    tipoOperacao: 'criar' | 'atualizar_status' | 'editar',
    dados: any
  ): Promise<OfflineQueueItem> {
    const item: OfflineQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      entidade,
      tipoOperacao,
      dados,
      status: 'pendente',
    };

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILA_SYNC], 'readwrite');
      const store = tx.objectStore(STORE_FILA_SYNC);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async obterItensFilaSync(): Promise<OfflineQueueItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_FILA_SYNC], 'readonly');
        const store = tx.objectStore(STORE_FILA_SYNC);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async removerItemFila(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILA_SYNC], 'readwrite');
      const store = tx.objectStore(STORE_FILA_SYNC);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async marcarConflitoItem(id: string, mensagem: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILA_SYNC], 'readwrite');
      const store = tx.objectStore(STORE_FILA_SYNC);
      const reqGet = store.get(id);
      reqGet.onsuccess = () => {
        const item = reqGet.result;
        if (item) {
          item.status = 'conflito';
          item.mensagemErro = mensagem;
          store.put(item);
        }
        resolve();
      };
      reqGet.onerror = () => reject(reqGet.error);
    });
  }

  // ==========================================================================
  // 4. LIMPEZA TOTAL NO LOGOUT (LGPD - OBRIGATÓRIO)
  // ==========================================================================
  async limparTudoNoLogout(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        db.close();
        this.dbPromise = null;
      }
      return new Promise((resolve) => {
        const req = window.indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => {
          console.log('[LGPD] Cache offline e dados locais excluídos com sucesso no logout.');
          resolve();
        };
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    } catch (e) {
      console.warn('Erro ao limpar banco offline:', e);
    }
  }
}

export const offlineStorageService = new OfflineStorageService();
