// ============================================================
// ADVANCED CACHE ENGINE - IndexedDB
// Unlimited storage, super fast, async
// ============================================================

const DB_NAME = 'NexusAICache';
const DB_VERSION = 1;
const STORE_NAME = 'pageData';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let db = null;

// ============================================================
// Open/Initialize Database
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('📦 IndexedDB store created');
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// ============================================================
// Get Cached Data
// ============================================================
export async function getCachedData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const url = window.location.href;
    
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        const now = Date.now();
        if (now - result.timestamp > CACHE_DURATION) {
          // Expired, delete it
          deleteCachedData(url);
          resolve(null);
          return;
        }
        
        console.log(`📦 Cache hit! Age: ${Math.floor((now - result.timestamp) / 60000)} minutes`);
        resolve(result.data);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.warn('IndexedDB read failed:', error);
    return null;
  }
}

// ============================================================
// Set Cached Data
// ============================================================
export async function setCachedData(data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const url = window.location.href;
    
    const entry = {
      id: url,
      url: url,
      data: data,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => {
        console.log('💾 Data cached in IndexedDB');
        resolve();
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.warn('IndexedDB write failed:', error);
  }
}

// ============================================================
// Delete Cached Data
// ============================================================
export async function deleteCachedData(url) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(url);
  } catch (error) {
    console.warn('IndexedDB delete failed:', error);
  }
}

// ============================================================
// Clear All Cache
// ============================================================
export async function clearAllCache() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    console.log('🗑️ All cache cleared');
  } catch (error) {
    console.warn('IndexedDB clear failed:', error);
  }
}

// ============================================================
// Get Cache Statistics
// ============================================================
export async function getCacheInfo() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => {
        resolve({
          totalEntries: request.result,
          database: DB_NAME,
          version: DB_VERSION
        });
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}