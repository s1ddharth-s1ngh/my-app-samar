import { openDB, type IDBPDatabase } from 'idb';
import type { DataAdapter, ExportData } from '../adapter';
import type { Schema } from './schema';
import { runMigrationV1 } from './migrations/v1';
import { runMigrationV2 } from './migrations/v2';
import { IndexedDBRepository } from './repository';
import type { OutboxEntry } from '../types';

export class IndexedDBAdapter implements DataAdapter {
  private db!: IDBPDatabase<Schema>;

  public incomeSources!: IndexedDBRepository<any>;
  public incomeEntries!: IndexedDBRepository<any>;
  public buckets!: IndexedDBRepository<any>;
  public cycles!: IndexedDBRepository<any>;
  public allocations!: IndexedDBRepository<any>;
  public transactions!: IndexedDBRepository<any>;
  public recurringExpenses!: IndexedDBRepository<any>;
  public projects!: IndexedDBRepository<any>;
  public tasks!: IndexedDBRepository<any>;
  public taskOccurrences!: IndexedDBRepository<any>;
  public timerSessions!: IndexedDBRepository<any>;
  public shoppingItems!: IndexedDBRepository<any>;
  public scheduledNotifications!: IndexedDBRepository<any>;
  public scheduleBlocks!: IndexedDBRepository<any>;
  public settings!: IndexedDBRepository<any>;

  async init(dbName = 'ciclo_db') {
    this.db = await openDB<Schema>(dbName, 2, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        if (oldVersion < 1) {
          runMigrationV1(db);
        }
        if (oldVersion < 2) {
          runMigrationV2(db);
        }
      },
    });

    this.incomeSources = new IndexedDBRepository(this.db, 'incomeSources');
    this.incomeEntries = new IndexedDBRepository(this.db, 'incomeEntries');
    this.buckets = new IndexedDBRepository(this.db, 'buckets');
    this.cycles = new IndexedDBRepository(this.db, 'cycles');
    this.allocations = new IndexedDBRepository(this.db, 'allocations');
    this.transactions = new IndexedDBRepository(this.db, 'transactions');
    this.recurringExpenses = new IndexedDBRepository(this.db, 'recurringExpenses');
    this.projects = new IndexedDBRepository(this.db, 'projects');
    this.tasks = new IndexedDBRepository(this.db, 'tasks');
    this.taskOccurrences = new IndexedDBRepository(this.db, 'taskOccurrences');
    this.timerSessions = new IndexedDBRepository(this.db, 'timerSessions');
    this.shoppingItems = new IndexedDBRepository(this.db, 'shoppingItems');
    this.scheduledNotifications = new IndexedDBRepository(this.db, 'scheduledNotifications');
    this.scheduleBlocks = new IndexedDBRepository(this.db, 'scheduleBlocks');
    this.settings = new IndexedDBRepository(this.db, 'settings');
  }

  async exportAll(): Promise<ExportData> {
    const data: any = {};
    for (const storeName of this.db.objectStoreNames) {
      data[storeName] = await this.db.getAll(storeName);
    }
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      collections: data,
    };
  }

  async pendingChanges(): Promise<OutboxEntry[]> {
    return (await this.db.getAll('outbox')).filter((entry) => entry.syncedAt === null);
  }

  async clearPendingChanges(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const tx = this.db.transaction('outbox', 'readwrite');
    for (const id of ids) await tx.store.delete(id);
    await tx.done;
  }

  async replaceSettings(records: Schema['settings']['value'][]): Promise<void> {
    const tx = this.db.transaction('settings', 'readwrite');
    await tx.store.clear();
    for (const record of records) await tx.store.put(record);
    await tx.done;
  }

  async importAll(data: ExportData, mode: 'merge' | 'replace'): Promise<void> {
    const storeNames = Array.from(this.db.objectStoreNames);
    const tx = this.db.transaction(storeNames, 'readwrite');
    for (const storeName of storeNames) {
      const store = tx.objectStore(storeName);
      if (mode === 'replace') {
        store.clear();
      }
      const items = (data.collections as any)[storeName] || [];
      for (const item of items) {
        store.put(item);
      }
    }
    await tx.done;
  }

  async transaction<R>(fn: (adapter: DataAdapter) => Promise<R>): Promise<R> {
    // In un ambiente reale con IndexedDB, transazioni complesse asincrone tra più store
    // possono essere delicate a causa della chiusura automatica se non c'è I/O attivo.
    // Poiché qui la logica di business girerà in memoria (Zustand) e le mutazioni
    // vengono scritte una ad una, implementiamo un proxy o semplicemente invochiamo fn.
    // L'implementazione completa richiederebbe di passare i repository legati alla transazione `tx`.
    // Per ora lo implementiamo senza `tx` esplicito per non complicare eccessivamente l'interfaccia.
    return fn(this);
  }
}
