#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /coming soon/i,
  /todo\b/i,
  /TBD\b/i,
  /#\s*placeholder/i
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isHtml(file) {
  return file.toLowerCase().endsWith(".html");
}

function fileExistsFromHref(href, currentFile) {
  if (!href || href.startsWith("#")) return true;
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  if (href.startsWith("javascript:")) return false;

  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return true;

  let resolved;
  if (clean.startsWith("/")) {
    resolved = path.join(DIST_DIR, clean);
  } else {
    resolved = path.resolve(path.dirname(currentFile), clean);
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return true;
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return fs.existsSync(path.join(resolved, "index.html"));
  }

  if (!path.extname(resolved)) {
    if (fs.existsSync(`${resolved}.html`)) return true;
    if (fs.existsSync(path.join(resolved, "index.html"))) return true;
  }

  return false;
}

function extractHrefs(html) {
  const hrefs = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ dist folder not found: ${DIST_DIR}`);
    process.exit(1);
  }

  const files = walk(DIST_DIR);
  const htmlFiles = files.filter(isHtml);

  const broken = [];
  const placeholders = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, "utf8");

    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) {
        placeholders.push({ file, pattern: String(pattern) });
      }
    }

    const hrefs = extractHrefs(content);
    for (const href of hrefs) {
      if (!fileExistsFromHref(href, file)) {
        broken.push({ file, href });
      }
    }
  }

  if (placeholders.length) {
    console.error("❌ Placeholder-like content found:");
    for (const p of placeholders) {
      console.error(` - ${path.relative(process.cwd(), p.file)} matched ${p.pattern}`);
    }
  }

  if (broken.length) {
    console.error("❌ Broken internal links found:");
    for (const b of broken) {
      console.error(` - ${path.relative(process.cwd(), b.file)} -> ${b.href}`);
    }
  }

  if (placeholders.length || broken.length) {
    process.exit(1);
  }

  console.log("✅ Quality gate passed: no broken internal links and no placeholder patterns found.");
}

main();
