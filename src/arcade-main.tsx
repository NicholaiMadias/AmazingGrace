import React, { memo } from 'react';
import { createRoot } from 'react-dom/client';
import MatrixOfConscience from './components/MatrixOfConscience';
import { useFamilyStats } from './hooks/useFamilyStats';
import styles from './arcade-main.module.css';

type FamilyStats = {
  karma: number;
  wisdom: number;
  integrity: number;
  community: number;
};

type StatChipProps = {
  label: string;
  value: number;
};

const StatChip = memo(function StatChip({ label, value }: StatChipProps) {
  return (
    <div className={styles.statChip} aria-label={`${label}: ${value}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonPanel} aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`skeleton-stat-${index}`} className={styles.skeletonChip} />
      ))}
      <div className={styles.skeletonChainCard} />
    </div>
  );
}

function ArcadeApp() {
  const { stats, chainLevel, activeUser, syncStatus, syncError, isLoading } = useFamilyStats();

  const statEntries: Array<{ label: string; value: number }> = [
    { label: 'Karma', value: stats.karma },
    { label: 'Wisdom', value: stats.wisdom },
    { label: 'Integrity', value: stats.integrity },
    { label: 'Community', value: stats.community },
  ];

  const homeHref = import.meta.env.BASE_URL || '/';

  return (
    <main className={styles.main}>
      <section className={styles.section} aria-labelledby="nexus-arcade-title">
        <header className={styles.header}>
          <div>
            <h1 id="nexus-arcade-title" className={styles.title}>
              NEXUS ARCADE
            </h1>
            <p className={styles.subtitle}>Family Synergy System</p>
          </div>

          <div className={styles.syncPanel}>
            <div className={styles.syncLabel}>SYNC STATUS</div>
            <div className={styles.syncValue} aria-live="polite" aria-atomic="true">
              {syncStatus}
            </div>
            <div className={styles.contributor}>Active contributor: {activeUser}</div>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <section className={styles.statsPanel} aria-label="Family synergy metrics">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {statEntries.map((entry) => (
                  <StatChip key={entry.label} label={entry.label} value={entry.value} />
                ))}

                <div className={styles.chainCard} aria-label={`Chain level: ${chainLevel}`}>
                  <div className={styles.chainLabel}>CHAIN LEVEL</div>
                  <div className={styles.chainValue}>{chainLevel}</div>
                  {syncError ? <p className={styles.errorText}>{syncError}</p> : null}
                </div>
              </>
            )}
          </section>

          <section className={styles.matrixPanel} aria-label="Matrix of Conscience visualization">
            <MatrixOfConscience stats={stats as FamilyStats} chainLevel={chainLevel} activeUser={activeUser} />
          </section>
        </div>

        <nav className={styles.nav} aria-label="Arcade navigation">
          <a href={homeHref} className={styles.backLink} aria-label="Back to Sanctuary home">
            Back to Sanctuary
          </a>
        </nav>
      </section>
    </main>
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found.');
}

createRoot(container).render(
  <React.StrictMode>
    <ArcadeApp />
  </React.StrictMode>
);
