import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('story library blog entry', () => {
  it('includes the architectural JS synthesis as a blog entry in stories/library.json', () => {
    const libraryJson = JSON.parse(fs.readFileSync('stories/library.json', 'utf8'));
    const entries = Array.isArray(libraryJson.entries) ? libraryJson.entries : [];

    const entry = entries.find((e: { slug?: string }) => e.slug === 'blog-architectural-js-synthesis');
    expect(entry).toBeDefined();
    if (!entry) {
      return;
    }
    expect(entry.type).toBe('blog');
    expect(entry.path).toBe('./blog/architectural-js-synthesis.html');
  });

  it('references an existing blog HTML file', () => {
    expect(fs.existsSync('stories/blog/architectural-js-synthesis.html')).toBe(true);
  });

  it('publishes the secret management and Google authentication guide', () => {
    const libraryJson = JSON.parse(fs.readFileSync('stories/library.json', 'utf8'));
    const entry = libraryJson.entries.find(
      (e: { slug?: string }) => e.slug === 'blog-zero-overhead-secret-management-google-authentication'
    );

    expect(entry).toMatchObject({
      type: 'blog',
      path: './blog/zero-overhead-secret-management-google-authentication.html'
    });
    expect(fs.existsSync('stories/blog/zero-overhead-secret-management-google-authentication.html')).toBe(true);

    const html = fs.readFileSync(
      'stories/blog/zero-overhead-secret-management-google-authentication.html',
      'utf8'
    );
    expect(html).toContain('Workload Identity Federation');
    expect(html).toContain('Firebase Authentication');
    expect(html).toContain('  authenticate:');
    expect(html.indexOf('Further reading')).toBeGreaterThan(html.indexOf('</article>'));
    expect(html).not.toMatch(/YOUR_[A-Z_]+|DEPLOYMENT_ID|TODO/);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(fs.readFileSync('vite.config.ts', 'utf8')).toContain(
      'storiesBlogSecretManagement: resolve(__dirname, "stories/blog/zero-overhead-secret-management-google-authentication.html")'
    );
  });
});
