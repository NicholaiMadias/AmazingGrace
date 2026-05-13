import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const SOURCE_FILE = 'matrix/StoryEngineSynthesis.jsx';
const PUBLIC_FILE = 'public/assets/StoryEngineSynthesis.jsx';

describe('Quick Click game integration', () => {
  it('implements scoring, Firestore persistence, and leaderboard paths', () => {
    const source = fs.readFileSync(SOURCE_FILE, 'utf8');

    expect(source).toContain('Quick Click');
    expect(source).toMatch(/setQuickClickScore\s*\(\s*\(prev\)\s*=>\s*prev\s*\+\s*10\s*\)/);
    expect(source).toContain("'game_stats', 'quick_click'");
    expect(source).toContain("'public', 'data', 'leaderboard'");
    expect(source).toContain('signInAnonymously(auth)');
    expect(source).toContain('const [quickClickTimeLeft, setQuickClickTimeLeft] = useState(20);');
  });

  it('keeps the public asset copy in sync with the source module', () => {
    const source = fs.readFileSync(SOURCE_FILE, 'utf8');
    const publicAsset = fs.readFileSync(PUBLIC_FILE, 'utf8');

    expect(publicAsset).toBe(source);
  });
});
