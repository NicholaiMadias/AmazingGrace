import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const libraryJson = JSON.parse(fs.readFileSync('stories/library.json', 'utf8'));

describe('Our Covenant of New Beginnings library integration', () => {
  it('registers the story with preview-safe relative path metadata', () => {
    const entries = Array.isArray(libraryJson.entries) ? libraryJson.entries : [];
    const entry = entries.find((item: { slug?: string }) => item.slug === 'our-covenant-of-new-beginnings');

    expect(entry).toBeTruthy();
    expect(entry.path).toBe('./our-covenant-of-new-beginnings/');
    expect(entry.series).toBe('Seven-Star Canon');
    expect(entry.summary).toContain('Eighth Sanctuary');
  });

  it('ships a story page without broken local hotlink placeholders', () => {
    const storyPath = 'stories/our-covenant-of-new-beginnings/index.html';
    expect(fs.existsSync(storyPath)).toBe(true);

    const html = fs.readFileSync(storyPath, 'utf8');
    expect(html).toContain('<h1 class="hero-title">Our Covenant of New Beginnings</h1>');
    expect(html).not.toContain('Ella.jpg');
  });

  it('includes the story page in Vite multi-page build inputs', () => {
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    expect(viteConfig).toContain('stories/our-covenant-of-new-beginnings/index.html');
  });
});
