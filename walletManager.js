// walletManager.js — Hybrid Wallet Manager (Firebase primary with localStorage graceful fallback)
const WALLETS_KEY = 'matrix_user_wallets';

// Optional Firebase references (adjust imports if your firebase.js exports them differently)
let db = null;
let auth = null;
let firebaseInitialized = false;

// Safe localStorage helpers
function getLocalWallets() {
  try {
    const raw = localStorage.getItem(WALLETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalWallets(wallets) {
  try {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
  } catch (e) {
    console.warn('[walletManager.js] Could not persist to localStorage:', e);
  }
}

export const WalletManager = {
  // Initialize connection, attempting to hook into Firebase gracefully
  init: async (firebaseApp = null, firestoreDb = null, firebaseAuth = null) => {
    try {
      if (firestoreDb && firebaseAuth) {
        db = firestoreDb;
        auth = firebaseAuth;
        firebaseInitialized = true;
        console.log('[walletManager.js] Initialized with provided Firebase instance.');
      } else {
        // Fallback: Try loading globally if available in window or modular setup
        if (window.FIREBASE_DB && window.FIREBASE_AUTH) {
          db = window.FIREBASE_DB;
          auth = window.FIREBASE_AUTH;
          firebaseInitialized = true;
          console.log('[walletManager.js] Initialized via window Firebase globals.');
        } else {
          console.log('[walletManager.js] Firebase not detected. Running on localStorage fallback.');
        }
      }
    } catch (e) {
      console.warn('[walletManager.js] Firebase initialization failed. Falling back to localStorage.', e);
      firebaseInitialized = false;
    }
  },

  // Sync points from a game to the global wallet (Cloud + Local Fallback)
  syncPoints: async (userId, amount, source) => {
    try {
      if (firebaseInitialized && db && auth) {
        // Attempt Firebase sync if online/configured
        // Example Firestore doc path: users/{userId}/wallet/data
        const { doc, getDoc, setDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const walletRef = doc(db, 'users', userId, 'wallet', 'main');
        
        const docSnap = await getDoc(walletRef);
        if (!docSnap.exists()) {
          await setDoc(walletRef, {
            balance: amount,
            lastUpdated: Date.now(),
            lastSource: source
          });
        } else {
          await updateDoc(walletRef, {
            balance: increment(amount),
            lastUpdated: Date.now(),
            lastSource: source
          });
        }
        console.log(`[Firebase] Synced ${amount} points from ${source} for user ${userId}`);
        return;
      }
    } catch (firebaseError) {
      console.warn('[walletManager.js] Firebase syncPoints failed, falling back to localStorage:', firebaseError);
    }

    // Graceful localStorage Fallback
    const wallets = getLocalWallets();
    if (!wallets[userId]) {
      wallets[userId] = { balance: 0, lastUpdated: null, lastSource: null };
    }
    wallets[userId].balance += amount;
    wallets[userId].lastUpdated = Date.now();
    wallets[userId].lastSource = source;
    saveLocalWallets(wallets);
    console.log(`[LocalStorage] Synced ${amount} points from ${source}`);
  },

  // Deduct points for store purchases (Cloud + Local Fallback)
  spendPoints: async (userId, cost) => {
    const amount = Number(cost) || 0;
    
    try {
      if (firebaseInitialized && db && auth) {
        const { doc, getDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const walletRef = doc(db, 'users', userId, 'wallet', 'main');
        const docSnap = await getDoc(walletRef);

        if (docSnap.exists()) {
          const currentBalance = Number(docSnap.data().balance) || 0;
          if (currentBalance >= amount) {
            await updateDoc(walletRef, {
              balance: increment(-amount),
              lastUpdated: Date.now(),
              spent_total: increment(amount)
            });
            console.log(`[Firebase] Successfully spent ${amount} points.`);
            return true;
          }
        }
        return false;
      }
    } catch (firebaseError) {
      console.warn('[walletManager.js] Firebase spendPoints failed, falling back to localStorage:', firebaseError);
    }

    // Graceful localStorage Fallback
    const wallets = getLocalWallets();
    if (!wallets[userId]) {
      wallets[userId] = { balance: 0, lastUpdated: null, lastSource: null, spent_total: 0 };
    }
    const balance = Number(wallets[userId].balance) || 0;
    let success = false;
    
    if (balance >= amount) {
      wallets[userId].balance = balance - amount;
      wallets[userId].lastUpdated = Date.now();
      wallets[userId].spent_total = (Number(wallets[userId].spent_total) || 0) + amount;
      success = true;
      saveLocalWallets(wallets);
      console.log(`[LocalStorage] Successfully spent ${amount} points.`);
    }
    return success;
  }
};
