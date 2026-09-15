import type { IDBPDatabase } from 'idb';

export function runMigrationV1(db: IDBPDatabase<any>) {
  const stores = [
    'incomeSources',
    'incomeEntries',
    'buckets',
    'cycles',
    'allocations',
    'transactions',
    'recurringExpenses',
    'projects',
    'tasks',
    'taskOccurrences',
    'timerSessions',
    'shoppingItems',
    'scheduledNotifications',
    'settings',
    'outbox',
  ];

  for (const storeName of stores) {
    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, { keyPath: 'id' });
      if (storeName === 'outbox') {
        store.createIndex('syncedAt', 'syncedAt');
      } else {
        store.createIndex('deletedAt', 'deletedAt');
        if (
          storeName === 'transactions' ||
          storeName === 'allocations' ||
          storeName === 'shoppingItems' ||
          storeName === 'incomeEntries'
        ) {
          store.createIndex('cycleId', 'cycleId');
        }
        if (
          storeName === 'taskOccurrences' ||
          storeName === 'timerSessions' ||
          storeName === 'transactions'
        ) {
          store.createIndex('taskId', 'taskId');
        }
        if (
          storeName === 'transactions' ||
          storeName === 'incomeEntries' ||
          storeName === 'taskOccurrences'
        ) {
          store.createIndex('date', 'date');
        }
      }
    }
  }
}
