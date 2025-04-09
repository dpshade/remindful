import { openDB } from 'idb';

const DB_NAME = 'ReviewAppDB';
const ITEMS_STORE_NAME = 'reviewItems';
const SETTINGS_STORE_NAME = 'appSettings';
const DB_VERSION = 1;
const SETTINGS_KEY = 'defaultSettings'; // Use a fixed key for settings object

// Renamed function: Only opens the DB or upgrades it.
async function openDatabase() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
      if (!db.objectStoreNames.contains(ITEMS_STORE_NAME)) {
        const itemsStore = db.createObjectStore(ITEMS_STORE_NAME, { keyPath: 'id' });
        itemsStore.createIndex('nextReviewDate', 'nextReviewDate');
        itemsStore.createIndex('tags', 'tags', { multiEntry: true });
        itemsStore.createIndex('type', 'type');
        console.log(`Created object store: ${ITEMS_STORE_NAME}`);
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
        console.log(`Created object store: ${SETTINGS_STORE_NAME}`);
      }
    },
    blocked() {
      // Handle situation where the DB is blocked (e.g., open in another tab)
      console.error("Database is blocked. Close other tabs using the app.");
      alert("Database connection is blocked. Please close other tabs running this app and refresh.");
    },
    blocking() {
      // Handle situation where this tab is blocking others
      console.warn("Database is blocking other connections. Closing the DB.");
      // db.close(); // Consider closing if necessary
    },
    terminated() {
      // Handle situation where the browser terminated the connection
      console.error("Database connection was terminated unexpectedly.");
      alert("Database connection was terminated. Please refresh the page.");
    }
  });
  console.log("Database connection established.");
  return db;
}

// Create a single promise for the DB connection when the module loads.
const dbPromise = openDatabase();

/**
 * Initializes default settings if they don't exist.
 * Should be called once during app startup.
 */
export async function initializeSettingsIfNeeded() {
  try {
    const db = await dbPromise; // Get the already opened DB connection
    const tx = db.transaction(SETTINGS_STORE_NAME, 'readwrite'); // Use readwrite to potentially add
    const settings = await tx.store.get(SETTINGS_KEY);

    if (!settings) {
      console.log("Initializing default settings...");
      const defaultSettings = {
        id: SETTINGS_KEY,
        maxReviewsPerSession: 10,
        initialReviewDays: 1,
      };
      await tx.store.put(defaultSettings);
      await tx.done;
      console.log("Default settings initialized.");
    } else {
      console.log("Settings already initialized.");
    }
  } catch (error) {
     console.error("Failed to initialize settings:", error);
     // Handle error appropriately, maybe inform the user
  }
}

// --- Review Item Operations (Use dbPromise) ---

export async function saveReviewItem(item) {
  const db = await dbPromise; // Use the global promise
  const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
  await tx.store.put(item);
  await tx.done;
  // console.log(`Saved item: ${item.id}`); // Reduce console noise
}

export async function getReviewItem(id) {
  const db = await dbPromise; // Use the global promise
  return db.get(ITEMS_STORE_NAME, id);
}

export async function getAllReviewItems() {
  const db = await dbPromise; // Use the global promise
  return db.getAll(ITEMS_STORE_NAME);
}

export async function getDueReviewItems() {
  const db = await dbPromise; // Use the global promise
  const now = Date.now();
  return db.getAllFromIndex(ITEMS_STORE_NAME, 'nextReviewDate', IDBKeyRange.upperBound(now));
}

export async function deleteReviewItem(id) {
  const db = await dbPromise; // Use the global promise
  const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
  await tx.store.delete(id);
  await tx.done;
  console.log(`Deleted item: ${id}`);
}

// --- Settings Operations (Use dbPromise) ---

export async function saveSettings(settings) {
  const db = await dbPromise; // Use the global promise
  const tx = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
  const settingsToSave = { ...settings, id: SETTINGS_KEY };
  await tx.store.put(settingsToSave);
  await tx.done;
  console.log("Saved settings.");
}

export async function getSettings() {
  const db = await dbPromise; // Use the global promise
  return db.get(SETTINGS_STORE_NAME, SETTINGS_KEY);
} 