/**
 * firebase.js — Firebase init + auth/DB helpers.
 *
 * In production this module bridges Firebase Auth + Realtime Database.
 * For local / demo use it falls back to localStorage so the UI works
 * without a live Firebase project.
 *
 * To enable Firebase in production:
 *   1. Set window.__FIREBASE_CONFIG to your Firebase config object.
 *   2. Uncomment the real import statements and implementations below.
 */

/* ── Firebase real implementation (uncomment in production) ───────────────
import { initializeApp }                                  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get, set, update }            from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = window.__FIREBASE_CONFIG || {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

const app         = initializeApp(firebaseConfig);
export const db   = getDatabase(app);
export const auth = getAuth(app);
─────────────────────────────────────────────────────────────────────────── */

/* ── Demo / localStorage database shim ────────────────────────────────────
   Provides a Firebase-compatible db.ref().get()/.set()/.update() API backed
   by localStorage so pages work without a live Firebase backend.
   ─────────────────────────────────────────────────────────────────────── */

const DEMO_USERS_KEY = 'matrix_demo_users';

function getDemoUsers() {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoUsers(users) {
  try {
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('[firebase.js] Could not persist demo users:', e);
  }
}

function seedDemoUsers() {
  const existing = getDemoUsers();
  if (Object.keys(existing).length > 0) return;
  const seed = {
    uid_owner_001: {
      email: 'owner@matrix.dev',
      role: 'owner',
      badges: { badge_01: true, badge_02: true },
      donations: 120,
      tools: { networkDefense: true, diagnostics: true, nations: true, visionForge: true },
    },
    uid_super_002: {
      email: 'superadmin@matrix.dev',
      role: 'superAdmin',
      badges: { badge_01: true },
      donations: 50,
      tools: { networkDefense: true, diagnostics: true, nations: false, visionForge: false },
    },
    uid_admin_003: {
      email: 'admin@matrix.dev',
      role: 'admin',
      badges: {},
      donations: 15,
      tools: { networkDefense: false, diagnostics: true, nations: false, visionForge: false },
    },
    uid_user_004: {
      email: 'user@matrix.dev',
      role: 'user',
      badges: {},
      donations: 0,
      tools: { networkDefense: false, diagnostics: false, nations: false, visionForge: false },
    },
  };
  saveDemoUsers(seed);
}

/**
 * True when running on a local/dev/preview host.
 * Demo seeding is disabled on production hostnames so demo credentials
 * are never available on the live site.
 */
export const IS_DEMO_HOST = (() => {
  try {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' || h.endsWith('.github.io');
  } catch {
    return false;
  }
})();

if (IS_DEMO_HOST) seedDemoUsers();

/* ── Firebase-compatible database shim ─────────────────────────────────── */

/**
 * db.ref(path) — returns an object with async get(), set(value), and update(updates).
 * Mirrors the Firebase Realtime Database ref API.
 */
export const db = {
  ref(path) {
    return {
      async get() {
        const users = getDemoUsers();
        const parts = (path || '').split('/').filter(Boolean);

        if (parts[0] !== 'users') {
          return { forEach() {}, val: () => null, exists: () => false };
        }

        // db.ref('users').get() — return all users
        if (parts.length === 1) {
          return {
            forEach(cb) {
              Object.entries(users).forEach(([key, val]) =>
                cb({ key, val: () => val })
              );
            },
            val: () => users,
            exists: () => Object.keys(users).length > 0,
          };
        }

        // db.ref('users/uid').get() — return single user
        const uid = parts[1];
        if (parts.length === 2) {
          const data = users[uid] ?? null;
          return {
            forEach(cb) { if (data) cb({ key: uid, val: () => data }); },
            val: () => data,
            exists: () => data !== null,
          };
        }

        // db.ref('users/uid/field/…').get() — walk nested properties
        let node = users[uid];
        for (let i = 2; i < parts.length && node !== undefined; i++) {
          node = node[parts[i]];
        }
        const value = node ?? null;
        return {
          forEach() {},
          val: () => value,
          exists: () => value !== null,
        };
      },

      async set(value) {
        const parts = (path || '').split('/').filter(Boolean);
        if (parts[0] === 'users' && parts[1]) {
          const users = getDemoUsers();
          // db.ref('users/uid').set(value) — replace the entire user object
          if (parts.length === 2) {
            users[parts[1]] = value;
          } else {
            users[parts[1]] = users[parts[1]] || {};
            let obj = users[parts[1]];
            for (let i = 2; i < parts.length - 1; i++) {
              obj[parts[i]] = obj[parts[i]] || {};
              obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
          }
          saveDemoUsers(users);
        }
      },

      async update(updates) {
        const baseParts = (path || '').split('/').filter(Boolean);
        const users = getDemoUsers();

        const applyUpdate = (relPath, value) => {
          const relParts = relPath.split('/').filter(Boolean);
          let segments;

          if (relParts[0] === 'users') {
            segments = relParts;
          } else if (baseParts[0] === 'users') {
            segments = [...baseParts, ...relParts];
          } else {
            segments = ['users', ...relParts];
          }

          if (segments[0] !== 'users' || !segments[1]) return;

          let node = users;
          for (let i = 1; i < segments.length; i++) {
            const key = segments[i];
            if (i === segments.length - 1) {
              node[key] = value;
            } else {
              node[key] = node[key] || {};
              node = node[key];
            }
          }
        };

        Object.entries(updates).forEach(([relPath, value]) => applyUpdate(relPath, value));
        saveDemoUsers(users);
      },
    };
  },
};

/* ── Auth helpers ─────────────────────────────────────────────────────────── */

const SESSION_KEY = 'matrixUser';

/**
 * Returns the currently authenticated user from localStorage.
 * @returns {{ uid: string, email: string, role: string }|null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a user session to localStorage.
 * @param {{ uid: string, email: string, role: string }} user
 */
export function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Clear the current session.
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Authenticate with email + password (demo/localStorage path only).
 * Firebase Auth has been removed — use demo credentials on local/preview hosts.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ uid: string, email: string, role: string }>}
 */
export async function loginWithEmail(email, password) {
  const users = getDemoUsers();
  const entry = Object.entries(users).find(
    ([, u]) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!entry) throw new Error('No account found for that email.');
  if (!password || password.length < 4) throw new Error('Invalid password.');

  const [uid, user] = entry;
  const session = { uid, email: user.email, role: user.role };
  setCurrentUser(session);
  return session;
}

/**
 * Sign out the current user and redirect to the login page.
 * @param {string} [loginPath='/admin/login.html']
 */
export function logout(loginPath = '/admin/login.html') {
  clearSession();
  window.location.href = loginPath;
}
