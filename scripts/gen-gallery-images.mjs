/**
 * gen-gallery-images.mjs
 *
 * Scans each gallery directory for image files and writes an images.json
 * manifest that the gallery HTML pages fetch at runtime.
 *
 * Usage:  node scripts/gen-gallery-images.mjs
 *
 * Each gallery folder may optionally contain an `images/` sub-directory.
 * Any .jpg/.jpeg/.png/.webp/.gif/.avif files found there are listed in the
 * output JSON as relative paths (e.g. "images/photo-01.jpg").
 *
 * Single source-of-truth: in normal builds (GALLERY_ROOT env var NOT set)
 * manifests are written exclusively to public/galleries/<gallery>/images.json
 * so Vite reliably copies the correct manifest into dist/.  The galleries/
 * source tree contains images but NO images.json files.
 *
 * GALLERY_ROOT env var is used only during tests to point at a temp tree;
 * in that mode manifests are written inside that temp tree directly.
 */

import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Test mode: GALLERY_ROOT overrides the scan root and is also the output root.
const testMode = Boolean(process.env.GALLERY_ROOT);
const galleryRoot = testMode
  ? resolve(process.env.GALLERY_ROOT)
  : join(__dirname, "..", "galleries");

// In normal mode the canonical output is public/galleries/ (Vite public dir).
const outputRoot = testMode
  ? galleryRoot
  : join(__dirname, "..", "public", "galleries");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

const galleries = readdirSync(galleryRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const gallery of galleries) {
  const galleryDir = join(galleryRoot, gallery);
  const imagesDir = join(galleryDir, "images");

  let images = [];

  if (existsSync(imagesDir)) {
    // Prefer the images/ subdirectory when it exists
    images = readdirSync(imagesDir)
      .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .sort()
      .map((f) => `images/${f}`);
  }

  if (images.length === 0) {
    // Fall back: scan images stored directly in the gallery root
    images = readdirSync(galleryDir)
      .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .sort();
  }

  const json = JSON.stringify(images, null, 2) + "\n";
  const outDir = join(outputRoot, gallery);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "images.json"), json);
  console.log(`${gallery}: ${images.length} image(s) → ${testMode ? "" : "public/"}galleries/${gallery}/images.json`);
}
