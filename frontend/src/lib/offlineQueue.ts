// File d'attente IndexedDB pour les transactions saisies hors-ligne (RG-23)
// Utilise l'API native IndexedDB sans dépendance externe.

const DB_NAME = "fintrack-offline";
const STORE = "pending-transactions";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "localId", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueTransaction(data: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    // RG-23 : timestamp local au moment de la saisie
    tx.objectStore(STORE).add({ ...data as object, queuedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingTransactions(): Promise<unknown[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingTransaction(localId: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Synchronise les transactions en attente quand la connexion revient */
export async function syncPendingTransactions(
  syncFn: (data: unknown) => Promise<unknown>
): Promise<number> {
  const pending = await getPendingTransactions() as Array<{ localId: number } & Record<string, unknown>>;
  let synced = 0;
  for (const item of pending) {
    try {
      const { localId, queuedAt, ...data } = item;
      await syncFn(data);
      await clearPendingTransaction(localId);
      synced++;
    } catch {
      break; // arrêt sur première erreur (ordre chronologique RG-23)
    }
  }
  return synced;
}
