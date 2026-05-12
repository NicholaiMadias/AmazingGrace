import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Cloudflare Pages configuration', () => {
  it('wrangler.toml sets the correct Pages build output directory', () => {
    const toml = fs.readFileSync('wrangler.toml', 'utf8');
    // Must point Cloudflare Pages at the Vite build output directory.
    expect(toml).toContain('pages_build_output_dir = "dist"');
  });

  it('wrangler.toml includes a compatibility_date', () => {
    const toml = fs.readFileSync('wrangler.toml', 'utf8');
    expect(toml).toMatch(/compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"/);
  });

  it('public/_headers file exists for Cloudflare Pages security headers', () => {
    expect(fs.existsSync('public/_headers')).toBe(true);
  });

  it('public/_headers contains essential security headers', () => {
    const headers = fs.readFileSync('public/_headers', 'utf8');
    expect(headers).toContain('X-Frame-Options');
    expect(headers).toContain('X-Content-Type-Options');
  });
});
