import type { IDBPDatabase } from 'idb';
import type { Base, ID } from '../types';
import type { Repository, BaseFilter } from '../adapter';
import type { Schema } from './schema';

export class IndexedDBRepository<T extends Base> implements Repository<T> {
  private readonly db: IDBPDatabase<Schema>;
  private readonly storeName: Extract<keyof Schema, string>;

  constructor(db: IDBPDatabase<Schema>, storeName: Extract<keyof Schema, string>) {
    this.db = db;
    this.storeName = storeName;
  }

  async get(id: ID): Promise<T | null> {
    const record = await this.db.get(this.storeName as any, id);
    if (!record || record.deletedAt) return null;
    return record as unknown as T;
  }

  async list(filter?: BaseFilter & Record<string, unknown>): Promise<T[]> {
    let records = await this.db.getAll(this.storeName as any);

    if (!filter?.includeDeleted) {
      records = records.filter((r) => !r.deletedAt);
    }

    if (filter) {
      const customFilters = { ...filter };
      delete customFilters.includeDeleted;
      const filterKeys = Object.keys(customFilters);
      if (filterKeys.length > 0) {
        records = records.filter((record) => {
          return filterKeys.every((key) => (record as any)[key] === customFilters[key]);
        });
      }
    }

    return records as unknown as T[];
  }

  async create(data: T): Promise<T> {
    const tx = this.db.transaction([this.storeName as any, 'outbox'], 'readwrite');
    await tx.objectStore(this.storeName as any).add(data as any);
    await tx.objectStore('outbox').add({
      id: crypto.randomUUID(),
      entity: this.storeName,
      entityId: data.id,
      op: 'create',
      payload: data,
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });
    await tx.done;
    return data;
  }

  async update(id: ID, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const tx = this.db.transaction([this.storeName as any, 'outbox'], 'readwrite');
    const store = tx.objectStore(this.storeName as any);
    const existing = await store.get(id);

    if (!existing) {
      throw new Error(`Record ${id} not found in ${this.storeName}`);
    }

    // Allow update if we are explicitly restoring
    const isRestoring = data.deletedAt === null;
    if (existing.deletedAt && !isRestoring) {
      throw new Error(`Record ${id} not found in ${this.storeName} (deleted)`);
    }

    const updated = { ...existing, ...data } as any;
    await store.put(updated);

    await tx.objectStore('outbox').add({
      id: crypto.randomUUID(),
      entity: this.storeName,
      entityId: id,
      op: 'update',
      payload: data,
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });

    await tx.done;
    return updated as T;
  }

  async remove(id: ID): Promise<T | null> {
    const tx = this.db.transaction([this.storeName as any, 'outbox'], 'readwrite');
    const store = tx.objectStore(this.storeName as any);
    const existing = await store.get(id);

    if (!existing || existing.deletedAt) {
      return null;
    }

    const updated = { ...existing, deletedAt: new Date().toISOString() } as any;
    await store.put(updated);

    await tx.objectStore('outbox').add({
      id: crypto.randomUUID(),
      entity: this.storeName,
      entityId: id,
      op: 'remove',
      payload: null,
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });

    await tx.done;
    return updated as T;
  }

  async bulkUpsert(data: T[]): Promise<void> {
    const tx = this.db.transaction(this.storeName as any, 'readwrite');
    const store = tx.objectStore(this.storeName as any);
    for (const record of data) {
      await store.put(record as any);
    }
    await tx.done;
  }
}
