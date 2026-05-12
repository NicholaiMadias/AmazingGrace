import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsDir, "..");
const SCRIPT = join(repoRoot, "scripts", "gen-gallery-images.mjs");

describe("Gallery manifest generator", () => {
  it("generates images.json with alphabetically sorted entries per gallery", () => {
    // Build a temp galleries/ tree:
    //   <tmp>/galleries/property-a/images/  ← photo-b.jpg, photo-a.jpg
    //   <tmp>/galleries/property-b/images/  ← shot-1.png
    const tempRoot = mkdtempSync(join(tmpdir(), "gallery-gen-test-"));
    const galleriesDir = join(tempRoot, "galleries");

    const propA = join(galleriesDir, "property-a", "images");
    const propB = join(galleriesDir, "property-b", "images");
    mkdirSync(propA, { recursive: true });
    mkdirSync(propB, { recursive: true });

    writeFileSync(join(propA, "photo-b.jpg"), "b");
    writeFileSync(join(propA, "photo-a.jpg"), "a");
    writeFileSync(join(propB, "shot-1.png"), "1");

    try {
      const result = spawnSync(process.execPath, [SCRIPT], {
        encoding: "utf8",
        env: { ...process.env, GALLERY_ROOT: galleriesDir },
      });

      expect(result.status, result.stderr).toBe(0);

      // property-a: two images, sorted alphabetically
      const manifestA: string[] = JSON.parse(
        readFileSync(join(galleriesDir, "property-a", "images.json"), "utf8"),
      );
      expect(manifestA).toEqual(["images/photo-a.jpg", "images/photo-b.jpg"]);

      // property-b: one image
      const manifestB: string[] = JSON.parse(
        readFileSync(join(galleriesDir, "property-b", "images.json"), "utf8"),
      );
      expect(manifestB).toEqual(["images/shot-1.png"]);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("writes an empty array for galleries without an images/ sub-directory", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "gallery-gen-empty-"));
    const galleriesDir = join(tempRoot, "galleries");

    // Gallery directory exists but has no images/ sub-dir
    mkdirSync(join(galleriesDir, "empty-gallery"), { recursive: true });

    try {
      const result = spawnSync(process.execPath, [SCRIPT], {
        encoding: "utf8",
        env: { ...process.env, GALLERY_ROOT: galleriesDir },
      });

      expect(result.status, result.stderr).toBe(0);

      const manifest: string[] = JSON.parse(
        readFileSync(join(galleriesDir, "empty-gallery", "images.json"), "utf8"),
      );
      expect(manifest).toEqual([]);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

describe("Gallery manifest single source-of-truth", () => {
  it("galleries/ source tree contains no committed images.json files (public/galleries/ is canonical)", () => {
    const galleriesDir = join(repoRoot, "galleries");
    const dirs = readdirSync(galleriesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const violations: string[] = [];
    for (const dir of dirs) {
      const candidate = join(galleriesDir, dir, "images.json");
      try {
        readFileSync(candidate);
        violations.push(`galleries/${dir}/images.json`);
      } catch {
        // expected — file should not exist
      }
    }

    expect(
      violations,
      `Duplicate manifests found; delete them — public/galleries/ is the only source-of-truth:\n  ${violations.join("\n  ")}`,
    ).toHaveLength(0);
  });
});
