// Optional Firebase sync. Everything here fails soft: with no configuration (or
// when offline) the game keeps working in LOCAL-ONLY mode.
import type { Firestore } from 'firebase/firestore';

export interface ScoreEntry { userId: string; score: number; level: number; }
export interface BlogPost { id: string; title: string; content: string; userId: string; }

interface RuntimeGlobals { __app_id?: string; __firebase_config?: string; __initial_auth_token?: string; }

const globals = (): RuntimeGlobals => (typeof window === 'undefined' ? {} : (window as unknown as RuntimeGlobals));

let db: Firestore | null = null;
let uid = 'local-user';
let appId = 'matrix-conscience-v4';
let initPromise: Promise<boolean> | null = null;

export const getUserId = (): string => uid;
export const isOnline = (): boolean => db !== null;

function readConfig(): Record<string, unknown> | null {
    const raw = globals().__firebase_config;
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return parsed && typeof parsed.projectId === 'string' ? parsed : null;
    } catch {
        return null;
    }
}

/** Resolves true when cloud sync is active, false for local-only mode. Never throws. */
export function initCloud(): Promise<boolean> {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        const config = readConfig();
        if (!config) return false;
        try {
            const [{ initializeApp }, { getAuth, signInAnonymously, signInWithCustomToken }, fs] = await Promise.all([
                import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
            ]);
            const g = globals();
            if (g.__app_id) appId = g.__app_id;
            const app = initializeApp(config);
            const auth = getAuth(app);
            if (g.__initial_auth_token) await signInWithCustomToken(auth, g.__initial_auth_token);
            else await signInAnonymously(auth);
            uid = auth.currentUser?.uid ?? 'local-user';
            db = fs.getFirestore(app);
            return true;
        } catch (e) {
            console.warn('Cloud sync unavailable, running local-only:', e);
            db = null;
            return false;
        }
    })();
    return initPromise;
}

const str = (v: unknown, fallback: string): string => (typeof v === 'string' && v ? v : fallback);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function saveProgress(score: number, level: number): Promise<boolean> {
    if (!db) return false;
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const updatedAt = new Date();
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'progress', 'game_state'), { score, level, updatedAt }, { merge: true });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', uid), { userId: uid, score, level, date: updatedAt }, { merge: true });
        return true;
    } catch (e) {
        console.warn('Cloud save error:', e);
        return false;
    }
}

export async function publishPost(title: string, content: string): Promise<boolean> {
    if (!db) return false;
    try {
        const { collection, addDoc } = await import('firebase/firestore');
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blog_posts'), { title, content, userId: uid, date: new Date() });
        return true;
    } catch (e) {
        console.warn('Publish error:', e);
        return false;
    }
}

/** Subscribe to leaderboard + blog feeds. Returns an unsubscribe function (no-op offline). */
export async function subscribeFeeds(
    onScores: (rows: ScoreEntry[]) => void,
    onPosts: (rows: BlogPost[]) => void,
): Promise<() => void> {
    if (!db) return () => {};
    const { collection, onSnapshot } = await import('firebase/firestore');
    const offScores = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'), snap => {
        const rows = snap.docs.map(d => {
            const x = d.data();
            return { userId: str(x.userId, 'unknown'), score: num(x.score), level: num(x.level) };
        });
        rows.sort((a, b) => b.score - a.score);
        onScores(rows.slice(0, 10));
    }, err => console.warn('Leaderboard snapshot error:', err));
    const offPosts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'blog_posts'), snap => {
        onPosts(snap.docs.map(d => {
            const x = d.data();
            return { id: d.id, title: str(x.title, 'Untitled'), content: str(x.content, ''), userId: str(x.userId, 'unknown') };
        }));
    }, err => console.warn('Blog snapshot error:', err));
    return () => { offScores(); offPosts(); };
}
