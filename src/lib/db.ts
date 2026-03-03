import Dexie, { Table } from 'dexie';

export type WriteOperation = 'set' | 'add' | 'update' | 'delete';

export interface PendingWrite {
  id?: number; // Primary key, auto-incremented
  operation: WriteOperation;
  path: string;
  data?: any; // Data for set, add, update
  options?: any; // Options for setDoc
  timestamp: number;
}

export class MySubClassedDexie extends Dexie {
  pending_writes!: Table<PendingWrite>; 

  constructor() {
    super('attendSyncDB');
    this.version(1).stores({
      pending_writes: '++id, timestamp', // Primary key and indexed props
    });
  }
}

export const db = new MySubClassedDexie();

/**
 * Adds a write operation to the pending queue in IndexedDB.
 * @param path - The Firestore document or collection path.
 * @param operation - The type of write operation.
 * @param data - The data payload for the operation.
 * @param options - Firestore options for operations like setDoc.
 */
export async function queueWrite(
    path: string,
    operation: WriteOperation,
    data?: any,
    options?: any
): Promise<void> {
    await db.pending_writes.add({
        path,
        operation,
        data,
        options,
        timestamp: Date.now(),
    });
}