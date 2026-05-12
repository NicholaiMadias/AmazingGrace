/**
 * build-galleries.mjs
 *
 * Scans public/images/ subdirectories and writes public/galleries.json.
 *
 * Output format:
 * {
 *   "926":        ["/images/926/photo1.jpg", ...],
 *   "1144":       [...],
 *   "1142":       [...],
 *   "ministry":   [...],
 *   "ministries": [...]
 * }
 *
 * Run:  node scripts/build-galleries.mjs
 * Or:   npm run build:galleries
 */

import { readdirSync, writeFileSync, statSync } from "fs";
import { join, extname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT      = join(__dirname, "..");
const IMAGES_DIR = join(ROOT, "public", "images");
const OUTPUT    = join(ROOT, "public", "galleries.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const GALLERY_KEYS = ["926", "1144", "1142", "ministry", "ministries", "tampa-property"];

function scanDir(dir) {
  try {
    return readdirSync(dir)
      .filter(f => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
      .sort()
      .map(f => `/images/${relative(IMAGES_DIR, join(dir, f)).replace(/\\/g, "/")}`);
  } catch {
    return [];
  }
}

const galleries = {};
for (const key of GALLERY_KEYS) {
  galleries[key] = scanDir(join(IMAGES_DIR, key));
}

writeFileSync(OUTPUT, JSON.stringify(galleries, null, 2) + "\n");
console.log("[build-galleries] wrote", OUTPUT);
for (const [key, imgs] of Object.entries(galleries)) {
  console.log(`  ${key}: ${imgs.length} image(s)`);
}
