import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { assertPathSegment } from './path';

type FirebaseConfigLike = Record<string, unknown>;

type FirebaseHostingGlobals = {
  __firebase_config?: string | FirebaseConfigLike;
  __app_id?: string;
  __initial_auth_token?: string;
  __FIREBASE_CONFIG?: FirebaseConfigLike;
};

const getGlobals = (): FirebaseHostingGlobals =>
  globalThis as unknown as FirebaseHostingGlobals;

function parseConfig(value: unknown): FirebaseConfigLike | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as FirebaseConfigLike;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value as FirebaseConfigLike;
  return null;
}

export function getAppId(fallback = 'arcade'): string {
  const appId = getGlobals().__app_id;
  return typeof appId === 'string' && appId.trim() ? appId.trim() : fallback;
}

export function getFirebaseConfig(): FirebaseConfigLike | null {
  const globals = getGlobals();
  return (
    parseConfig(globals.__firebase_config) ??
    parseConfig(globals.__FIREBASE_CONFIG) ??
    null
  );
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp;
  const config = getFirebaseConfig();
  if (!config) return null;
  cachedApp = initializeApp(config as Record<string, string>);
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export function getFirestoreDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedDb = getFirestore(app);
  return cachedDb;
}

export async function ensureAnonymousUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  if (auth.currentUser) return auth.currentUser;

  const token = getGlobals().__initial_auth_token;
  if (typeof token === 'string' && token.trim()) {
    const credential = await signInWithCustomToken(auth, token.trim());
    return credential.user;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}
export { assertPathSegment };
