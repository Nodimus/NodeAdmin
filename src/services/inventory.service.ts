import { InventoryItem } from '../types';
import { getStoredData, setStoredData, STORAGE_KEYS, INITIAL_INVENTORY } from './storage-local';

class InventoryService {
  public async getAll(): Promise<InventoryItem[]> {
    return getStoredData<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
  }

  public async create(data: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now().toString(36)}`,
    };
    const current = await this.getAll();
    const updated = [newItem, ...current];
    setStoredData(STORAGE_KEYS.INVENTORY, updated);
    return newItem;
  }

  public async update(id: string, partial: Partial<InventoryItem>): Promise<InventoryItem> {
    const current = await this.getAll();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Item de estoque não encontrado');
    const updatedItem = { ...current[index], ...partial };
    current[index] = updatedItem;
    setStoredData(STORAGE_KEYS.INVENTORY, current);
    return updatedItem;
  }

  public async delete(id: string): Promise<void> {
    const current = await this.getAll();
    const updated = current.filter((i) => i.id !== id);
    setStoredData(STORAGE_KEYS.INVENTORY, updated);
  }
}

export const inventoryService = new InventoryService();
