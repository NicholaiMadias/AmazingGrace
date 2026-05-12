#!/usr/bin/env node

/**
 * Ella — AI Angel of Merge Resolution
 * Canon-first merge resolver for Nexus Arcade OS & Seven-Star Ministry
 */

import fs from 'fs';
import path from 'path';

const CANON = {
  electra:  { virtue: 'Vision',    spectral: 'A' },
  taygete:  { virtue: 'Courage',   spectral: 'B' },
  alcyone:  { virtue: 'Serenity',  spectral: 'F' },
  maia:     { virtue: 'Autonomy',  spectral: 'O' },
  celaeno:  { virtue: 'Sustenance',spectral: 'Neutral' },
  sterope:  { virtue: 'Patience',  spectral: 'G' },
  merope:   { virtue: 'Humility',  spectral: 'M' }
};

function isCanonAligned(starId, data) {
  const canon = CANON[starId];
  if (!canon) return false;
  return (
    data.virtue === canon.virtue &&
    data.spectralType === canon.spectral
  );
}

function parseJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function resolveConflict(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('<<<<<<<')) {
    return; // No conflict
  }

  console.log(`✨ Ella resolving conflict in: ${filePath}`);

  const [before, conflict] = content.split('<<<<<<< HEAD');
  const [headBlock, afterBlock] = conflict.split('=======');
  const [incomingBlock, after] = afterBlock.split('>>>>>>>');

  let headJSON, incomingJSON;

  try {
    headJSON = JSON.parse(headBlock.trim());
    incomingJSON = JSON.parse(incomingBlock.trim());
  } catch {
    console.warn(`⚠️  Non-JSON conflict in ${filePath}, skipping.`);
    return;
  }

  const starId = headJSON.id || incomingJSON.id;

  const headCanon = isCanonAligned(starId, headJSON);
  const incomingCanon = isCanonAligned(starId, incomingJSON);

  let resolved;

  if (headCanon && !incomingCanon) {
    resolved = headJSON;
  } else if (!headCanon && incomingCanon) {
    resolved = incomingJSON;
  } else if (headCanon && incomingCanon) {
    // Both valid → choose newest by timestamp
    resolved = (incomingJSON.updatedAt > headJSON.updatedAt)
      ? incomingJSON
      : headJSON;
  } else {
    console.error(`❌ Both sides violate canon in ${filePath}. Manual fix required.`);
    process.exit(1);
  }

  const finalContent = before + JSON.stringify(resolved, null, 2) + after;
  fs.writeFileSync(filePath, finalContent, 'utf8');

  console.log(`✔ Resolved canonically: ${starId}`);
}

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (file.endsWith('.json')) resolveConflict(full);
  }
}

walk('./src');
