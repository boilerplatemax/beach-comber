#!/usr/bin/env node
// Build assets/audio/voices/manifest.json by scanning the voices folder.
// The browser can't list a directory at runtime, so this script does it at
// author time: it walks  assets/audio/voices/<npc>/<mood>/*.wav  and writes a
// manifest the game fetches once at startup.
//
// Output shape:  { "<npc>": { "<mood>": ["file1.wav", "file2.wav", ...] } }
// (filenames only; the loader composes  voices/<npc>/<mood>/<file>.)
//
// Run it after you add, remove, or rename any clip, or add a new mood/npc folder:
//     node tools/build-voice-manifest.js
// It discovers npcs, moods and files from the folders, so nothing is hardcoded.

const fs = require('fs');
const path = require('path');

const VOICES_DIR = path.join(__dirname, '..', 'assets', 'audio', 'voices');
const OUT = path.join(VOICES_DIR, 'manifest.json');

function listDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== '__MACOSX')
    .map(d => d.name).sort();
}
function listWavs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && /\.wav$/i.test(d.name) && !d.name.startsWith('.'))
    .map(d => d.name).sort();
}

if (!fs.existsSync(VOICES_DIR)) {
  console.error('voices dir not found:', VOICES_DIR);
  process.exit(1);
}

const manifest = {};
let total = 0;
for (const npc of listDirs(VOICES_DIR)) {
  const npcDir = path.join(VOICES_DIR, npc);
  const moods = {};
  for (const mood of listDirs(npcDir)) {
    const files = listWavs(path.join(npcDir, mood));
    if (files.length) { moods[mood] = files; total += files.length; }
  }
  if (Object.keys(moods).length) manifest[npc] = moods;
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');

const summary = Object.entries(manifest)
  .map(([npc, moods]) => `${npc}: ` + Object.entries(moods).map(([m, f]) => `${m}=${f.length}`).join(', '))
  .join(' | ');
console.log(`wrote ${path.relative(path.join(__dirname, '..'), OUT)}  (${total} clips)  ${summary}`);
