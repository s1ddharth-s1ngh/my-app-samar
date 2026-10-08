import type { IDBPDatabase } from 'idb';

/** The agenda: one store holding both the weekly templates and the day exceptions. */
export function runMigrationV2(db: IDBPDatabase<any>) {
  if (db.objectStoreNames.contains('scheduleBlocks')) return;

  const store = db.createObjectStore('scheduleBlocks', { keyPath: 'id' });
  store.createIndex('deletedAt', 'deletedAt');
  store.createIndex('date', 'date');
}
