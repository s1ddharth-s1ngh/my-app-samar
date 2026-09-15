import type {
  ID,
  Base,
  IncomeSource,
  IncomeEntry,
  Bucket,
  Cycle,
  Allocation,
  Transaction,
  RecurringExpense,
  Project,
  Task,
  TaskOccurrence,
  TimerSession,
  ShoppingItem,
  ScheduledNotification,
  Settings,
} from './types';

/**
 * Filtro base per le query al repository.
 */
export interface BaseFilter {
  /** Se true, include anche i record marcati come eliminati. Di default false. */
  includeDeleted?: boolean;
}

/**
 * Interfaccia generica per un repository di una singola entità.
 */
export interface Repository<T extends Base> {
  /**
   * Recupera un record tramite il suo ID.
   * @param id L'identificatore univoco del record.
   * @returns Il record se trovato e non cancellato (a meno che non si specifichino opzioni per ignorare il soft delete), altrimenti null.
   */
  get(id: ID): Promise<T | null>;

  /**
   * Recupera una lista di record, opzionalmente filtrata.
   * @param filter Filtro opzionale da applicare alla query.
   * @returns Un array di record che soddisfano il filtro.
   */
  list(filter?: BaseFilter & Record<string, unknown>): Promise<T[]>;

  /**
   * Crea un nuovo record.
   * @param data I dati del record da creare (ID e timestamp inclusi o da generare a monte).
   * @returns Il record appena creato.
   */
  create(data: T): Promise<T>;

  /**
   * Aggiorna un record esistente.
   * @param id L'ID del record da aggiornare.
   * @param data I campi da aggiornare. L'oggetto può essere parziale ma non contenere campi non validi.
   * @returns Il record aggiornato.
   */
  update(id: ID, data: Partial<Omit<T, 'id'>>): Promise<T>;

  /**
   * Esegue un soft delete (imposta deletedAt) su un record.
   * @param id L'ID del record da eliminare logicamente.
   * @returns Il record aggiornato con deletedAt valorizzato, o null se non trovato.
   */
  remove(id: ID): Promise<T | null>;

  /**
   * Inserisce o aggiorna una lista di record in un'unica operazione (utile per sync/import).
   * @param data Array di record da inserire o aggiornare.
   */
  bulkUpsert(data: T[]): Promise<void>;
}

/**
 * Dati completi di backup/esportazione.
 */
export interface ExportData {
  version: number;
  timestamp: string;
  collections: {
    incomeSources: IncomeSource[];
    incomeEntries: IncomeEntry[];
    buckets: Bucket[];
    cycles: Cycle[];
    allocations: Allocation[];
    transactions: Transaction[];
    recurringExpenses: RecurringExpense[];
    projects: Project[];
    tasks: Task[];
    taskOccurrences: TaskOccurrence[];
    timerSessions: TimerSession[];
    shoppingItems: ShoppingItem[];
    scheduledNotifications: ScheduledNotification[];
    settings: Settings[];
  };
}

/**
 * L'interfaccia principale che espone l'accesso ai dati dell'applicazione.
 */
export interface DataAdapter {
  incomeSources: Repository<IncomeSource>;
  incomeEntries: Repository<IncomeEntry>;
  buckets: Repository<Bucket>;
  cycles: Repository<Cycle>;
  allocations: Repository<Allocation>;
  transactions: Repository<Transaction>;
  recurringExpenses: Repository<RecurringExpense>;
  projects: Repository<Project>;
  tasks: Repository<Task>;
  taskOccurrences: Repository<TaskOccurrence>;
  timerSessions: Repository<TimerSession>;
  shoppingItems: Repository<ShoppingItem>;
  scheduledNotifications: Repository<ScheduledNotification>;
  settings: Repository<Settings>;

  /**
   * Esporta tutti i dati correnti del DB in un formato serializzabile.
   * @returns Oggetto con i dati di tutte le collezioni.
   */
  exportAll(): Promise<ExportData>;

  /**
   * Importa i dati nel DB, unendoli o sovrascrivendoli in base alla modalità.
   * @param data I dati da importare.
   * @param mode Modalità di importazione: 'merge' (unisce) o 'replace' (svuota e sostituisce).
   */
  importAll(data: ExportData, mode: 'merge' | 'replace'): Promise<void>;

  /**
   * Esegue una funzione all'interno di una transazione, garantendo atomicità.
   * @param fn Funzione che esegue le mutazioni sui repository all'interno della transazione.
   */
  transaction<R>(fn: (adapter: DataAdapter) => Promise<R>): Promise<R>;
}
