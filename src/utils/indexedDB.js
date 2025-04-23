const DB_NAME = 'thunder-dragon-club';
const DB_VERSION = 2;

// Initialize the database
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      // If upgrading from a previous version, delete old object stores
      if (oldVersion < 2) {
        const storeNames = [...db.objectStoreNames];
        storeNames.forEach(storeName => {
          db.deleteObjectStore(storeName);
        });
      }
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pending-transactions')) {
        const transactionsStore = db.createObjectStore('pending-transactions', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        transactionsStore.createIndex('memberId', 'memberId', { unique: false });
        transactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        transactionsStore.createIndex('synced', 'synced', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('pending-redemptions')) {
        const redemptionsStore = db.createObjectStore('pending-redemptions', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        redemptionsStore.createIndex('memberId', 'memberId', { unique: false });
        redemptionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        redemptionsStore.createIndex('synced', 'synced', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('members')) {
        const membersStore = db.createObjectStore('members', { keyPath: 'id' });
        membersStore.createIndex('email', 'email', { unique: true });
      }
      
      if (!db.objectStoreNames.contains('user-data')) {
        db.createObjectStore('user-data', { keyPath: 'id' });
      }
    };
  });
}

// Add a transaction to IndexedDB
export async function addTransaction(transaction) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readwrite');
    const store = tx.objectStore('pending-transactions');
    
    const transactionWithMeta = {
      ...transaction,
      timestamp: new Date().getTime(),
      synced: false
    };
    
    const request = store.add(transactionWithMeta);
    
    request.onsuccess = () => {
      resolve(request.result);
      
      // Register for background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-transactions');
        });
      }
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Get all unsynced transactions
export async function getUnsyncedTransactions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readonly');
    const store = tx.objectStore('pending-transactions');
    const index = store.index('synced');
    
    const request = index.getAll(0); // 0 = false in IndexedDB
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Mark a transaction as synced
export async function markTransactionSynced(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readwrite');
    const store = tx.objectStore('pending-transactions');
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      const transaction = request.result;
      if (!transaction) {
        reject(new Error('Transaction not found'));
        return;
      }
      
      transaction.synced = true;
      const updateRequest = store.put(transaction);
      
      updateRequest.onsuccess = () => {
        resolve();
      };
      
      updateRequest.onerror = () => {
        reject(updateRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Delete a synced transaction
export async function deleteTransaction(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-transactions', 'readwrite');
    const store = tx.objectStore('pending-transactions');
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Similar functions for redemptions
export async function addRedemption(redemption) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-redemptions', 'readwrite');
    const store = tx.objectStore('pending-redemptions');
    
    const redemptionWithMeta = {
      ...redemption,
      timestamp: new Date().getTime(),
      synced: false
    };
    
    const request = store.add(redemptionWithMeta);
    
    request.onsuccess = () => {
      resolve(request.result);
      
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-redemptions');
        });
      }
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getUnsyncedRedemptions() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-redemptions', 'readonly');
    const store = tx.objectStore('pending-redemptions');
    const index = store.index('synced');
    
    const request = index.getAll(0); // 0 = false in IndexedDB
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function markRedemptionSynced(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-redemptions', 'readwrite');
    const store = tx.objectStore('pending-redemptions');
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      const redemption = request.result;
      if (!redemption) {
        reject(new Error('Redemption not found'));
        return;
      }
      
      redemption.synced = true;
      const updateRequest = store.put(redemption);
      
      updateRequest.onsuccess = () => {
        resolve();
      };
      
      updateRequest.onerror = () => {
        reject(updateRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteRedemption(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-redemptions', 'readwrite');
    const store = tx.objectStore('pending-redemptions');
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Store user data
export async function storeUserData(userData) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user-data', 'readwrite');
    const store = tx.objectStore('user-data');
    
    const request = store.put({
      id: 'current-user',
      ...userData,
      timestamp: new Date().getTime()
    });
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject('Error storing user data');
    };
  });
}

// Get user data
export async function getUserData() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user-data', 'readonly');
    const store = tx.objectStore('user-data');
    
    const request = store.get('current-user');
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => {
      reject('Error getting user data');
    };
  });
} 