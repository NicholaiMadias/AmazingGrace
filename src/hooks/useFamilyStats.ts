import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-config';

export type FamilyStats = {
  karma: number;
  wisdom: number;
  integrity: number;
  community: number;
};

type UseFamilyStatsResult = {
  stats: FamilyStats;
  chainLevel: number;
  activeUser: string;
  syncStatus: string;
  syncError: string;
  isLoading: boolean;
};

const DEFAULT_STATS: Readonly<FamilyStats> = Object.freeze({
  karma: 120,
  wisdom: 85,
  integrity: 200,
  community: 150,
});

const DEFAULT_ACTIVE_USER = 'System';
const DEFAULT_CHAIN_LEVEL = 0;
const DEFAULT_SYNC_ERROR = '';

const toFiniteNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toDisplayName = (value: unknown, fallback = DEFAULT_ACTIVE_USER): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const buildStatsFromData = (data: Record<string, unknown> | undefined): FamilyStats => ({
  karma: toFiniteNumber(data?.karma, DEFAULT_STATS.karma),
  wisdom: toFiniteNumber(data?.wisdom, DEFAULT_STATS.wisdom),
  integrity: toFiniteNumber(data?.integrity, DEFAULT_STATS.integrity),
  community: toFiniteNumber(data?.community, DEFAULT_STATS.community),
});

const INITIAL_STATE: Readonly<UseFamilyStatsResult> = Object.freeze({
  stats: DEFAULT_STATS,
  chainLevel: DEFAULT_CHAIN_LEVEL,
  activeUser: DEFAULT_ACTIVE_USER,
  syncStatus: 'Connecting…',
  syncError: DEFAULT_SYNC_ERROR,
  isLoading: true,
});

const MISSING_STATS_STATE: Readonly<UseFamilyStatsResult> = Object.freeze({
  stats: DEFAULT_STATS,
  chainLevel: DEFAULT_CHAIN_LEVEL,
  activeUser: DEFAULT_ACTIVE_USER,
  syncStatus: 'Awaiting shared metrics',
  syncError: DEFAULT_SYNC_ERROR,
  isLoading: false,
});

const buildLiveState = (data: Record<string, unknown>): UseFamilyStatsResult => ({
  stats: buildStatsFromData(data),
  chainLevel: toFiniteNumber(data.chainLevel, DEFAULT_CHAIN_LEVEL),
  activeUser: toDisplayName(data.lastContributor),
  syncStatus: 'Live',
  syncError: DEFAULT_SYNC_ERROR,
  isLoading: false,
});

export function useFamilyStats(): UseFamilyStatsResult {
  const [state, setState] = useState<UseFamilyStatsResult>(INITIAL_STATE);

  useEffect(() => {
    const familyDocRef = doc(db, 'ministry_metrics', 'family_stats');

    return onSnapshot(
      familyDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setState(MISSING_STATS_STATE);
          return;
        }

        const data = docSnap.data() as Record<string, unknown>;

        setState(buildLiveState(data));
      },
      (error) => {
        console.error('Firebase Sync Error:', error);
        setState(currentState => ({
          ...currentState,
          syncStatus: 'Offline fallback',
          syncError: 'Live ministry metrics could not be loaded.',
          isLoading: false,
        }));
      }
    );
  }, []);

  return state;
}
